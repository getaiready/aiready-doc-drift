import {
  IssueType,
  getSeverityLabel,
  filterBySeverity,
  Severity,
} from '@aiready/core';

export { IssueType, getSeverityLabel, filterBySeverity, Severity };

/**
 * Context-aware severity detection for duplicate patterns
 * Identifies intentional duplication patterns and adjusts severity accordingly
 */

export interface ContextRule {
  name: string;
  detect: (file: string, code: string) => boolean;
  severity: Severity;
  reason: string;
  suggestion?: string;
}

/**
 * Context rules for detecting intentional or acceptable duplication patterns
 * Rules are checked in order - first match wins
 */
export const CONTEXT_RULES: ContextRule[] = [
  // Test Fixtures - Intentional duplication for test isolation
  {
    name: 'test-fixtures',
    detect: (file, code) => {
      const isTestFile =
        file.includes('.test.') ||
        file.includes('.spec.') ||
        file.includes('__tests__') ||
        file.includes('/test/') ||
        file.includes('/tests/');

      const hasTestFixtures =
        code.includes('beforeAll') ||
        code.includes('afterAll') ||
        code.includes('beforeEach') ||
        code.includes('afterEach') ||
        code.includes('setUp') ||
        code.includes('tearDown');

      return isTestFile && hasTestFixtures;
    },
    severity: Severity.Info,
    reason: 'Test fixture duplication is intentional for test isolation',
    suggestion:
      'Consider if shared test setup would improve maintainability without coupling tests',
  },

  // Email/Document Templates - Often intentionally similar for consistency
  {
    name: 'templates',
    detect: (file, code) => {
      const isTemplate =
        file.includes('/templates/') ||
        file.includes('-template') ||
        file.includes('/email-templates/') ||
        file.includes('/emails/');

      const hasTemplateContent =
        (code.includes('return') || code.includes('export')) &&
        (code.includes('html') ||
          code.includes('subject') ||
          code.includes('body'));

      return isTemplate && hasTemplateContent;
    },
    severity: Severity.Info,
    reason:
      'Template duplication may be intentional for maintainability and branding consistency',
    suggestion:
      'Extract shared structure only if templates become hard to maintain',
  },

  // E2E/Integration Test Page Objects - Test independence
  {
    name: 'e2e-page-objects',
    detect: (file, code) => {
      const isE2ETest =
        file.includes('e2e/') ||
        file.includes('/e2e/') ||
        file.includes('.e2e.') ||
        file.includes('/playwright/') ||
        file.includes('playwright/') ||
        file.includes('/cypress/') ||
        file.includes('cypress/') ||
        file.includes('/integration/') ||
        file.includes('integration/');

      const hasPageObjectPatterns =
        code.includes('page.') ||
        code.includes('await page') ||
        code.includes('locator') ||
        code.includes('getBy') ||
        code.includes('selector') ||
        code.includes('click(') ||
        code.includes('fill(');

      return isE2ETest && hasPageObjectPatterns;
    },
    severity: Severity.Info,
    reason:
      'E2E test duplication ensures test independence and reduces coupling',
    suggestion:
      'Consider page object pattern only if duplication causes maintenance issues',
  },

  // Configuration Files - Often necessarily similar by design
  {
    name: 'config-files',
    detect: (file) => {
      return (
        file.endsWith('.config.ts') ||
        file.endsWith('.config.js') ||
        file.includes('jest.config') ||
        file.includes('vite.config') ||
        file.includes('webpack.config') ||
        file.includes('rollup.config') ||
        file.includes('tsconfig')
      );
    },
    severity: Severity.Info,
    reason: 'Configuration files often have similar structure by design',
    suggestion:
      'Consider shared config base only if configurations become hard to maintain',
  },

  // Type Definitions - Duplication for type safety and module independence
  // Matches type-only files OR interface/type definitions in component files
  {
    name: 'type-definitions',
    detect: (file, code) => {
      const isTypeFile = file.endsWith('.d.ts') || file.includes('/types/');

      // Only match if it's a type-only file (no implementation)
      const hasOnlyTypeDefinitions =
        (code.includes('interface ') ||
          code.includes('type ') ||
          code.includes('enum ')) &&
        !code.includes('function ') &&
        !code.includes('class ') &&
        !code.includes('const ') &&
        !code.includes('let ') &&
        !code.includes('export default');

      // Also match interface-only snippets in component files
      // (e.g., ModalProps, BreadcrumbItem, GraphEdge, ScanIssue)
      const isInterfaceOnlySnippet =
        code.trim().startsWith('interface ') &&
        code.includes('{') &&
        code.includes('}') &&
        !code.includes('function ') &&
        !code.includes('const ') &&
        !code.includes('return ');

      return (isTypeFile && hasOnlyTypeDefinitions) || isInterfaceOnlySnippet;
    },
    severity: Severity.Info,
    reason:
      'Type/interface definitions are intentionally duplicated for module independence',
    suggestion:
      'Extract to shared types package only if causing maintenance burden',
  },

  // Migration Scripts - One-off scripts that are similar by nature
  {
    name: 'migration-scripts',
    detect: (file) => {
      return (
        file.includes('/migrations/') ||
        file.includes('/migrate/') ||
        file.includes('.migration.')
      );
    },
    severity: Severity.Info,
    reason: 'Migration scripts are typically one-off and intentionally similar',
    suggestion: 'Duplication is acceptable for migration scripts',
  },

  // Mock Data - Test data intentionally duplicated
  {
    name: 'mock-data',
    detect: (file, code) => {
      const isMockFile =
        file.includes('/mocks/') ||
        file.includes('/__mocks__/') ||
        file.includes('/fixtures/') ||
        file.includes('.mock.') ||
        file.includes('.fixture.');

      const hasMockData =
        code.includes('mock') ||
        code.includes('Mock') ||
        code.includes('fixture') ||
        code.includes('stub') ||
        code.includes('export const');

      return isMockFile && hasMockData;
    },
    severity: Severity.Info,
    reason: 'Mock data duplication is expected for comprehensive test coverage',
    suggestion: 'Consider shared factories only for complex mock generation',
  },

  // Tool Implementations - Structural Boilerplate
  {
    name: 'tool-implementations',
    detect: (file, code) => {
      const isToolFile =
        file.includes('/tools/') ||
        file.endsWith('.tool.ts') ||
        code.includes('toolDefinitions');

      const hasToolStructure =
        code.includes('execute') &&
        (code.includes('try') || code.includes('catch'));

      return isToolFile && hasToolStructure;
    },
    severity: Severity.Info,
    reason:
      'Tool implementations share structural boilerplate but have distinct business logic',
    suggestion:
      'Tool duplication is acceptable for boilerplate interface wrappers',
  },

  // Common UI Event Handlers - Very specific patterns only
  {
    name: 'common-ui-handlers',
    detect: (file, code) => {
      const isUIFile =
        file.includes('/components/') ||
        file.includes('.tsx') ||
        file.includes('.jsx') ||
        file.includes('/hooks/');

      // Only match very specific common handler patterns that are truly boilerplate
      const hasCommonHandler =
        (code.includes('handleClickOutside') &&
          code.includes('dropdownRef.current') &&
          code.includes('!dropdownRef.current.contains')) ||
        (code.includes('handleEscape') &&
          code.includes('event.key') &&
          code.includes("=== 'Escape'")) ||
        (code.includes('handleClickInside') &&
          code.includes('event.stopPropagation'));

      return isUIFile && hasCommonHandler;
    },
    severity: Severity.Info,
    reason:
      'Common UI event handlers are boilerplate patterns that repeat across components',
    suggestion:
      'Consider extracting to shared hooks (useClickOutside, useEscapeKey) only if causing maintenance issues',
  },

  // Utility Functions - Small helpers in dedicated utility files
  {
    name: 'utility-functions',
    detect: (file, code) => {
      const isUtilFile =
        file.endsWith('.util.ts') ||
        file.endsWith('.helper.ts') ||
        file.endsWith('.utils.ts');

      const hasUtilPattern =
        code.includes('function format') ||
        code.includes('function parse') ||
        code.includes('function sanitize') ||
        code.includes('function normalize') ||
        code.includes('function convert');

      return isUtilFile && hasUtilPattern;
    },
    severity: Severity.Info,
    reason:
      'Utility functions in dedicated utility files may be intentionally similar',
    suggestion:
      'Consider extracting to shared utilities only if causing significant duplication',
  },

  // React/Vue Hooks - Standard patterns
  {
    name: 'shared-hooks',
    detect: (file, code) => {
      const isHookFile =
        file.includes('/hooks/') ||
        file.endsWith('.hook.ts') ||
        file.endsWith('.hook.tsx');

      const hasHookPattern =
        code.includes('function use') ||
        code.includes('export function use') ||
        code.includes('const use') ||
        code.includes('export const use');

      return isHookFile && hasHookPattern;
    },
    severity: Severity.Info,
    reason:
      'Hooks follow standard patterns and are often intentionally similar across components',
    suggestion:
      'Consider extracting common hook logic only if hooks become complex',
  },

  // CLI Command Definitions - Commander.js boilerplate patterns
  {
    name: 'cli-command-definitions',
    detect: (file, code) => {
      const isCliFile =
        file.includes('/commands/') ||
        file.includes('/cli/') ||
        file.endsWith('.command.ts');

      const hasCommandPattern =
        (code.includes('.command(') || code.includes('defineCommand')) &&
        (code.includes('.description(') || code.includes('.option(')) &&
        (code.includes('.action(') || code.includes('async'));

      return isCliFile && hasCommandPattern;
    },
    severity: Severity.Info,
    reason:
      'CLI command definitions follow standard Commander.js patterns and are intentionally similar',
    suggestion:
      'Command boilerplate duplication is acceptable for CLI interfaces',
  },

  // Score/Rating Helper Functions - Common threshold patterns
  {
    name: 'score-helpers',
    detect: (file, code) => {
      const isHelperFile =
        file.includes('/utils/') ||
        file.includes('/helpers/') ||
        file.endsWith('.util.ts');

      const hasScorePattern =
        (code.includes('if (score >=') || code.includes('if (score >')) &&
        code.includes('return') &&
        code.includes("'") &&
        code.split('if (score').length >= 3; // Multiple score thresholds

      return isHelperFile && hasScorePattern;
    },
    severity: Severity.Info,
    reason:
      'Score/rating helper functions use common threshold patterns that are intentionally similar',
    suggestion:
      'Score formatting duplication is acceptable for consistent UI display',
  },

  // D3/Canvas Event Handlers - Standard visualization patterns
  {
    name: 'visualization-handlers',
    detect: (file, code) => {
      const isVizFile =
        file.includes('/visualizer/') ||
        file.includes('/charts/') ||
        file.includes('GraphCanvas') ||
        file.includes('ForceDirected');

      const hasVizPattern =
        (code.includes('dragstarted') ||
          code.includes('dragged') ||
          code.includes('dragended')) &&
        (code.includes('simulation') ||
          code.includes('d3.') ||
          code.includes('alphaTarget'));

      return isVizFile && hasVizPattern;
    },
    severity: Severity.Info,
    reason:
      'D3/visualization event handlers follow standard patterns and are intentionally similar',
    suggestion:
      'Visualization boilerplate duplication is acceptable for interactive charts',
  },

  // Icon/Switch Statement Helpers - Common enum-to-value patterns
  {
    name: 'switch-helpers',
    detect: (file, code) => {
      const hasSwitchPattern =
        code.includes('switch (') &&
        code.includes("case '") &&
        code.includes('return') &&
        code.split('case ').length >= 4; // Multiple cases

      const hasIconPattern =
        code.includes('getIcon') ||
        code.includes('getColor') ||
        code.includes('getLabel') ||
        code.includes('getRating');

      return hasSwitchPattern && hasIconPattern;
    },
    severity: Severity.Info,
    reason:
      'Switch statement helpers for enum-to-value mapping are inherently similar',
    suggestion:
      'Switch duplication is acceptable for mapping enums to display values',
  },

  // Common API/Utility Functions - Legitimate duplication across modules
  {
    name: 'common-api-functions',
    detect: (file, code) => {
      const isApiFile =
        file.includes('/api/') ||
        file.includes('/lib/') ||
        file.includes('/utils/') ||
        file.endsWith('.ts');

      const hasCommonApiPattern =
        (code.includes('getStripe') &&
          code.includes('process.env.STRIPE_SECRET_KEY')) ||
        (code.includes('getUserByEmail') && code.includes('queryItems')) ||
        (code.includes('updateUser') &&
          code.includes('buildUpdateExpression')) ||
        (code.includes('listUserRepositories') &&
          code.includes('queryItems')) ||
        (code.includes('listTeamRepositories') &&
          code.includes('queryItems')) ||
        (code.includes('getRemediation') && code.includes('queryItems')) ||
        (code.includes('formatBreakdownKey') &&
          code.includes('.replace(/([A-Z])/g')) ||
        (code.includes('queryItems') &&
          code.includes('KeyConditionExpression')) ||
        (code.includes('putItem') && code.includes('createdAt')) ||
        (code.includes('updateItem') && code.includes('buildUpdateExpression'));

      return isApiFile && hasCommonApiPattern;
    },
    severity: Severity.Info,
    reason:
      'Common API/utility functions are legitimately duplicated across modules for clarity and independence',
    suggestion:
      'Consider extracting to shared utilities only if causing significant duplication',
  },

  // Next.js Route Handler Patterns - Boilerplate API route patterns
  {
    name: 'nextjs-route-handlers',
    detect: (file, code) => {
      const isRouteFile =
        file.includes('/api/') &&
        (file.endsWith('/route.ts') || file.endsWith('/route.js'));

      const hasRoutePattern =
        code.includes('export async function POST') ||
        code.includes('export async function GET') ||
        code.includes('export async function PUT') ||
        code.includes('export async function DELETE') ||
        code.includes('NextResponse.json') ||
        code.includes('NextRequest');

      return isRouteFile && hasRoutePattern;
    },
    severity: Severity.Info,
    reason:
      'Next.js route handlers follow standard patterns and are intentionally similar across endpoints',
    suggestion:
      'Route handler duplication is acceptable for API endpoint boilerplate',
  },

  // Validation Functions - Inherently similar patterns
  {
    name: 'validation-functions',
    detect: (file, code) => {
      const hasValidationPattern =
        code.includes('isValid') ||
        code.includes('validate') ||
        code.includes('checkValid') ||
        code.includes('isEmail') ||
        code.includes('isPhone') ||
        code.includes('isUrl') ||
        code.includes('isNumeric') ||
        code.includes('isAlpha') ||
        code.includes('isAlphanumeric') ||
        code.includes('isEmpty') ||
        code.includes('isNotEmpty') ||
        code.includes('isRequired') ||
        code.includes('isOptional');

      return hasValidationPattern;
    },
    severity: Severity.Info,
    reason:
      'Validation functions are inherently similar and often intentionally duplicated for domain clarity',
    suggestion:
      'Consider extracting to shared validators only if validation logic becomes complex',
  },
];

