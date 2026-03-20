import { ToolRegistry } from '@aiready/core';
import { ContextAnalyzerProvider } from './provider';

// Register with global registry
ToolRegistry.register(ContextAnalyzerProvider);

export * from './analyzer';
export * from './graph-builder';
export * from './metrics';
export * from './classifier';
export * from './cluster-detector';
export * from './remediation';
export * from './scoring';
export * from './defaults';
export * from './summary';
export * from './types';
// Semantic analysis modules - direct exports
export * from './semantic/co-usage';
export * from './semantic/type-graph';
export * from './semantic/domain-inference';
export * from './semantic/consolidation';

// Classification modules
export * from './classify/classification-patterns';
export * from './classify/file-classifiers';

// Report modules
export * from './report/console-report';
export * from './report/html-report';
export * from './report/interactive-setup';

export { ContextAnalyzerProvider };
