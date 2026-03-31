import { describe, it, expect } from 'vitest';
import { DOC_DRIFT_PROVIDER } from '../provider';

describe('Doc Drift Provider', () => {
  it('should have correct ID', () => {
    expect(DOC_DRIFT_PROVIDER.id).toBe('doc-drift');
  });

  it('should have alias', () => {
    expect(DOC_DRIFT_PROVIDER.alias).toContain('documentation');
  });
});
