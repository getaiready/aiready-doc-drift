import {
  ToolProvider,
  ToolName,
  SpokeOutput,
  ScanOptions,
  ToolScoringOutput,
  SpokeOutputSchema,
  buildSimpleProviderScore,
} from '@aiready/core';
import { analyzeChangeAmplification } from './analyzer';
import { ChangeAmplificationOptions } from './types';

/**
 * Change Amplification Tool Provider
 */
export const ChangeAmplificationProvider: ToolProvider = {
  id: ToolName.ChangeAmplification,
  alias: ['change-amp', 'change-amplification', 'coupling'],

  async analyze(options: ScanOptions): Promise<SpokeOutput> {
    const report = await analyzeChangeAmplification(
      options as ChangeAmplificationOptions
    );

    return SpokeOutputSchema.parse({
      results: report.results as any,
      summary: report.summary,
      metadata: {
        toolName: ToolName.ChangeAmplification,
        version: '0.9.5',
        timestamp: new Date().toISOString(),
      },
    });
  },

  score(output: SpokeOutput): ToolScoringOutput {
    return buildSimpleProviderScore(
      ToolName.ChangeAmplification,
      output.summary as any
    );
  },

  defaultWeight: 8,
};
