import { describe, it, expect, vi } from 'vitest';
import { TestabilityProvider } from '../provider';
import * as analyzer from '../analyzer';

vi.mock('../analyzer', () => ({
  analyzeTestability: vi.fn(),
}));

describe('Testability Provider', () => {
  it('should analyze and return SpokeOutput', async () => {
    vi.mocked(analyzer.analyzeTestability).mockResolvedValue({
      summary: { score: 90, dimensions: {} } as any,
      issues: [],
      rawData: { sourceFiles: 10, testFiles: 5 } as any,
      recommendations: [],
    });

    const output = await TestabilityProvider.analyze({ rootDir: '.' });

    expect(output.summary.score).toBe(90);
    expect(output.metadata.toolName).toBe('testability-index');
  });

  it('should score an output', () => {
    const mockOutput = {
      summary: { score: 80, dimensions: {} } as any,
      metadata: { rawData: {} },
      results: [],
    };

    const scoring = TestabilityProvider.score(mockOutput as any, {
      rootDir: '.',
    });
    expect(scoring.score).toBe(80);
  });
});
