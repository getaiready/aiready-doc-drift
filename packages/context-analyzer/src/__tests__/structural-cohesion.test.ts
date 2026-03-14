import { describe, it, expect } from 'vitest';
import { calculateStructuralCohesionFromCoUsage } from '../index';

describe('calculateStructuralCohesionFromCoUsage', () => {
  it('returns 1 when no co-usage data present', () => {
    const score = calculateStructuralCohesionFromCoUsage('missing', undefined);
    expect(score).toBe(1);
  });

  it('returns 1 when co-usage only with a single file', () => {
    const coUsage = new Map<string, Map<string, number>>();
    coUsage.set('a', new Map([['b', 10]]));
    const score = calculateStructuralCohesionFromCoUsage('a', coUsage);
    expect(score).toBe(1);
  });

  it('returns ~0 when co-usage is perfectly balanced across two files', () => {
    const coUsage = new Map<string, Map<string, number>>();
    coUsage.set(
      'a',
      new Map([
        ['b', 5],
        ['c', 5],
      ])
    );
    const score = calculateStructuralCohesionFromCoUsage('a', coUsage);
    // Balanced distribution => entropy == 1 (for 2 items) => cohesion ~= 0
    expect(score).toBeCloseTo(0, 3);
  });

  it('returns intermediate value for skewed distribution', () => {
    const coUsage = new Map<string, Map<string, number>>();
    coUsage.set(
      'a',
      new Map([
        ['b', 8],
        ['c', 2],
      ])
    );
    const score = calculateStructuralCohesionFromCoUsage('a', coUsage);
    // Expected approx 0.279
    expect(score).toBeCloseTo(0.279, 2);
  });
});
