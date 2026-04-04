# 🔄 Two-Way Sync Architecture: Evolution-as-a-Service (EaaS)

**Goal:** To establish a robust, reliable, and automated infrastructure that allows the Hub (Mother Repo) to push innovations to Spokes (Client Repos) while absorbing client-specific optimizations back into the Hub.

---

## 🏗️ 1. Core Mechanism: Subtree-as-a-Service

While `git subtree` is the primitive, our architecture wraps it in a governance layer.

### **Hub (Mother): `serverlessclaw`**

- **Location**: `serverlessclaw/` (Internal to Monorepo)
- Contains the "Canonical Blueprint".
- Master source of truth for all "Agentic Ready" infra.
- **Upstream Updates**: When a core feature is improved here, it prepares for "Broadcast" to client repositories.

### **Orchestrator (Management Plane): `clawmore`**

- **Location**: `packages/aiready/clawmore`
- Acts as the "Brain" that manages the sync logic.
- Maintains the `sync-rules.json` and registry of client repos.
- Executes the `sync-orchestrator.ts` logic.

### **Spoke (Client): `clawmore-client-{id}`**

- Standalone standalone repositories containing the managed stack for each client.
- **Downstream Absorption**: Periodically unified with Hub updates via `clawmore` orchestration.

---

## 🔄 2. The Two-Way Flow

### **A. Hub → Spoke (The Broadcast)**

1.  **Tagging**: Hub creates a release tag (e.g., `v1.2.0`).
2.  **Staging**: A Sync Agent creates a `feature/sync-hub-v1.2.0` branch in the Spoke repo.
3.  **Subtree Pull**: `git subtree pull --prefix=. hub main --squash`.
4.  **Validation**: CI/CD runs Spoke-specific tests.
5.  **Auto-Merge**: If tests pass, the sync branch is merged to `main`.

### **B. Spoke → Hub (The Contribution)**

1.  **Opt-in Check**: The **Harvester** (gpt-5.4-mini) only scans Spokes that have explicitly opted into the "Co-evolution" protocol.
2.  **Optimization Detection**: Identifies a successful refactor or optimization in the Spoke.
3.  **Structured Extraction**: Uses a **Strict JSON Schema** to extract only the "Innovation Pattern" (Logic, Rationale, and Abstracted Diff).
    This ensures NO client secrets, PII, or branding can ever be part of the output.
4.  **Dashboard Submission**: The structured proposal is submitted to the **ClawMore Management Dashboard** (The Management Plane).
5.  **Curation & Promotion**: Hub maintainers review all client proposals in a unified view. High-value patterns are "Promoted," which automatically generates an anonymous PR in the Mother Hub repo (`serverlessclaw`).
6.  **Global Distribution**: Once merged in the Hub, the innovation is synced to ALL other Spokes via the **Hub → Spoke (Broadcast)** flow.

---

## 🛡️ 3. Reliability & Robustness

### **Conflict Resolution Strategy**

- **Priority Rules**: Hub always wins for "Core" files (defined in `.sync-rules`). Spoke wins for "Configuration" files.
- **Agentic Mediation**: If a conflict occurs, a `ResolutionAgent` analyzes the semantic difference and proposes a fix rather than failing the build.

### **Atomic Syncs**

- Every sync must be **idempotent**.
- **Rollback Mechanism**: If a deploy fails post-sync, the Spoke repo automatically reverts to the pre-sync tag.

### **Validation Gates**

- **The "Evolution Sandbox"**: Updates are first applied to a `sandbox` spoke to verify no breaking changes occur in the "Vending" logic.
- **Contract Testing**: Ensuring API interfaces between Hub and Spoke remain compatible.

### **Safe Evolution Patterns**

The sync architecture implements safe evolution through:

1. **Versioned Adapters**: ClawMore uses adapter pattern to translate between platform and core interfaces
2. **Feature Flags**: Gradual rollout of new core features with rollback capability
3. **Canary Deployments**: 10% traffic testing before full rollout
4. **Compatibility Matrix**: Automated testing of version combinations

For detailed architectural patterns, see [EVOLUTION_SEPARATION.md](./EVOLUTION_SEPARATION.md).

### **Evolution Separation Metrics**

| Metric                      | Target | Purpose                          |
| --------------------------- | ------ | -------------------------------- |
| **Adapter Coverage**        | 100%   | All core features have adapters  |
| **Contract Test Pass Rate** | 100%   | Interface compatibility verified |
| **Canary Error Rate**       | < 0.1% | Early failure detection          |
| **Migration Success Rate**  | > 99%  | Client upgrade reliability       |

---

## 🚀 4. Automation: The Sync Swarm

We shift from manual Makefiles to an **Autonomous Sync Swarm**:

| Agent Role      | Responsibility                                              |
| :-------------- | :---------------------------------------------------------- |
| **Broadcaster** | Monitors Hub commits and initiates Spoke syncs.             |
| **Validator**   | Runs test suites in Spokes post-sync (uses GPT-5.4).        |
| **Harvester**   | Management-plane agent scanning Spokes (uses gpt-5.4-mini). |
| **Janitor**     | Cleans up sync branches and monitors repo health.           |

### **The "Injected" Harvester Pattern**

To maintain Trunk-Based Development (TBD) integrity in the Mother repo (`serverlessclaw`), the **Harvester** logic is decoupled:

- **Registry**: Harvester lives in the `clawmore` management plane.
- **Injection**: During client deployment, ClawMore creates a cross-account IAM role or GitHub Action secret that allows the Harvester to "reach in" and scan the Spoke.
- **Benefit**: The client's codebase remains "pure" serverless logic without proprietary harvesting boilerplate.

---

## 📅 5. Implementation Roadmap

- [x] **Phase 1**: Formalize `.sync-rules.json` to define file ownership.
- [x] **Phase 2**: Implement the `Broadcaster` (via GitHub `workflow_dispatch`) to trigger initial deployments of forked Spokes.
- [ ] **Phase 3**: Build the "Contribution Dashboard" for the Hub owner to approve incoming Spoke refactors.

---

**Status:** `DRAFT_FOR_REVIEW`  
**Owner:** ClawMore Engineering
