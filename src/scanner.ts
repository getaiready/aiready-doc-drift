/**
 * AST-based scanner for AI signal clarity signals.
 *
 * Detects code patterns that empirically cause AI models to generate
 * incorrect code — magic literals, boolean traps, ambiguous names,
 * undocumented exports, implicit side-effects, deep callbacks, and
 * overloaded symbols.
 */

import { readFileSync } from 'fs';
import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/types';
import type { AiSignalClarityIssue, FileAiSignalClarityResult, AiSignalClarityOptions } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AMBIGUOUS_NAME_PATTERNS = [
  /^[a-z]$/,                          // single letter: a, b, x, y
  /^(tmp|temp|data|obj|val|res|ret|result|item|elem|thing|stuff|info|misc|util|helper|handler|cb|fn|func)$/i,
  /^[a-z]\d+$/,                       // x1, x2, n3
];

const MAGIC_LITERAL_IGNORE = new Set([0, 1, -1, 2, 100, 1000, 1024]);
const MAGIC_STRING_IGNORE = new Set(['', ' ', '\n', '\t', 'utf8', 'utf-8', 'hex', 'base64']);

const VAGUE_FILE_PATTERNS = /\/(utils|helpers?|misc|common|shared|index)\.(ts|js|tsx|jsx)$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAmbiguousName(name: string): boolean {
  return AMBIGUOUS_NAME_PATTERNS.some(p => p.test(name));
}

function isMagicNumber(value: number): boolean {
  return !MAGIC_LITERAL_IGNORE.has(value);
}

function isMagicString(value: string): boolean {
  if (value.length === 0) return false;
  if (MAGIC_STRING_IGNORE.has(value)) return false;
  // Allow URL-like strings, CSS values — focus on short opaque strings
  return value.length <= 20 && !/[/.]/.test(value) && !/^\s+$/.test(value);
}

function getSignature(node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | TSESTree.TSDeclareFunction): string {
  return node.params.map(p => JSON.stringify(p)).join(',');
}

function hasJSDoc(node: TSESTree.Node, code: string): boolean {
  const start = node.range?.[0] ?? 0;
  const preceding = code.slice(Math.max(0, start - 200), start);
  return /\/\*\*[\s\S]*?\*\/\s*$/.test(preceding) || /\/\/[^\n]*\n\s*$/.test(preceding);
}

function isVoidWithSideEffect(
  node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
): boolean {
  // Heuristic: function returns nothing but contains assignments or calls that mutate external state
  // We look for: no explicit return with a value, AND contains assignment to non-local vars
  let hasReturn = false;
  let hasMutation = false;

  function walk(n: TSESTree.Node) {
    if (n.type === 'ReturnStatement' && n.argument) {
      hasReturn = true;
    }
    if (
      n.type === 'AssignmentExpression' &&
      n.left.type === 'MemberExpression'
    ) {
      hasMutation = true;
    }
    for (const key of Object.keys(n)) {
      const child = (n as any)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          child.forEach(c => c && c.type && walk(c));
        } else if (child.type) {
          walk(child);
        }
      }
    }
  }

  if (node.body && node.body.type === 'BlockStatement') {
    node.body.body.forEach(s => walk(s));
  }

  return !hasReturn && hasMutation;
}

function getCallbackDepth(node: TSESTree.Node, depth = 0): number {
  let max = depth;
  if (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression'
  ) {
    depth++;
    max = Math.max(max, depth);
  }
  for (const key of Object.keys(node)) {
    const child = (node as any)[key];
    if (child && typeof child === 'object') {
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && c.type) max = Math.max(max, getCallbackDepth(c, depth));
        }
      } else if (child.type) {
        max = Math.max(max, getCallbackDepth(child, depth));
      }
    }
  }
  return max;
}

// ---------------------------------------------------------------------------
// Main scanner
// ---------------------------------------------------------------------------

