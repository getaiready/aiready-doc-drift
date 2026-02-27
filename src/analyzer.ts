import { calculateDocDrift } from '@aiready/core';
import type { DocDriftOptions, DocDriftReport, DocDriftIssue } from './types';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/types';
import { execSync } from 'child_process';

const SRC_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const DEFAULT_EXCLUDES = [
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '.turbo',
  'build',
];

function collectFiles(
  dir: string,
  options: DocDriftOptions,
  depth = 0
): string[] {
  if (depth > 20) return [];
  const excludes = [...DEFAULT_EXCLUDES, ...(options.exclude ?? [])];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (excludes.some((ex) => entry === ex || entry.includes(ex))) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      files.push(...collectFiles(full, options, depth + 1));
    } else if (stat.isFile() && SRC_EXTENSIONS.has(extname(full))) {
      if (!options.include || options.include.some((p) => full.includes(p))) {
        files.push(full);
      }
    }
  }
  return files;
}

function getLineRangeLastModified(
  file: string,
  startLine: number,
  endLine: number
): number {
  try {
    // format %ct is committer date, UNIX timestamp
    const output = execSync(
      `git log -1 --format=%ct -L ${startLine},${endLine}:"${file}"`,
      {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    const match = output.trim().split('\n')[0];
    if (match && !isNaN(parseInt(match, 10))) {
      return parseInt(match, 10);
    }
  } catch {
    // Ignore errors (file untracked, new file, etc)
  }
  return 0; // Unknown or not committed
}

export async function analyzeDocDrift(
  options: DocDriftOptions
): Promise<DocDriftReport> {
  const rootDir = options.rootDir;
  const files = collectFiles(rootDir, options);
  const staleMonths = options.staleMonths ?? 6;
  const staleSeconds = staleMonths * 30 * 24 * 60 * 60;

  let uncommentedExports = 0;
  let totalExports = 0;
  let outdatedComments = 0;
  let undocumentedComplexity = 0;

  const issues: DocDriftIssue[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (const file of files) {
    let code: string;
    try {
      code = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    let ast: TSESTree.Program;
    try {
      ast = parse(code, {
        jsx: file.endsWith('.tsx') || file.endsWith('.jsx'),
        loc: true,
        comment: true,
      });
    } catch {
      continue;
    }

    const comments = ast.comments || [];

    for (const node of ast.body) {
      if (
        node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportDefaultDeclaration'
      ) {
        const decl = (node as any).declaration;
        if (!decl) continue;

        // Count exports
        if (
          decl.type === 'FunctionDeclaration' ||
          decl.type === 'ClassDeclaration' ||
          decl.type === 'VariableDeclaration'
        ) {
          totalExports++;

          // Find associated JSDoc comment (immediately preceding the export)
          const nodeLine = node.loc.start.line;
          const jsdocs = comments.filter(
            (c: any) =>
              c.type === 'Block' &&
              c.value.startsWith('*') &&
              c.loc.end.line === nodeLine - 1
          );

          if (jsdocs.length === 0) {
            uncommentedExports++;

            // Check for undocumented complexity (e.g., function body > 20 lines)
            if (decl.type === 'FunctionDeclaration' && decl.body?.loc) {
              const lines = decl.body.loc.end.line - decl.body.loc.start.line;
              if (lines > 20) undocumentedComplexity++;
            }
          } else {
            const jsdoc = jsdocs[0];
            const jsdocText = jsdoc.value;

            // Signature mismatch detection
            if (decl.type === 'FunctionDeclaration') {
              const params = decl.params
                .map((p: any) => p.name || (p.left && p.left.name))
                .filter(Boolean);
              const paramTags = Array.from(
                jsdocText.matchAll(/@param\s+(?:\{[^}]+\}\s+)?([a-zA-Z0-9_]+)/g)
              ).map((m: any) => m[1]);

              const missingParams = params.filter(
                (p: string) => !paramTags.includes(p)
              );
              if (missingParams.length > 0) {
                outdatedComments++;
                issues.push({
                  type: 'doc-drift',
                  severity: 'major',
                  message: `JSDoc @param mismatch: function has parameters (${missingParams.join(', ')}) not documented in JSDoc.`,
                  location: { file, line: nodeLine },
                });
                continue; // already counted as outdated
              }
            }

            // Timestamp comparison
            const commentModified = getLineRangeLastModified(
              file,
              jsdoc.loc.start.line,
              jsdoc.loc.end.line
            );
            const bodyModified = getLineRangeLastModified(
              file,
              decl.loc.start.line,
              decl.loc.end.line
            );

            if (commentModified > 0 && bodyModified > 0) {
              // If body was modified much later than the comment, and comment is older than staleMonths
              if (
                now - commentModified > staleSeconds &&
                bodyModified - commentModified > staleSeconds / 2
              ) {
                outdatedComments++;
                issues.push({
                  type: 'doc-drift',
                  severity: 'minor',
                  message: `JSDoc is significantly older than the function body implementation. Code may have drifted.`,
                  location: { file, line: jsdoc.loc.start.line },
                });
              }
            }
          }
        }
      }
    }
  }

  const riskResult = calculateDocDrift({
    uncommentedExports,
    totalExports,
    outdatedComments,
    undocumentedComplexity,
  });

  return {
    summary: {
      filesAnalyzed: files.length,
      functionsAnalyzed: totalExports,
      score: riskResult.score,
      rating: riskResult.rating,
    },
    issues,
    rawData: {
      uncommentedExports,
      totalExports,
      outdatedComments,
      undocumentedComplexity,
    },
    recommendations: riskResult.recommendations,
  };
}
