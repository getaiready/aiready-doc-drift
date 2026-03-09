import { describe, it, expect, vi } from 'vitest';
import { ContextAnalyzerProvider } from '../provider';
import * as main from '../index';

vi.mock('../index', async () => {
  const actual = await vi.importActual('../index');
  return {
    ...actual,
    analyzeContext: vi.fn(),
    generateSummary: vi.fn(),
  };
});

describe('Context Analyzer Provider', () => {
  it('should analyze and return SpokeOutput', async () => {
    vi.mocked(main.analyzeContext).mockResolvedValue([
      {
        file: 'file1.ts',
        issues: ['issue'],
        severity: 'major',
        recommendations: ['fix'],
        tokenCost: 100,
        importDepth: 2,
        contextBudget: 500,
        cohesionScore: 0.8,
        fragmentationScore: 0.1,
        dependencyCount: 5,
        dependencyList: [],
        circularDeps: [],
        domains: [],
        exportCount: 1,
        relatedFiles: [],
        fileClassification: 'unknown',
        potentialSavings: 0,
        linesOfCode: 50,
      } as any,
    ]);
    vi.mocked(main.generateSummary).mockReturnValue({ totalFiles: 1 } as any);

    const output = await ContextAnalyzerProvider.analyze({ rootDir: '.' });

    expect(output.summary.totalFiles).toBe(1);
    expect(output.results[0].fileName).toBe('file1.ts');
  });

  it('should score an output', () => {
    const mockOutput = {
      summary: { score: 80 } as any,
      results: [],
    };

    const scoring = ContextAnalyzerProvider.score(mockOutput as any, {
      rootDir: '.',
    });
    expect(scoring.score).toBeDefined();
  });
});
