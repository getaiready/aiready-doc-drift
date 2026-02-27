import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';
import { calculateChangeAmplification } from '@aiready/core';
import type {
  ChangeAmplificationOptions,
  ChangeAmplificationReport,
  FileChangeAmplificationResult,
  ChangeAmplificationIssue,
} from './types';
import { getParser } from '@aiready/core';

function collectFiles(
  dir: string,
  options: ChangeAmplificationOptions
): string[] {
  const includePatterns =
    options.include && options.include.length > 0
      ? options.include
      : ['**/*.{ts,tsx,js,jsx,py,go}'];
  const excludePatterns =
    options.exclude && options.exclude.length > 0
      ? options.exclude
      : ['**/node_modules/**', '**/dist/**', '**/.git/**'];

  let matchedFiles: string[] = [];
  for (const pattern of includePatterns) {
    const files = globSync(pattern, {
      cwd: dir,
      ignore: excludePatterns,
      absolute: true,
    });
    matchedFiles = matchedFiles.concat(files);
  }
  return [...new Set(matchedFiles)];
}

export async function analyzeChangeAmplification(
  options: ChangeAmplificationOptions
): Promise<ChangeAmplificationReport> {
  const rootDir = path.resolve(options.rootDir || '.');
  const files = collectFiles(rootDir, options);

  // Compute graph metrics: fanIn and fanOut
  const dependencyGraph = new Map<string, string[]>(); // key: file, value: imported files
  const reverseGraph = new Map<string, string[]>(); // key: file, value: files that import it

  // Initialize graph
  for (const file of files) {
    dependencyGraph.set(file, []);
    reverseGraph.set(file, []);
  }

  // Parse files to build dependency graph
  for (const file of files) {
    try {
      const parser = getParser(file);
      if (!parser) continue;

      const content = fs.readFileSync(file, 'utf8');
      const parseResult = parser.parse(content, file);
      const dependencies = parseResult.imports.map((i) => i.source);

      for (const dep of dependencies) {
        // Resolve simple relative or absolute imports for the graph
        // This is a simplified resolution for demonstration purposes
        const depDir = path.dirname(file);

        // Find if this dependency resolves to one of our mapped files
        const resolvedPath = files.find((f) => {
          if (dep.startsWith('.')) {
            return f.startsWith(path.resolve(depDir, dep));
          } else {
            return f.includes(dep);
          }
        });

        if (resolvedPath) {
          dependencyGraph.get(file)?.push(resolvedPath);
          reverseGraph.get(resolvedPath)?.push(file);
        }
      }
    } catch (err) {
      void err;
    }
  }

  const fileMetrics = files.map((file) => {
    const fanOut = dependencyGraph.get(file)?.length || 0;
    const fanIn = reverseGraph.get(file)?.length || 0;
    return { file, fanOut, fanIn };
  });

  const riskResult = calculateChangeAmplification({ files: fileMetrics });

  const results: FileChangeAmplificationResult[] = [];

  for (const hotspot of riskResult.hotspots) {
    const issues: ChangeAmplificationIssue[] = [];
    if (hotspot.amplificationFactor > 20) {
      issues.push({
        type: 'change-amplification',
        severity: hotspot.amplificationFactor > 40 ? 'critical' : 'major',
        message: `High change amplification detected (Factor: ${hotspot.amplificationFactor}). Changes here cascade heavily.`,
        location: { file: hotspot.file, line: 1 },
        suggestion: `Reduce coupling. Fan-out is ${hotspot.fanOut}, Fan-in is ${hotspot.fanIn}.`,
      });
    }

    // We only push results for files that have either high fan-in or fan-out
    if (hotspot.amplificationFactor > 5) {
      results.push({
        fileName: hotspot.file,
        issues,
        metrics: {
          aiSignalClarityScore: 100 - hotspot.amplificationFactor, // Just a rough score
        },
      });
    }
  }

  return {
    summary: {
      totalFiles: files.length,
      totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
      criticalIssues: results.reduce(
        (sum, r) =>
          sum + r.issues.filter((i) => i.severity === 'critical').length,
        0
      ),
      majorIssues: results.reduce(
        (sum, r) => sum + r.issues.filter((i) => i.severity === 'major').length,
        0
      ),
      score: riskResult.score,
      rating: riskResult.rating,
      recommendations: riskResult.recommendations,
    },
    results,
  };
}
