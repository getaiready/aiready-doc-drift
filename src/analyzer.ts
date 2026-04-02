import {
  scanFiles,
  calculateDocDrift,
  getFileCommitTimestamps,
  getLineRangeLastModifiedCached,
  Severity,
  IssueType,
  emitProgress,
  getParser,
} from '@aiready/core';
import type { DocDriftOptions, DocDriftReport, DocDriftIssue } from './types';
import { readFileSync } from 'fs';
import {
  getMissingParams,
  isUndocumentedComplexity,
  hasTemporalDrift,
} from './heuristics';

/**
 * Analyzes documentation drift across a set of files.
 */
export async function analyzeDocDrift(
  options: DocDriftOptions
): Promise<DocDriftReport> {
  const files = await scanFiles(options);
  const issues: DocDriftIssue[] = [];

  let uncommentedExports = 0;
  let totalExports = 0;
  let outdatedComments = 0;
  let undocumentedComplexityCount = 0;
  let actualDrift = 0;

  let processed = 0;
  for (const file of files) {
    processed++;
    emitProgress(
      processed,
      files.length,
      'doc-drift',
      'analyzing files',
      options.onProgress
    );

    const parser = await getParser(file);
    if (!parser) continue;

    let code: string;
    try {
      code = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    try {
      await parser.initialize();
      const parseResult = parser.parse(code, file);

      let fileLineStamps: Record<number, number> | undefined;

      for (const exp of parseResult.exports) {
        if (exp.type === 'function' || exp.type === 'class') {
          totalExports++;

          if (!exp.documentation) {
            uncommentedExports++;
            if (isUndocumentedComplexity(exp)) undocumentedComplexityCount++;
          } else {
            const doc = exp.documentation;

            // Check for missing parameters in documentation
            const missingParams = getMissingParams(exp);
            if (missingParams.length > 0) {
              outdatedComments++;
              issues.push({
                type: IssueType.DocDrift,
                severity: Severity.Major,
                message: `Documentation mismatch: function parameters (${missingParams.join(', ')}) are not mentioned in the docs.`,
                location: { file, line: exp.loc?.start.line || 1 },
              });
            }

            // Check for temporal drift
            if (exp.loc && doc.loc) {
              if (!fileLineStamps)
                fileLineStamps = getFileCommitTimestamps(file);

              const bodyModified = getLineRangeLastModifiedCached(
                fileLineStamps,
                exp.loc.start.line,
                exp.loc.end.line
              );
              const docModified = getLineRangeLastModifiedCached(
                fileLineStamps,
                doc.loc.start.line,
                doc.loc.end.line
              );

              if (hasTemporalDrift(bodyModified, docModified)) {
                actualDrift++;
                issues.push({
                  type: IssueType.DocDrift,
                  severity: Severity.Major,
                  message: `Documentation drift: logic was modified on ${new Date(bodyModified * 1000).toLocaleDateString()} but documentation was last updated on ${new Date(docModified * 1000).toLocaleDateString()}.`,
                  location: { file, line: doc.loc.start.line },
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Doc-drift: Failed to parse ${file}: ${error}`);
      continue;
    }
  }

  const riskResult = calculateDocDrift({
    uncommentedExports,
    totalExports,
    outdatedComments,
    undocumentedComplexity: undocumentedComplexityCount,
    actualDrift,
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
      undocumentedComplexity: undocumentedComplexityCount,
      actualDrift,
    },
    recommendations: riskResult.recommendations,
  };
}
