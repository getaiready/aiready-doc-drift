# @aiready/doc-drift

> AIReady Spoke: Tracks documentation freshness versus code churn to pinpoint outdated comments that confuse AI models.

[![npm version](https://img.shields.io/npm/v/@aiready/doc-drift.svg)](https://npmjs.com/package/@aiready/doc-drift)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

AI models rely heavily on inline documentation and function signatures. When code changes but comments don't, AI models often hallucinate based on the stale documentation. The **Documentation Drift** analyzer combines AST parsing with git log traversal to identify instances where comments are likely lagging behind actual implementation logic. 

## Features

- **Drift Detection**: Detects documentation older than the code it describes based on git history timestamps.
- **Signature Mismatches**: Finds missing documented `@param` tags when new arguments are added to functions.
- **Complexity Guardrails**: Identifies long or complex functions that completely lack documentation.

## Installation

```bash
npm install -g @aiready/cli @aiready/doc-drift
```

## Usage

This tool is designed to be run through the unified AIReady CLI.

```bash
# Scan a codebase for documentation drift
aiready scan . --tools doc-drift

# Output detailed JSON report
aiready scan . --tools doc-drift --output json
```

## How It Works

1. Parses your codebase into an Abstract Syntax Tree (AST).
2. Uses `git log` to find the last modified timestamp for the code body limits vs the associated comment block.
3. Calculates a freshness ratio. If the comment trails the code body by several months (`--stale-months`), it flags the function as having a high risk of documentary drift.

## License

MIT
