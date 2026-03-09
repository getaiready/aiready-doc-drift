import { describe, it, expect } from 'vitest';
import { ImpactLevel } from '../types';

describe('Skills Types', () => {
  it('should have expected ImpactLevel values', () => {
    // This just ensures types are exported and usable
    const levels: ImpactLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    expect(levels).toContain('CRITICAL');
  });
});
