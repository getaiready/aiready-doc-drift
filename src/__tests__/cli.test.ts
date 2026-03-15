import { describe, it, expect, vi } from 'vitest';
import { changeAmplificationAction } from '../cli';
import * as fs from 'fs';

vi.mock('../analyzer', () => ({
  analyzeChangeAmplification: vi.fn().mockResolvedValue({
    summary: {
      score: 100,
      rating: 'isolated',
      criticalIssues: 0,
      majorIssues: 0,
      recommendations: [],
    },
    results: [],
  }),
}));

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
}));

describe('Change Amplification CLI', () => {
  it('should run analysis and return scoring in json mode', async () => {
    await changeAmplificationAction('.', { output: 'json' });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should run analysis and print to console in default mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await changeAmplificationAction('.', { output: 'console' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