export function scanFile(
  filePath: string,
  options: AiSignalClarityOptions = { rootDir: '.' },
): FileAiSignalClarityResult {
  let code: string;
  try {
    code = readFileSync(filePath, 'utf-8');
  } catch {
    return emptyResult(filePath);
  }

  let ast: TSESTree.Program;
  try {
    ast = parse(code, {
      jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
      range: true,
      loc: true,
      comment: true,
      tokens: false,
    });
  } catch {
    return emptyResult(filePath);
  }

  const issues: AiSignalClarityIssue[] = [];
  const signals = {
    magicLiterals: 0,
    booleanTraps: 0,
    ambiguousNames: 0,
    undocumentedExports: 0,
    implicitSideEffects: 0,
    deepCallbacks: 0,
    overloadedSymbols: 0,
    totalSymbols: 0,
    totalExports: 0,
  };

  // Symbol tracking for overloading detection
  const symbolSignatures = new Map<string, Set<string>>();
  const exportedNames = new Set<string>();

  function reportIssue(
    category: AiSignalClarityIssue['category'],
    severity: AiSignalClarityIssue['severity'],
    message: string,
    node: TSESTree.Node,
    suggestion?: string,
    snippet?: string,
  ) {
    issues.push({
      type: category === 'magic-literal' ? 'magic-literal'
        : category === 'boolean-trap' ? 'boolean-trap'
          : 'ai-signal-clarity',
      category,
      severity,
      message,
      location: {
        file: filePath,
        line: node.loc?.start.line ?? 0,
        column: node.loc?.start.column,
        endLine: node.loc?.end.line,
      },
      suggestion,
      snippet,
    });
  }

  function visitNode(node: TSESTree.Node) {
    // --- Magic literals ---
    if (options.checkMagicLiterals !== false) {
      if (node.type === 'Literal') {
        if (typeof node.value === 'number' && isMagicNumber(node.value)) {
          signals.magicLiterals++;
          reportIssue(
            'magic-literal',
            'minor',
            `Magic number ${node.value} — AI will invent wrong semantics. Extract to a named constant.`,
            node,
            `const MEANINGFUL_NAME = ${node.value};`,
            code.slice(node.range?.[0] ?? 0, node.range?.[1] ?? 0),
          );
        } else if (typeof node.value === 'string' && isMagicString(node.value)) {
          signals.magicLiterals++;
          reportIssue(
            'magic-literal',
            'info',
            `Magic string "${node.value}" — intent is ambiguous to AI. Consider a named constant.`,
            node,
            `const CONSTANT_NAME = '${node.value}';`,
          );
        }
      }
    }

    // --- Boolean traps ---
    if (options.checkBooleanTraps !== false) {
      if (
        (node.type === 'CallExpression' || node.type === 'NewExpression') &&
        node.arguments
      ) {
        const boolArgs = node.arguments.filter(
          a => a.type === 'Literal' && typeof (a as TSESTree.Literal).value === 'boolean',
        );
        if (boolArgs.length >= 1) {
          signals.booleanTraps++;
          reportIssue(
            'boolean-trap',
            'major',
            `Boolean trap: positional boolean argument(s) at call site. AI inverts intent ~30% of the time.`,
            node,
            'Replace boolean arg with a named options object: { enabled: true }',
          );
        }
      }
    }

    // --- Ambiguous / non-descriptive names ---
    if (options.checkAmbiguousNames !== false) {
      if (node.type === 'VariableDeclarator' && node.id && node.id.type === 'Identifier') {
        const name = node.id.name;
        if (isAmbiguousName(name)) {
          signals.ambiguousNames++;
          if (signals.ambiguousNames <= 50) { // cap issue count per file
            reportIssue(
              'ambiguous-name',
              'info',
              `Ambiguous identifier "${name}" — AI cannot infer intent and will guess incorrectly.`,
              node.id,
              'Use a domain-descriptive name instead.',
            );
          }
        }
      }
      if (node.type === 'FunctionDeclaration' && node.id && node.id.type === 'Identifier') {
        // also check function names and params
        if (isAmbiguousName(node.id.name)) signals.ambiguousNames++;
        node.params.forEach(p => {
          if (p.type === 'Identifier' && isAmbiguousName(p.name)) signals.ambiguousNames++;
        });
      }

      // Count all function/variable declarations as symbols
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'VariableDeclarator'
      ) {
        signals.totalSymbols++;
      }
    }

    // --- Overloaded symbols (TSDeclareFunction) ---
    if (node.type === 'TSDeclareFunction' && node.id) {
      const name = node.id.name;
      const sig = getSignature(node as any);
      if (!symbolSignatures.has(name)) symbolSignatures.set(name, new Set());
      symbolSignatures.get(name)!.add(sig);
    }
    if (node.type === 'FunctionDeclaration' && node.id) {
      const name = node.id.name;
      const sig = getSignature(node);
      if (!symbolSignatures.has(name)) symbolSignatures.set(name, new Set());
      symbolSignatures.get(name)!.add(sig);
    }

    // --- Implicit side effects ---
    if (options.checkImplicitSideEffects !== false) {
      if (
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'FunctionExpression' ||
        node.type === 'FunctionDeclaration'
      ) {
        if (isVoidWithSideEffect(node as any)) {
          signals.implicitSideEffects++;
          reportIssue(
            'implicit-side-effect',
            'major',
            'Function mutates external state without returning a value — AI misses this contract.',
            node,
            'Make side-effects explicit in function name (e.g., updateX) or return a result.',
          );
        }
      }
    }

    // --- Exports (for undocumented export detection) ---
    if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
      signals.totalExports++;
      const decl = (node as any).declaration;
      if (decl) {
        const name =
          decl.id?.name ??
          decl.declarations?.[0]?.id?.name ??
          'anonymous';
        exportedNames.add(name);

        // Check JSDoc presence
        if (options.checkUndocumentedExports !== false && !hasJSDoc(node, code)) {
          signals.undocumentedExports++;
          reportIssue(
            'undocumented-export',
            'minor',
            `Public export "${name}" has no JSDoc — AI fabricates behavior from the name alone.`,
            node,
            'Add a JSDoc comment describing parameters, return value, and side effects.',
          );
        }
      }
    }

    // Recurse
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const child = (node as any)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const c of child) {
            if (c && typeof c.type === 'string') visitNode(c);
          }
        } else if (typeof child.type === 'string') {
          visitNode(child);
        }
      }
    }
  }

  // Walk the AST
  for (const node of ast.body) {
    visitNode(node);
  }

  // --- Deep callback nesting (run once on whole AST) ---
  if (options.checkDeepCallbacks !== false) {
    const maxDepth = getCallbackDepth(ast);
    if (maxDepth >= 3) {
      signals.deepCallbacks = maxDepth - 2;
      reportIssue(
        'deep-callback',
        'major',
        `Callback nesting depth ${maxDepth} — AI loses control flow context beyond 3 levels.`,
        ast.body[0] ?? ast,
        'Extract nested callbacks into named async functions or use async/await.',
      );
    }
  }

  // --- Overloaded symbol detection (post-walk) ---
  for (const [name, sigs] of symbolSignatures.entries()) {
    if (sigs.size > 1) {
      signals.overloadedSymbols++;
      reportIssue(
        'overloaded-symbol',
        'critical',
        `Symbol "${name}" has ${sigs.size} overloaded signatures — AI picks the wrong one.`,
        ast.body[0] ?? ast,
        `Rename each overload to a unique, descriptive name.`,
      );
    }
  }

  return {
    filePath,
    issues,
    signals,
  };
}

function emptyResult(filePath: string): FileAiSignalClarityResult {
  return {
    filePath,
    issues: [],
    signals: {
      magicLiterals: 0,
      booleanTraps: 0,
      ambiguousNames: 0,
      undocumentedExports: 0,
      implicitSideEffects: 0,
      deepCallbacks: 0,
      overloadedSymbols: 0,
      totalSymbols: 0,
      totalExports: 0,
    },
  };
}
