import { describe, it, expect } from 'vitest';
import { SKILL_CONFIG } from '../config';

describe('Skills Config', () => {
  it('should have expected configuration values', () => {
    expect(SKILL_CONFIG.name).toBe('aiready-best-practices');
    expect(SKILL_CONFIG.skillDir).toBeDefined();
    expect(SKILL_CONFIG.rulesDir).toBeDefined();
    expect(SKILL_CONFIG.sectionMap.patterns).toBe(1);
  });
});
