import { describe, it, expect, vi } from 'vitest';
import { AgentGroundingProvider } from '../provider';
import * as analyzer from '../analyzer';

vi.mock('../analyzer', () => ({
  analyzeAgentGrounding: vi.fn(),
}));

describe('Agent Grounding Provider', () => {
  it('should analyze and return SpokeOutput', async () => {
    vi.mocked(analyzer.analyzeAgentGrounding).mockResolvedValue({
      summary: { score: 90, dimensions: {} } as any,
      issues: [],
      rawData: { totalFiles: 10 } as any,
      recommendations: [],
    });

    const output = await AgentGroundingProvider.analyze({ rootDir: '.' });

    expect(output.summary.score).toBe(90);
    expect(output.metadata.toolName).toBe('agent-grounding');
  });

  it('should score an output', () => {
    const mockOutput = {
      summary: { score: 80, dimensions: {} } as any,
      metadata: { rawData: {} },
      results: [],
    };

    const scoring = AgentGroundingProvider.score(mockOutput as any, {
      rootDir: '.',
    });
    expect(scoring.score).toBe(80);
  });
});