/**
 * Calculate severity based on context rules and code characteristics
 *
 * @param file1 - First file path in the duplicate pair.
 * @param file2 - Second file path in the duplicate pair.
 * @param code - Snippet of the duplicated code.
 * @param similarity - The calculated similarity score (0-1).
 * @param linesOfCode - Number of lines in the duplicated block.
 * @returns An object containing the severity level and reasoning.
 */
export function calculateSeverity(
  file1: string,
  file2: string,
  code: string,
  similarity: number,
  linesOfCode: number
): {
  severity: Severity;
  reason?: string;
  suggestion?: string;
  matchedRule?: string;
} {
  // Check context rules in priority order (first match wins)
  for (const rule of CONTEXT_RULES) {
    if (rule.detect(file1, code) || rule.detect(file2, code)) {
      return {
        severity: rule.severity,
        reason: rule.reason,
        suggestion: rule.suggestion,
        matchedRule: rule.name,
      };
    }
  }

  // Default severity based on similarity and size for non-contextual duplicates
  if (similarity >= 0.95 && linesOfCode >= 30) {
    return {
      severity: Severity.Critical,
      reason:
        'Large nearly-identical code blocks waste tokens and create maintenance burden',
      suggestion: 'Extract to shared utility module immediately',
    };
  } else if (similarity >= 0.95 && linesOfCode >= 15) {
    return {
      severity: Severity.Major,
      reason: 'Nearly identical code should be consolidated',
      suggestion: 'Move to shared utility file',
    };
  } else if (similarity >= 0.85) {
    return {
      severity: Severity.Major,
      reason: 'High similarity indicates significant duplication',
      suggestion: 'Extract common logic to shared function',
    };
  } else if (similarity >= 0.7) {
    return {
      severity: Severity.Minor,
      reason: 'Moderate similarity detected',
      suggestion:
        'Consider extracting shared patterns if code evolves together',
    };
  } else {
    return {
      severity: Severity.Minor,
      reason: 'Minor similarity detected',
      suggestion: 'Monitor but refactoring may not be worthwhile',
    };
  }
}

/**
 * Get a human-readable severity label with emoji
 *
 * @param severity - The severity level to label.
 * @returns Formatted label string for UI display.
 */

/**
 * Get numerical similarity threshold associated with a severity level
 *
 * @param severity - The severity level to look up.
 * @returns Minimum similarity value for this severity.
 */
export function getSeverityThreshold(severity: Severity): number {
  const thresholds: Record<Severity, number> = {
    [Severity.Critical]: 0.95,
    [Severity.Major]: 0.85,
    [Severity.Minor]: 0.5,
    [Severity.Info]: 0,
  };
  return thresholds[severity] || 0;
}
