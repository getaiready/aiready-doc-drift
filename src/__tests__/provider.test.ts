import { describe, it, expect, vi } from 'vitest';
import { ChangeAmplificationProvider } from '../provider';
import * as analyzer from '../analyzer';

vi.mock('../analyzer', () => ({
  analyzeChangeAmplification: vi.fn(),
}));

describe('Change Amplification Provider', () => {
  it('should analyze and return SpokeOutput', async () => {
    vi.mocked(analyzer.analyzeChangeAmplification).mockResolvedValue({
      summary: {
        totalFiles: 1,
        totalIssues: 0,
        criticalIssues: 0,
        majorIssues: 0,
        score: 90,
        rating: 'stable',
        recommendations: [],
      },
      results: [],
    });

    const output = await ChangeAmplificationProvider.analyze({ rootDir: '.' });

    expect(output.summary.totalFiles).toBe(1);
    expect(output.metadata!.toolName).toBe('change-amplification');
  });

  it('should score an output', () => {
    const mockOutput = {
      summary: { score: 85, recommendations: ['Decouple logic'] } as any,
      results: [],
    };

    const scoring = ChangeAmplificationProvider.score(mockOutput as any, {
      rootDir: '.',
    });
    expect(scoring.score).toBe(85);
    expect(scoring.recommendations[0].action).toBe('Decouple logic');
  });
});
