import type {
  ScanOptions,
  AnalysisResult,
  Issue,
  IssueType,
} from '@aiready/core';

export interface AiSignalClarityOptions extends ScanOptions {
  checkMagicLiterals?: boolean;
  checkBooleanTraps?: boolean;
  checkAmbiguousNames?: boolean;
  checkUndocumentedExports?: boolean;
  checkImplicitSideEffects?: boolean;
  checkDeepCallbacks?: boolean;
  checkOverloadedSymbols?: boolean;
  minSeverity?: string;
}

export interface AiSignalClarityIssue extends Issue {
  type:
    | IssueType.MagicLiteral
    | IssueType.BooleanTrap
    | IssueType.AmbiguousApi
    | IssueType.AiSignalClarity
    | IssueType.DeadCode;
  category:
    | 'magic-literal'
    | 'boolean-trap'
    | 'ambiguous-name'
    | 'undocumented-export'
    | 'implicit-side-effect'
    | 'deep-callback'
    | 'overloaded-symbol';
  snippet?: string;
}

export interface FileAiSignalClarityResult extends AnalysisResult {
  filePath: string;
  issues: AiSignalClarityIssue[];
  signals: {
    magicLiterals: number;
    booleanTraps: number;
    ambiguousNames: number;
    undocumentedExports: number;
    implicitSideEffects: number;
    deepCallbacks: number;
    overloadedSymbols: number;
    totalSymbols: number;
    totalExports: number;
  };
}

export interface AiSignalClarityReport {
  summary: {
    filesAnalyzed: number;
    totalSignals: number;
    criticalSignals: number;
    majorSignals: number;
    minorSignals: number;
    topRisk: string;
    rating: string;
  };
  results: FileAiSignalClarityResult[];
  aggregateSignals: FileAiSignalClarityResult['signals'];
  recommendations: string[];
}
