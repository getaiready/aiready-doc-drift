#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeAiSignalClarity } from './analyzer';
import { calculateAiSignalClarityScore } from './scoring';
import type { AiSignalClarityOptions } from './types';
import chalk from 'chalk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { loadConfig, mergeConfigWithDefaults, resolveOutputPath, formatScore } from '@aiready/core';

const program = new Command();

program
  .name('aiready-ai-signal-clarity')
  .description('Detect code patterns that cause AI models to hallucinate incorrect implementations')
  .version('0.1.0')
  .addHelpText('after', `
SIGNAL TYPES DETECTED:
  Magic Literals      Unnamed numbers/strings confuse AI intent inference
  Boolean Traps       Positional boolean args cause AI to invert intent
  Ambiguous Names     Single-letter, x1/x2, tmp/data names mislead AI
  Undocumented Exports  Public API without JSDoc → AI fabricates behavior
  Implicit Side Effects  Void functions that mutate state — AI misses contracts
  Deep Callbacks      Nesting >3 levels — AI loses control flow
  Overloaded Symbols  Same name, different signatures → AI picks wrong one

EXAMPLES:
  aiready-ai-signal-clarity .                        # Full scan
  aiready-ai-signal-clarity src/ --output json       # JSON report
  aiready-ai-signal-clarity . --min-severity major   # Only major+
`)
  .argument('<directory>', 'Directory to analyze')
  .option('--no-magic-literals', 'Skip magic literal detection')
  .option('--no-boolean-traps', 'Skip boolean trap detection')
  .option('--no-ambiguous-names', 'Skip ambiguous name detection')
  .option('--no-undocumented-exports', 'Skip undocumented export detection')
  .option('--no-implicit-side-effects', 'Skip implicit side-effect detection')
  .option('--no-deep-callbacks', 'Skip deep callback detection')
  .option('--min-severity <level>', 'Minimum severity: info|minor|major|critical', 'info')
  .option('--include <patterns>', 'File patterns to include (comma-separated)')
  .option('--exclude <patterns>', 'File patterns to exclude (comma-separated)')
  .option('-o, --output <format>', 'Output format: console|json|markdown', 'console')
  .option('--output-file <path>', 'Output file path (for json/markdown)')
  .action(async (directory, options) => {
    console.log(chalk.blue('🧠 Analyzing AI signal clarity...\n'));
    const startTime = Date.now();

    const config = await loadConfig(directory);
    const mergedConfig = mergeConfigWithDefaults(config, {
      minSeverity: 'info',
      checkMagicLiterals: true,
      checkBooleanTraps: true,
      checkAmbiguousNames: true,
      checkUndocumentedExports: true,
      checkImplicitSideEffects: true,
      checkDeepCallbacks: true,
    });

    const finalOptions: AiSignalClarityOptions = {
      rootDir: directory,
      minSeverity: (options.minSeverity as any) || mergedConfig.minSeverity,
      checkMagicLiterals: options.magicLiterals !== false,
      checkBooleanTraps: options.booleanTraps !== false,
      checkAmbiguousNames: options.ambiguousNames !== false,
      checkUndocumentedExports: options.undocumentedExports !== false,
      checkImplicitSideEffects: options.implicitSideEffects !== false,
      checkDeepCallbacks: options.deepCallbacks !== false,
      include: options.include?.split(','),
      exclude: options.exclude?.split(','),
    };

    const report = await analyzeAiSignalClarity(finalOptions);
    const scoringOutput = calculateAiSignalClarityScore(report);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    if (options.output === 'json') {
      const payload = { report, score: scoringOutput };
      const outputPath = resolveOutputPath(
        options.outputFile,
        `ai-signal-clarity-report-${new Date().toISOString().split('T')[0]}.json`,
        directory,
      );
      const dir = dirname(outputPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(outputPath, JSON.stringify(payload, null, 2));
      console.log(chalk.green(`✓ Report saved to ${outputPath}`));
    } else {
      displayConsoleReport(report, scoringOutput, elapsed);
    }
  });

program.parse();

function ratingColor(rating: string) {
  switch (rating) {
    case 'minimal': return chalk.green;
    case 'low': return chalk.cyan;
    case 'moderate': return chalk.yellow;
    case 'high': return chalk.red;
    case 'severe': return chalk.bgRed.white;
    default: return chalk.white;
  }
}

function severityColor(sev: string) {
  switch (sev) {
    case 'critical': return chalk.red;
    case 'major': return chalk.yellow;
    case 'minor': return chalk.blue;
    default: return chalk.gray;
  }
}

function displayConsoleReport(report: any, scoring: any, elapsed: string) {
  const { summary, aggregateSignals, recommendations, results } = report;

  console.log(chalk.bold('\n🧠 AI Signal Clarity Analysis\n'));
  console.log(`Score:           ${chalk.bold(scoring.score + '/100')} (${ratingColor(summary.rating)(summary.rating.toUpperCase())})`);
  console.log(`Files Analyzed:  ${chalk.cyan(summary.filesAnalyzed)}`);
  console.log(`Total Signals:   ${chalk.yellow(summary.totalSignals)}`);
  console.log(`  Critical: ${chalk.red(summary.criticalSignals)}  Major: ${chalk.yellow(summary.majorSignals)}  Minor: ${chalk.blue(summary.minorSignals)}`);
  console.log(`Top Risk:        ${chalk.italic(summary.topRisk)}`);
  console.log(`Analysis Time:   ${chalk.gray(elapsed + 's')}\n`);

  if (summary.totalSignals === 0) {
    console.log(chalk.green('✨ No AI signal clarity signals found! Your codebase is AI-safe.\n'));
    return;
  }

  console.log(chalk.bold('📊 Signal Breakdown\n'));
  const sigs = aggregateSignals;
  const rows = [
    ['Magic Literals', sigs.magicLiterals],
    ['Boolean Traps', sigs.booleanTraps],
    ['Ambiguous Names', sigs.ambiguousNames],
    ['Undocumented Exports', sigs.undocumentedExports],
    ['Implicit Side Effects', sigs.implicitSideEffects],
    ['Deep Callbacks', sigs.deepCallbacks],
    ['Overloaded Symbols', sigs.overloadedSymbols],
  ];
  for (const [name, count] of rows) {
    if (count as number > 0) {
      console.log(`  ${String(name).padEnd(22)} ${chalk.yellow(count)}`);
    }
  }

  // Show top issues
  const topIssues = results
    .flatMap((r: any) => r.issues)
    .filter((i: any) => i.severity === 'critical' || i.severity === 'major')
    .slice(0, 10);

  if (topIssues.length > 0) {
    console.log(chalk.bold('\n🔍 Top Issues\n'));
    for (const issue of topIssues) {
      console.log(
        `${severityColor(issue.severity)(issue.severity.toUpperCase())} ` +
        `${chalk.dim(`${issue.location.file}:${issue.location.line}`)}`
      );
      console.log(`  ${issue.message}`);
      if (issue.suggestion) {
        console.log(`  ${chalk.dim('→')} ${chalk.italic(issue.suggestion)}`);
      }
      console.log();
    }
  }

  if (recommendations.length > 0) {
    console.log(chalk.bold('💡 Recommendations\n'));
    recommendations.forEach((rec: string, i: number) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }
  console.log();
}
