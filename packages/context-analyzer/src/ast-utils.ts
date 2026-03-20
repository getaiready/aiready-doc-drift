import { parseFileExports } from '@aiready/core';
import type { ExportInfo } from './types';
import { inferDomain, extractExports } from './semantic/domain-inference';

/**
 * Extract exports using high-fidelity AST parsing across 5+ languages.
 *
 * @param content - File contents to parse.
 * @param filePath - Path to the file for language detection and context.
 * @param domainOptions - Optional configuration for domain detection.
 * @param fileImports - Optional array of strings for resolving imports.
 * @returns Array of high-fidelity export metadata.
 * @lastUpdated 2026-03-18
 */
export function extractExportsWithAST(
  content: string,
  filePath: string,
  domainOptions?: { domainKeywords?: string[] },
  fileImports?: string[]
): ExportInfo[] {
  try {
    const { exports: astExports } = parseFileExports(content, filePath);

    if (astExports.length === 0 && !isTestFile(filePath)) {
      // If AST fails to find anything, we still use regex as a last resort
      // ONLY for unknown file types or very complex macros
      return extractExports(content, filePath, domainOptions, fileImports);
    }

    return astExports.map((exp) => ({
      name: exp.name,
      type: exp.type as any,
      inferredDomain: inferDomain(
        exp.name,
        filePath,
        domainOptions,
        fileImports
      ),
      imports: exp.imports,
      dependencies: exp.dependencies,
      typeReferences: (exp as any).typeReferences,
    }));
  } catch {
    // Ultimate fallback
    return extractExports(content, filePath, domainOptions, fileImports);
  }
}

/**
 * Check if a file is a test, mock, or fixture file.
 *
 * @param filePath - The path to the file to check.
 * @returns True if the file matches test/mock patterns.
 */
export function isTestFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.includes('.test.') ||
    lower.includes('.spec.') ||
    lower.includes('/__tests__/') ||
    lower.includes('/tests/') ||
    lower.includes('/test/') ||
    lower.includes('test-') ||
    lower.includes('-test') ||
    lower.includes('/__mocks__/') ||
    lower.includes('/mocks/') ||
    lower.includes('/fixtures/') ||
    lower.includes('.mock.') ||
    lower.includes('.fixture.') ||
    lower.includes('/test-utils/')
  );
}

/**
 * Heuristic to check if all exports share a common entity noun
 */
export function allExportsShareEntityNoun(exports: ExportInfo[]): boolean {
  if (exports.length < 2) return true;

  const getEntityNoun = (name: string): string | null => {
    // Basic heuristic: last part of camelCase name often is the entity
    // e.g. createOrder -> order, getUserProfile -> profile
    // But we also look for common domain nouns in the middle
    const commonNouns = [
      'user',
      'order',
      'product',
      'session',
      'account',
      'receipt',
      'token',
    ];
    const lower = name.toLowerCase();

    for (const noun of commonNouns) {
      if (lower.includes(noun)) return noun;
    }

    // Fallback: split by capital letters and take the last part
    const parts = name.split(/(?=[A-Z])/);
    return parts[parts.length - 1].toLowerCase();
  };

  const nouns = exports.map((e) => getEntityNoun(e.name)).filter(Boolean);
  if (nouns.length < exports.length * 0.7) return false;

  const firstNoun = nouns[0];
  return nouns.every((n) => n === firstNoun);
}
