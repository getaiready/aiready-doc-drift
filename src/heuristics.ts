import { DESCRIPTIVE_PARAMS } from './constants';
import { ExportInfo } from '@aiready/core';

/**
 * Checks if documentation for an export correctly covers its parameters.
 * Returns a list of missing parameters that are NOT in DESCRIPTIVE_PARAMS.
 */
export function getMissingParams(exp: ExportInfo): string[] {
  if (exp.type !== 'function' || !exp.parameters || !exp.documentation) {
    return [];
  }

  const docContent = exp.documentation.content;
  const params = exp.parameters;

  return params.filter((p) => {
    // Skip descriptive parameters that don't need documentation
    if (DESCRIPTIVE_PARAMS.has(p.toLowerCase())) {
      return false;
    }
    const regex = new RegExp(`\\b${p}\\b`);
    return !regex.test(docContent);
  });
}

/**
 * Heuristic check if an export has high complexity but is undocumented.
 */
export function isUndocumentedComplexity(exp: ExportInfo): boolean {
  if (exp.documentation) return false;
  if (!exp.loc) return false;

  const lines = exp.loc.end.line - exp.loc.start.line;
  // Heuristic: more than 20 lines of code usually deserves documentation
  return lines > 20;
}

/**
 * Checks for temporal drift between documentation and code.
 */
export function hasTemporalDrift(
  bodyModified: number,
  docModified: number
): boolean {
  if (bodyModified <= 0 || docModified <= 0) return false;

  // If body was modified more than 1 day AFTER the documentation
  const DRIFT_THRESHOLD_SECONDS = 24 * 60 * 60;
  return bodyModified - docModified > DRIFT_THRESHOLD_SECONDS;
}
