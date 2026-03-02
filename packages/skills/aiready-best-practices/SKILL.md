---
name: aiready-best-practices
description: Guidelines for writing AI-friendly code. Detects semantic duplicates, context fragmentation, naming inconsistencies. Use when writing new code, reviewing PRs, refactoring for AI adoption, or debugging AI assistant confusion. Helps minimize context waste and improve AI comprehension.
license: MIT
metadata:
  author: aiready
  version: '0.2.2'
---

# AIReady Best Practices

Guidelines for writing AI-friendly codebases that AI coding assistants can understand and maintain effectively. Based on analysis of thousands of repositories and common AI model failure patterns. Covers pattern detection, AI signal clarity, context optimization, change amplification, agent grounding, consistency checking, documentation, testability, and dependency management.

## Core Capabilities

1.  **AI Signal Clarity:** Principles for reducing ambiguity in code.
2.  **Context Optimization:** Strategies for minimizing context window waste.
3.  **Pattern Detection:** Identifying and consolidating semantic duplicates.
4.  **Consistency:** Maintaining uniform naming and architectural patterns.
5.  **Health Assessment:** Using `aiready scan` for proactive codebase auditing.

## Usage for Agents

Full instructions are available in [AGENTS.md](./AGENTS.md).

> [!NOTE]
> This document is automatically generated from individual rules in the [`rules/`](./rules/) directory. Contributors should modify the source rules rather than the compiled file.

### Quick Commands (via npx)

- **Measure Health:** `npx @aiready/cli scan .`
- **Check Consistency:** `npx @aiready/cli consistency .`
- **Detect Duplicates:** `npx @aiready/cli patterns .`
