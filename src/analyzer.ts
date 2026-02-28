import {
  scanFiles,
  calculateDocDrift,
  getFileCommitTimestamps,
  getLineRangeLastModifiedCached,
} from '@aiready/core';
import type { DocDriftOptions, DocDriftReport, DocDriftIssue } from './types';
import { readFileSync } from 'fs';
import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/types';

export async function analyzeDocDrift(
  options: DocDriftOptions
): Promise<DocDriftReport> {
  // Use core scanFiles which respects .gitignore recursively
  const files = await scanFiles(options);
  const issues: DocDriftIssue[] = [];
  const staleMonths = options.staleMonths ?? 6;
  const staleSeconds = staleMonths * 30 * 24 * 60 * 60;

  let uncommentedExports = 0;
  let totalExports = 0;
  let outdatedComments = 0;
  let undocumentedComplexity = 0;

  const now = Math.floor(Date.now() / 1000);

  let processed = 0;
  for (const file of files) {
    processed++;
    options.onProgress?.(processed, files.length, `doc-drift: analyzing files`);

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
    let fileLineStamps: Record<number, number> | undefined;

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
            if (!fileLineStamps) {
              fileLineStamps = getFileCommitTimestamps(file);
            }
            const commentModified = getLineRangeLastModifiedCached(
              fileLineStamps,
              jsdoc.loc.start.line,
              jsdoc.loc.end.line
            );
            const bodyModified = getLineRangeLastModifiedCached(
              fileLineStamps,
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
