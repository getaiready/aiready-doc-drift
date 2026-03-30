import type {
  ContextAnalysisResult,
  ContextSummary,
  ModuleCluster,
} from './types';
import { GLOBAL_SCAN_OPTIONS } from '@aiready/core';
import { calculatePathEntropy } from './metrics';

/**
 * Generate summary of context analysis results
 *
 * @param results - Array of individual file analysis results.
 * @param options - Optional scan configuration for context extraction.
 * @returns A consolidated summary of the entire context scan.
 */
export function generateSummary(
  results: ContextAnalysisResult[],
  options: any = {}
): ContextSummary {
  const config: Record<string, any> = options
    ? Object.fromEntries(
        Object.entries(options).filter(
          ([key]) => !GLOBAL_SCAN_OPTIONS.includes(key) || key === 'rootDir'
        )
      )
    : {};

  const totalFiles = results.length;
  const totalTokens = results.reduce((sum, r) => sum + r.tokenCost, 0);
  const avgContextBudget =
    totalFiles > 0
      ? results.reduce((sum, r) => sum + r.contextBudget, 0) / totalFiles
      : 0;

  // Find deep files
  const deepFiles = results
    .filter((r) => r.importDepth > 5)
    .map((r) => ({ file: r.file, depth: r.importDepth }));

  const maxImportDepth = Math.max(0, ...results.map((r) => r.importDepth));

  // Find fragmented modules (clusters)
  const moduleMap = new Map<string, ContextAnalysisResult[]>();
  const rootDir = config.rootDir || '';

  results.forEach((r) => {
    // Calculate relative path from root directory
    let relativePath = r.file;
    if (rootDir && r.file.startsWith(rootDir)) {
      relativePath = r.file.slice(rootDir.length);
      if (relativePath.startsWith('/')) relativePath = relativePath.slice(1);
    }

    const parts = relativePath.split('/');

    // Try to identify domain/module (e.g., packages/core, src/utils)
    // For monorepos, look for 'packages/<name>' or 'apps/<name>' patterns
    let domain = 'root';

    // Find meaningful domain directory
    const domainIndicators = ['packages', 'apps', 'src', 'lib', 'modules'];
    for (let i = 0; i < parts.length - 1; i++) {
      if (domainIndicators.includes(parts[i]) && parts[i + 1]) {
        domain = `${parts[i]}/${parts[i + 1]}`;
        break;
      }
    }

    // Fallback: use first meaningful directory
    if (domain === 'root' && parts.length > 1) {
      // Skip common non-domain prefixes
      const skipPrefixes = [
        'src',
        'lib',
        'dist',
        'build',
        'out',
        'node_modules',
      ];
      for (let i = 0; i < parts.length - 1; i++) {
        if (!skipPrefixes.includes(parts[i]) && parts[i] !== '') {
          domain = parts[i];
          break;
        }
      }
    }

    if (!moduleMap.has(domain)) moduleMap.set(domain, []);
    moduleMap.get(domain)!.push(r);
  });

  const fragmentedModules: ModuleCluster[] = [];
  moduleMap.forEach((files, domain) => {
    const clusterTokens = files.reduce((sum, f) => sum + f.tokenCost, 0);
    const filePaths = files.map((f) => f.file);
    const avgEntropy = calculatePathEntropy(filePaths);
    const avgCohesion =
      files.reduce((sum, f) => sum + f.cohesionScore, 0) / files.length;

    // For monorepos, files within a domain are naturally organized into subdirectories.
    // Fragmentation should only be high if:
    // 1. Files are spread across many unrelated directories (high entropy)
    // 2. AND the cohesion is low (files don't share types/imports)
    // 3. AND there are many files (small domains are less concerning)
    //
    // Use a more lenient calculation that accounts for monorepo structure:
    // - Low cohesion (< 0.5) contributes to fragmentation
    // - High entropy contributes to fragmentation
    // - But allow for subdirectory organization within a domain
    const cohesionFactor = avgCohesion < 0.5 ? (0.5 - avgCohesion) * 2 : 0;
    const entropyFactor = avgEntropy > 0.7 ? (avgEntropy - 0.7) * 3.33 : 0;
    const sizeFactor =
      files.length > 20 ? Math.min(1, (files.length - 20) / 80) : 0;

    // Combined fragmentation score with lower weight for entropy in monorepos
    const fragmentationScore = Math.min(
      1,
      cohesionFactor * 0.5 + entropyFactor * 0.3 + sizeFactor * 0.2
    );

    if (fragmentationScore > 0.4) {
      fragmentedModules.push({
        domain,
        files: filePaths,
        fragmentationScore,
        totalTokens: clusterTokens,
        avgCohesion,
        suggestedStructure: {
          targetFiles: Math.ceil(files.length / 2),
          consolidationPlan: [
            `Consolidate ${files.length} files in ${domain} into fewer modules`,
          ],
        },
      });
    }
  });

  fragmentedModules.sort((a, b) => b.fragmentationScore - a.fragmentationScore);

  const avgFragmentation =
    fragmentedModules.length > 0
      ? fragmentedModules.reduce((sum, m) => sum + m.fragmentationScore, 0) /
        fragmentedModules.length
      : 0;

  // Cohesion
  const avgCohesion =
    results.reduce((sum, r) => sum + r.cohesionScore, 0) / (totalFiles || 1);

  const lowCohesionFiles = results
    .filter((r) => r.cohesionScore < 0.4)
    .map((r) => ({ file: r.file, score: r.cohesionScore }));

  // Issues
  const criticalIssues = results.filter(
    (r) => r.severity === 'critical'
  ).length;
  const majorIssues = results.filter((r) => r.severity === 'major').length;
  const minorIssues = results.filter((r) => r.severity === 'minor').length;

  const totalPotentialSavings = results.reduce(
    (sum, r) => sum + (r.potentialSavings || 0),
    0
  );

  const topExpensiveFiles = [...results]
    .sort((a, b) => b.contextBudget - a.contextBudget)
    .slice(0, 10)
    .map((r) => ({
      file: r.file,
      contextBudget: r.contextBudget,
      severity: r.severity,
    }));

  return {
    totalFiles,
    totalTokens,
    avgContextBudget,
    maxContextBudget: Math.max(0, ...results.map((r) => r.contextBudget)),
    avgImportDepth:
      results.reduce((sum, r) => sum + r.importDepth, 0) / (totalFiles || 1),
    maxImportDepth,
    deepFiles,
    avgFragmentation,
    fragmentedModules,
    avgCohesion,
    lowCohesionFiles,
    criticalIssues,
    majorIssues,
    minorIssues,
    totalPotentialSavings,
    topExpensiveFiles,
    config,
  };
}
