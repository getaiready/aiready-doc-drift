import type { ScanOptions, Issue } from '@aiready/core';

export type ChangeAmplificationOptions = ScanOptions;

export interface ChangeAmplificationIssue extends Issue {
  type: 'change-amplification';
}

export interface FileChangeAmplificationResult {
  fileName: string;
  issues: ChangeAmplificationIssue[];
  metrics: {
    aiSignalClarityScore?: number;
  };
}

export interface ChangeAmplificationReport {
  summary: {
    totalFiles: number;
    totalIssues: number;
    criticalIssues: number;
    majorIssues: number;
    score: number;
    rating: 'isolated' | 'contained' | 'amplified' | 'explosive';
    recommendations: string[];
  };
  results: FileChangeAmplificationResult[];
}
