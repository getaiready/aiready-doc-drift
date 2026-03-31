import { ToolRegistry } from '@aiready/core';
import { DOC_DRIFT_PROVIDER } from './provider';

// Register with global registry
ToolRegistry.register(DOC_DRIFT_PROVIDER);

export * from './types';
export * from './analyzer';
export { DOC_DRIFT_PROVIDER };
