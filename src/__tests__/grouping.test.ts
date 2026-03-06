import { describe, it, expect } from 'vitest';
import {
  groupDuplicatesByFilePair,
  createRefactorClusters,
  filterClustersByImpact,
} from '../grouping';
import type { DuplicatePattern } from '../detector';
import { Severity } from '@aiready/core';

describe('grouping utilities', () => {
  describe('groupDuplicatesByFilePair', () => {
    it('should group duplicates by file pair', () => {
      const duplicates: DuplicatePattern[] = [
        {
          file1: 'a.ts',
          file2: 'b.ts',
          line1: 1,
          endLine1: 10,
          line2: 1,
          endLine2: 10,
          code1: '',
          code2: '',
          similarity: 0.95,
          patternType: 'function',
          tokenCost: 100,
          severity: Severity.Critical,
          reason: 'Test duplicate',
          suggestion: 'Extract to common function',
          matchedRule: undefined,
        },
        {
          file1: 'a.ts',
          file2: 'b.ts',
          line1: 20,
          endLine1: 30,
          line2: 20,
          endLine2: 30,
          code1: '',
          code2: '',
          similarity: 0.9,
          patternType: 'function',
          tokenCost: 80,
          severity: Severity.Major,
          reason: 'Another duplicate',
          suggestion: 'Consolidate logic',
          matchedRule: undefined,
        },
        {
          file1: 'c.ts',
          file2: 'd.ts',
          line1: 1,
          endLine1: 5,
          line2: 1,
          endLine2: 5,
          code1: '',
          code2: '',
          similarity: 0.85,
          patternType: 'utility',
          tokenCost: 50,
          severity: Severity.Minor,
          reason: 'Utility duplicate',
          suggestion: 'Share utility',
          matchedRule: undefined,
        },
      ];

      const groups = groupDuplicatesByFilePair(duplicates);

      expect(groups).toHaveLength(2);

      // Find the a.ts::b.ts group
      const abGroup = groups.find((g) => g.filePair === 'a.ts::b.ts');
      expect(abGroup).toBeDefined();
      expect(abGroup!.occurrences).toBe(2);
      expect(abGroup!.totalTokenCost).toBe(180);
      expect(abGroup!.averageSimilarity).toBeCloseTo(0.925, 2);
      expect(abGroup!.severity).toBe(Severity.Critical); // Highest severity
      expect(abGroup!.lineRanges).toHaveLength(2);

      // Find the c.ts::d.ts group
      const cdGroup = groups.find((g) => g.filePair === 'c.ts::d.ts');
      expect(cdGroup).toBeDefined();
      expect(cdGroup!.occurrences).toBe(1);
      expect(cdGroup!.totalTokenCost).toBe(50);
    });

    it('should normalize file pairs (a::b === b::a)', () => {
      const duplicates: DuplicatePattern[] = [
        {
          file1: 'a.ts',
          file2: 'b.ts',
          line1: 1,
          endLine1: 10,
          line2: 1,
          endLine2: 10,
          code1: '',
          code2: '',
          similarity: 0.9,
          patternType: 'function',
          tokenCost: 100,
          severity: Severity.Major,
          reason: 'Test',
          suggestion: 'Fix',
          matchedRule: undefined,
        },
        {
          file1: 'b.ts',
          file2: 'a.ts',
          line1: 20,
          endLine1: 30,
          line2: 20,
          endLine2: 30,
          code1: '',
          code2: '',
          similarity: 0.85,
          patternType: 'function',
          tokenCost: 90,
          severity: Severity.Major,
          reason: 'Test',
          suggestion: 'Fix',
          matchedRule: undefined,
        },
      ];

      const groups = groupDuplicatesByFilePair(duplicates);

      expect(groups).toHaveLength(1);
      expect(groups[0].occurrences).toBe(2);
      expect(groups[0].totalTokenCost).toBe(190);
    });

    it('should handle empty input', () => {
      const groups = groupDuplicatesByFilePair([]);
      expect(groups).toHaveLength(0);
    });
  });

  describe('createRefactorClusters', () => {
    it('should create blog-seo cluster', () => {
      const duplicates: DuplicatePattern[] = [
        {
          file1: 'blog/ato-receipt-requirements-2026.tsx',
          file2: 'blog/ato-mileage-rates-2026.tsx',
          line1: 1,
          endLine1: 50,
          line2: 1,
          endLine2: 50,
          code1: '',
          code2: '',
          similarity: 0.88,
          patternType: 'component',
          tokenCost: 1500,
          severity: Severity.Minor,
          reason: 'SEO boilerplate',
          suggestion: 'Extract BlogPageLayout',
          matchedRule: undefined,
        },
        {
          file1: 'blog/ato-receipt-requirements-2026.tsx',
          file2: 'blog/tax-deductions-2026.tsx',
          line1: 1,
          endLine1: 50,
          line2: 1,
          endLine2: 50,
          code1: '',
          code2: '',
          similarity: 0.85,
          patternType: 'component',
          tokenCost: 1400,
          severity: Severity.Minor,
          reason: 'SEO boilerplate',
          suggestion: 'Extract BlogPageLayout',
          matchedRule: undefined,
        },
        {
          file1: 'blog/ato-mileage-rates-2026.tsx',
          file2: 'blog/tax-deductions-2026.tsx',
          line1: 1,
          endLine1: 50,
          line2: 1,
          endLine2: 50,
          code1: '',
          code2: '',
          similarity: 0.87,
          patternType: 'component',
          tokenCost: 1450,
          severity: Severity.Minor,
          reason: 'SEO boilerplate',
          suggestion: 'Extract BlogPageLayout',
          matchedRule: undefined,
        },
      ];

      const clusters = createRefactorClusters(duplicates);

      const blogCluster = clusters.find((c) => c.name.includes('Blog'));
      expect(blogCluster).toBeDefined();
      expect(blogCluster!.files).toHaveLength(3); // 3 unique files
      expect(blogCluster!.totalTokenCost).toBe(4350);
    });

    it('should create component clusters by category', () => {
      const duplicates: DuplicatePattern[] = [
        {
          file1: 'components/buttons/PrimaryButton.tsx',
          file2: 'components/buttons/SecondaryButton.tsx',
          line1: 1,
          endLine1: 20,
          line2: 1,
          endLine2: 20,
          code1: '',
          code2: '',
          similarity: 0.9,
          patternType: 'component',
          tokenCost: 500,
          severity: Severity.Minor,
          reason: 'Button pattern',
          suggestion: 'Extract BaseButton',
          matchedRule: undefined,
        },
        {
          file1: 'components/buttons/PrimaryButton.tsx',
          file2: 'components/buttons/TertiaryButton.tsx',
          line1: 1,
          endLine1: 20,
          line2: 1,
          endLine2: 20,
          code1: '',
          code2: '',
          similarity: 0.88,
          patternType: 'component',
          tokenCost: 480,
          severity: Severity.Minor,
          reason: 'Button pattern',
          suggestion: 'Extract BaseButton',
          matchedRule: undefined,
        },
        {
          file1: 'components/cards/ProductCard.tsx',
          file2: 'components/cards/UserCard.tsx',
          line1: 1,
          endLine1: 30,
          line2: 1,
          endLine2: 30,
          code1: '',
          code2: '',
          similarity: 0.85,
          patternType: 'component',
          tokenCost: 600,
          severity: Severity.Minor,
          reason: 'Card pattern',
          suggestion: 'Extract BaseCard',
          matchedRule: undefined,
        },
        {
          file1: 'components/cards/ProductCard.tsx',
          file2: 'components/cards/ProfileCard.tsx',
          line1: 1,
          endLine1: 30,
          line2: 1,
          endLine2: 30,
          code1: '',
          code2: '',
          similarity: 0.83,
          patternType: 'component',
          tokenCost: 580,
          severity: Severity.Minor,
          reason: 'Card pattern',
          suggestion: 'Extract BaseCard',
          matchedRule: undefined,
        },
      ];

      const clusters = createRefactorClusters(duplicates);

      const buttonCluster = clusters.find((c) => c.name.includes('Button'));
      const cardCluster = clusters.find((c) => c.name.includes('Card'));

      expect(buttonCluster).toBeDefined();
      expect(buttonCluster!.files.length).toBeGreaterThanOrEqual(2);

      expect(cardCluster).toBeDefined();
      expect(cardCluster!.files.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty input', () => {
      const clusters = createRefactorClusters([]);
      expect(clusters).toHaveLength(0);
    });
  });

  describe('filterClustersByImpact', () => {
    it('should filter clusters by minimum token cost', () => {
      const duplicates: DuplicatePattern[] = [
        {
          file1: 'a.ts',
          file2: 'b.ts',
          line1: 1,
          endLine1: 10,
          line2: 1,
          endLine2: 10,
          code1: '',
          code2: '',
          similarity: 0.9,
          patternType: 'function',
          tokenCost: 2000,
          severity: Severity.Major,
          reason: 'High cost',
          suggestion: 'Refactor',
          matchedRule: undefined,
        },
        {
          file1: 'c.ts',
          file2: 'd.ts',
          line1: 1,
          endLine1: 5,
          line2: 1,
          endLine2: 5,
          code1: '',
          code2: '',
          similarity: 0.8,
          patternType: 'utility',
          tokenCost: 100,
          severity: Severity.Info,
          reason: 'Low cost',
          suggestion: 'Maybe refactor',
          matchedRule: undefined,
        },
      ];

      const allClusters = createRefactorClusters(duplicates);
      const filtered = filterClustersByImpact(allClusters, 1000, 1);

      // Only clusters with >= 1000 tokens should remain
      expect(filtered.every((c) => c.totalTokenCost >= 1000)).toBe(true);
    });

    it('should filter clusters by minimum file count', () => {
      const duplicates: DuplicatePattern[] = [
        {
          file1: 'domain/a.ts',
          file2: 'domain/b.ts',
          line1: 1,
          endLine1: 10,
          line2: 1,
          endLine2: 10,
          code1: '',
          code2: '',
          similarity: 0.9,
          patternType: 'function',
          tokenCost: 500,
          severity: Severity.Major,
          reason: 'Test',
          suggestion: 'Fix',
          matchedRule: undefined,
        },
        {
          file1: 'domain/a.ts',
          file2: 'domain/c.ts',
          line1: 1,
          endLine1: 10,
          line2: 1,
          endLine2: 10,
          code1: '',
          code2: '',
          similarity: 0.85,
          patternType: 'function',
          tokenCost: 500,
          severity: Severity.Major,
          reason: 'Test',
          suggestion: 'Fix',
          matchedRule: undefined,
        },
        {
          file1: 'other/x.ts',
          file2: 'other/y.ts',
          line1: 1,
          endLine1: 5,
          line2: 1,
          endLine2: 5,
          code1: '',
          code2: '',
          similarity: 0.8,
          patternType: 'utility',
          tokenCost: 500,
          severity: Severity.Info,
          reason: 'Test',
          suggestion: 'Fix',
          matchedRule: undefined,
        },
      ];

      const allClusters = createRefactorClusters(duplicates);
      const filtered = filterClustersByImpact(allClusters, 0, 3);

      // Only clusters with >= 3 files should remain
      expect(filtered.every((c) => c.files.length >= 3)).toBe(true);
    });

    it('should handle empty input', () => {
      const filtered = filterClustersByImpact([], 1000, 3);
      expect(filtered).toHaveLength(0);
    });
  });
});
