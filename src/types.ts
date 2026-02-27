import type { ScanOptions, Issue } from '@aiready/core';

export interface AiSignalClarityOptions extends ScanOptions {
  /** Minimum severity to report */
  minSeverity?: 'info' | 'minor' | 'major' | 'critical';
  /** Check for magic literal numbers and strings */
  checkMagicLiterals?: boolean;
  /** Check for boolean trap parameters */
  checkBooleanTraps?: boolean;
  /** Check for overloaded / ambiguous symbol names */
  checkAmbiguousNames?: boolean;
  /** Check for undocumented public exports */
  checkUndocumentedExports?: boolean;
  /** Check for implicit side effects in void functions */
  checkImplicitSideEffects?: boolean;
  /** Check for deep callback nesting */
  checkDeepCallbacks?: boolean;
}

export interface AiSignalClarityIssue extends Issue {
  type:
  | 'magic-literal'
  | 'boolean-trap'
  | 'ambiguous-api'
  | 'ai-signal-clarity'
  | 'dead-code';
  /** Category of risk signal */
  category: 'magic-literal' | 'boolean-trap' | 'ambiguous-name' | 'undocumented-export' | 'implicit-side-effect' | 'deep-callback' | 'overloaded-symbol';
  /** Code snippet where the issue was found */
  snippet?: string;
}

export interface FileAiSignalClarityResult {
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
    /** Top risk across the entire codebase */
    topRisk: string;
    /** Overall rating */
    rating: 'minimal' | 'low' | 'moderate' | 'high' | 'severe';
  };
  results: FileAiSignalClarityResult[];
  aggregateSignals: {
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
  recommendations: string[];
}
