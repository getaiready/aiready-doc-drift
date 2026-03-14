#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeContext } from './analyzer';
import { generateSummary } from './summary';
import {
  displayConsoleReport,
  generateHTMLReport,
  runInteractiveSetup,
} from './utils/output-formatter';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import {
  loadMergedConfig,
  handleJSONOutput,
  handleCLIError,
  getElapsedTime,
  resolveOutputPath,
} from '@aiready/core';

import { contextActionHandler } from './cli-action';

const program = new Command();

program
  .name('aiready-context')
  .description('Analyze AI context window cost and code structure')
  .version('0.1.0')
  .addHelpText(
    'after',
    '\nCONFIGURATION:\n  Supports config files: aiready.json, aiready.config.json, .aiready.json, .aireadyrc.json, aiready.config.js, .aireadyrc.js\n  CLI options override config file settings'
  )
  .argument('<directory>', 'Directory to analyze')
  .option('--max-depth <number>', 'Maximum acceptable import depth')
  .option(
    '--max-context <number>',
    'Maximum acceptable context budget (tokens)'
  )
  .option('--min-cohesion <number>', 'Minimum acceptable cohesion score (0-1)')
  .option(
    '--max-fragmentation <number>',
    'Maximum acceptable fragmentation (0-1)'
  )
  .option(
    '--focus <type>',
    'Analysis focus: fragmentation, cohesion, depth, all'
  )
  .option('--include-node-modules', 'Include node_modules in analysis')
  .option('--include <patterns>', 'File patterns to include (comma-separated)')
  .option('--exclude <patterns>', 'File patterns to exclude (comma-separated)')
  .option(
    '--max-results <number>',
    'Maximum number of results to show in console output'
  )
  .option(
    '-o, --output <format>',
    'Output format: console, json, html',
    'console'
  )
  .option('--output-file <path>', 'Output file path (for json/html)')
  .option(
    '--interactive',
    'Run interactive setup to suggest excludes and focus areas'
  )
  .action(contextActionHandler);

program.parse(process.argv);
