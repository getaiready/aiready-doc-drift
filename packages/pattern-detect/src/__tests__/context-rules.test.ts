import { describe, it, expect } from 'vitest';
import { Severity } from '@aiready/core';
import {
  calculateSeverity,
  filterBySeverity,
  getSeverityLabel,
} from '../context-rules';

describe('Context-Aware Severity', () => {
  describe('Test Fixture Detection', () => {
    it('should mark test fixtures as info severity', () => {
      const file = 'src/__tests__/user.test.ts';
      const code = `
        beforeAll(async () => {
          await setupDatabase();
        });
        
        afterAll(async () => {
          await cleanupDatabase();
        });
      `;

      const result = calculateSeverity(file, file, code, 1.0, 10);

      expect(result.severity).toBe(Severity.Info);
      expect(result.reason).toContain('test isolation');
      expect(result.matchedRule).toBe('test-fixtures');
    });

    it('should detect test files with spec extension', () => {
      const file = 'src/components/Button.spec.ts';
      const code = `
        beforeEach(() => {
          jest.clearAllMocks();
        });
      `;

      const result = calculateSeverity(file, file, code, 0.9, 8);

      expect(result.severity).toBe(Severity.Info);
      expect(result.matchedRule).toBe('test-fixtures');
    });
  });

  describe('Template Detection', () => {
    it('should mark email templates as info severity', () => {
      const file = 'src/email-templates/payment-failed.ts';
      const code = `
        export function getEmailTemplate() {
          return {
            subject: 'Payment Failed',
            html: '<div>Your payment has failed</div>',
            body: 'Payment failed'
          };
        }
      `;

      const result = calculateSeverity(file, file, code, 0.8, 20);

      expect(result.severity).toBe(Severity.Info);
      expect(result.reason).toContain('branding consistency');
      expect(result.matchedRule).toBe('templates');
    });
  });

  describe('E2E Test Detection', () => {
    it('should mark E2E page objects as info severity', () => {
      const file = 'e2e/pages/login-page.ts';
      const code = `
        async function clickLoginButton() {
          await page.click('button[type="submit"]');
        }
        
        async function fillUsername(value: string) {
          await page.fill('input[name="username"]', value);
        }
      `;

      const result = calculateSeverity(file, file, code, 0.85, 15);

      // Debug: The detection is working now with 'await page' pattern
      expect(result.severity).toBe(Severity.Info);
      expect(result.reason).toContain('test independence');
      expect(result.matchedRule).toBe('e2e-page-objects');
    });
  });

  describe('Configuration Files', () => {
    it('should mark config files as info severity', () => {
      const file = 'packages/web/jest.config.ts';
      const code = `
        export default {
          preset: 'ts-jest',
          testEnvironment: 'node'
        };
      `;

      const result = calculateSeverity(file, file, code, 0.9, 10);

      expect(result.severity).toBe(Severity.Info);
      expect(result.matchedRule).toBe('config-files');
    });
  });

  describe('Type Definitions', () => {
    it('should mark type definitions as info severity', () => {
      const file = 'src/types/user.d.ts';
      const code = `
        interface User {
          id: string;
          name: string;
          email: string;
        }
        
        type UserRole = 'admin' | 'user';
      `;

      const result = calculateSeverity(file, file, code, 0.95, 12);

      expect(result.severity).toBe(Severity.Info);
      expect(result.reason).toContain('module independence');
      expect(result.matchedRule).toBe('type-definitions');
    });
  });

  describe('Critical Duplication', () => {
    it('should mark large identical code as critical', () => {
      const file = 'src/utils/helper.ts';
      const code = 'function compute() {\n'.repeat(35) + '}';

      const result = calculateSeverity(file, file, code, 1.0, 35);

      expect(result.severity).toBe(Severity.Critical);
      expect(result.reason).toContain('maintenance burden');
    });

    it('should mark high similarity medium-sized code as high', () => {
      const file = 'src/services/api.ts';
      const code = 'function fetchData() {\n'.repeat(20) + '}';

      const result = calculateSeverity(file, file, code, 0.96, 20);

      expect(result.severity).toBe(Severity.Major);
      expect(result.reason).toContain('consolidated');
    });
  });

  describe('Severity Filtering', () => {
    it('should filter by minimum severity', () => {
      const duplicates = [
        { severity: Severity.Critical },
        { severity: Severity.Major },
        { severity: Severity.Minor },
        { severity: Severity.Info },
      ];

      const filtered = filterBySeverity(duplicates, Severity.Minor);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((d) => d.severity)).toEqual([
        Severity.Critical,
        Severity.Major,
        Severity.Minor,
      ]);
    });

    it('should show all severities when filtering by info', () => {
      const duplicates = [
        { severity: Severity.Critical },
        { severity: Severity.Info },
      ];

      const filtered = filterBySeverity(duplicates, Severity.Info);

      expect(filtered).toHaveLength(2);
    });

    it('should only show critical when filtering by critical', () => {
      const duplicates = [
        { severity: Severity.Critical },
        { severity: Severity.Major },
        { severity: Severity.Minor },
      ];

      const filtered = filterBySeverity(duplicates, Severity.Critical);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe(Severity.Critical);
    });
  });

  describe('Severity Labels', () => {
    it('should return correct labels with emojis', () => {
      expect(getSeverityLabel(Severity.Critical)).toContain('CRITICAL');
      expect(getSeverityLabel(Severity.Major)).toContain('MAJOR');
      expect(getSeverityLabel(Severity.Minor)).toContain('MINOR');
      expect(getSeverityLabel(Severity.Info)).toContain('INFO');
    });
  });

  describe('Mock Data Detection', () => {
    it('should mark mock data as info severity', () => {
      const file = 'src/__mocks__/user-data.ts';
      const code = `
        export const mockUser = {
          id: '123',
          name: 'Test User',
          email: 'test@example.com'
        };
      `;

      const result = calculateSeverity(file, file, code, 0.9, 10);

      expect(result.severity).toBe(Severity.Info);
      expect(result.matchedRule).toBe('mock-data');
    });
  });

  describe('Migration Scripts Detection', () => {
    it('should mark migration scripts as info severity', () => {
      const file = 'db/migrations/001_create_users.ts';
      const code = `
        export async function up(db: Database) {
          await db.createTable('users', {
            id: 'uuid',
            name: 'text'
          });
        }
      `;

      const result = calculateSeverity(file, file, code, 0.95, 15);

      expect(result.severity).toBe(Severity.Info);
      expect(result.matchedRule).toBe('migration-scripts');
    });
  });
});
