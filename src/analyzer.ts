/**
 * Main analyzer for AI signal clarity.
 * Scans all TS/JS files in a directory and aggregates signals.
 */

import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { scanFile } from './scanner';
import { calculateAiSignalClarity } from '@aiready/core';
import type { AiSignalClarityOptions, AiSignalClarityReport, FileAiSignalClarityResult } from './types';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const DEFAULT_EXCLUDES = ['node_modules', 'dist', '.git', 'coverage', '.turbo', 'build', '__pycache__'];

function shouldInclude(filePath: string, include?: string[], exclude?: string[]): boolean {
  const excludePatterns = [...DEFAULT_EXCLUDES, ...(exclude ?? [])];
  for (const ex of excludePatterns) {
    if (filePath.includes(ex)) return false;
  }
  if (!SUPPORTED_EXTENSIONS.has(extname(filePath))) return false;
  if (include && include.length > 0) {
    return include.some(pat => filePath.includes(pat));
  }
  return true;
}

function collectFiles(dir: string, options: AiSignalClarityOptions, depth = 0): string[] {
  if (depth > (options.maxDepth ?? 20)) return [];
  const files: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      files.push(...collectFiles(full, options, depth + 1));
    } else if (stat.isFile() && shouldInclude(full, options.include, options.exclude)) {
      files.push(full);
    }
  }
  return files;
}

export async function analyzeAiSignalClarity(
  options: AiSignalClarityOptions,
): Promise<AiSignalClarityReport> {
  const files = collectFiles(options.rootDir, options);
  const results: FileAiSignalClarityResult[] = [];

  // Aggregate signals
  const aggregate = {
    magicLiterals: 0,
    booleanTraps: 0,
    ambiguousNames: 0,
    undocumentedExports: 0,
    implicitSideEffects: 0,
    deepCallbacks: 0,
    overloadedSymbols: 0,
    totalSymbols: 0,
    totalExports: 0,
  };

  for (const filePath of files) {
    const result = scanFile(filePath, options);
    results.push(result);
    for (const key of Object.keys(aggregate) as Array<keyof typeof aggregate>) {
      aggregate[key] += result.signals[key] ?? 0;
    }
  }

  // Calculate grounding score using core math (statically imported)
  const riskResult = calculateAiSignalClarity({
    overloadedSymbols: aggregate.overloadedSymbols,
    magicLiterals: aggregate.magicLiterals,
    booleanTraps: aggregate.booleanTraps,
    implicitSideEffects: aggregate.implicitSideEffects,
    deepCallbacks: aggregate.deepCallbacks,
    ambiguousNames: aggregate.ambiguousNames,
    undocumentedExports: aggregate.undocumentedExports,
    totalSymbols: Math.max(1, aggregate.totalSymbols),
    totalExports: Math.max(1, aggregate.totalExports),
  });

  // Count severities
  const allIssues = results.flatMap(r => r.issues);
  const criticalSignals = allIssues.filter(i => i.severity === 'critical').length;
  const majorSignals = allIssues.filter(i => i.severity === 'major').length;
  const minorSignals = allIssues.filter(i => i.severity === 'minor').length;

  // Filter by minSeverity
  const severityOrder = { info: 0, minor: 1, major: 2, critical: 3 };
  const minSev = options.minSeverity ?? 'info';
  const filteredResults = results.map(r => ({
    ...r,
    issues: r.issues.filter(i => severityOrder[i.severity] >= severityOrder[minSev]),
  }));

  return {
    summary: {
      filesAnalyzed: files.length,
      totalSignals: allIssues.length,
      criticalSignals,
      majorSignals,
      minorSignals,
      topRisk: riskResult.topRisk,
      rating: riskResult.rating,
    },
    results: filteredResults,
    aggregateSignals: aggregate,
    recommendations: riskResult.recommendations,
  };
}
