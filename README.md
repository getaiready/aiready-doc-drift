# @aiready/components

[![npm](https://img.shields.io/npm/v/@aiready/components)](https://www.npmjs.com/package/@aiready/components) 

Unified shared components library (UI, charts, hooks, utilities) for AIReady.

## 🏛️ Architecture

```
                    🎯 USER
                      │
                      ▼
         🎛️  @aiready/cli (orchestrator)
          │     │     │     │     │     │     │     │     │
          ▼     ▼     ▼     ▼     ▼     ▼     ▼     ▼     ▼
        [PAT] [CTX] [CON] [AMP] [DEP] [DOC] [SIG] [AGT] [TST]
          │     │     │     │     │     │     │     │     │
          └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
                               │
                               ▼
                      🏢 @aiready/core

Legend:
  PAT = pattern-detect        CTX = context-analyzer
  CON = consistency           AMP = change-amplification
  DEP = deps-health           DOC = doc-drift
  SIG = ai-signal-clarity     AGT = agent-grounding
  TST = testability
  CMP = @aiready/components ★  (support package — shared UI library, not a scorer)
  ★   = YOU ARE HERE
```

## Features

- 🎨 **UI Components**: Button, Card, Input, Label, Badge, Container, Grid, Stack, Separator.
- 📊 **D3 Charts**: ForceDirectedGraph with physics-based layout.
- 🪝 **React Hooks**: `useDebounce`, `useD3`, `useForceSimulation`.

## Installation

```bash
pnpm add @aiready/components
```

## License

MIT