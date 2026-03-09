import { describe, it, expect, vi } from 'vitest';
import { ConsistencyProvider } from '../provider';
import * as analyzer from '../analyzer';

vi.mock('../analyzer', () => ({
  analyzeConsistency: vi.fn(),
}));

describe('Consistency Provider', () => {
  it('should analyze and return SpokeOutput', async () => {
    vi.mocked(analyzer.analyzeConsistency).mockResolvedValue({
      summary: {
        totalIssues: 0,
        namingIssues: 0,
        patternIssues: 0,
        architectureIssues: 0,
        filesAnalyzed: 1,
      },
      results: [],
      recommendations: [],
    });

    const output = await ConsistencyProvider.analyze({ rootDir: '.' });

    expect(output.summary.filesAnalyzed).toBe(1);
    expect(output.metadata.toolName).toBe('naming-consistency');
  });

  it('should score an output', () => {
    const mockOutput = {
      summary: { filesAnalyzed: 10 } as any,
      results: [{ fileName: 'f1.ts', issues: [] }],
    };

    const scoring = ConsistencyProvider.score(mockOutput as any, {
      rootDir: '.',
    });
    expect(scoring.score).toBeDefined();
  });
});
