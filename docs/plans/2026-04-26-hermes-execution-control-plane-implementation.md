# Hermes Execution Control Plane Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local control plane where the frontend manages Hermes Docker, Hermes configuration, Agent conversation, venue execution, and generic execution evidence.

**Architecture:** The browser talks only to the local backend. The backend owns Docker lifecycle, `./hermes` file writes, Hermes API proxying, risk gates, audit records, and evidence reconciliation. Hermes remains the Agent brain and calls execution venues such as OKX Onchain OS; the backend normalizes execution results into venue-agnostic evidence.

**Tech Stack:** Vite, React, TypeScript, Express, Node `child_process`, Docker CLI, Hermes API Server, OKX Onchain OS Skills/MCP or Open API adapters, Node test runner with `tsx`.

---

### Task 1: Runtime Types And Evidence Model

**Files:**
- Modify: `/Users/elanchou/Desktop/Projects/a./src/types.ts`
- Create: `/Users/elanchou/Desktop/Projects/a./src/server/executionTypes.ts`
- Test: `/Users/elanchou/Desktop/Projects/a./tests/executionTypes.test.ts`

**Step 1: Write the failing test**

Create tests that assert:

- `normalizeExecutionEvidence()` accepts on-chain evidence.
- It accepts CEX order evidence.
- It rejects unknown evidence kinds.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/executionTypes.test.ts`

Expected: FAIL because `executionTypes.ts` does not exist.

**Step 3: Implement minimal types**

Create:

- `ExecutionVenue`
- `ExecutionEvidence`
- `ExecutionIntent`
- `ExecutionRecord`
- `normalizeExecutionEvidence(input: unknown): ExecutionEvidence`

Use the generic evidence shape from `docs/plans/2026-04-26-hermes-okx-execution-architecture-design.md`.

**Step 4: Run test**

Run: `npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/types.ts src/server/executionTypes.ts tests/executionTypes.test.ts
git commit -m "feat: add execution evidence model"
```

### Task 2: Hermes Runtime Controller

**Files:**
- Create: `/Users/elanchou/Desktop/Projects/a./src/server/hermesRuntime.ts`
- Test: `/Users/elanchou/Desktop/Projects/a./tests/hermesRuntime.test.ts`

**Step 1: Write failing tests**

Cover:

- `.env` merge preserves existing API secrets.
- Docker run args match official gateway shape:
  `docker run -d --name hermes --restart unless-stopped -v ./hermes:/opt/data -p 8642:8642 nousresearch/hermes-agent gateway run`
- API base URL defaults to `http://127.0.0.1:8642`.
- Container inspect logic can classify `missing`, `stopped`, `running`, and `healthy` using injectable command runners.

**Step 2: Run test to verify failure**

Run: `npm test -- tests/hermesRuntime.test.ts`

Expected: FAIL because runtime module does not exist.

**Step 3: Implement controller**

Functions:

- `createHermesRuntimeConfig()`
- `ensureHermesWorkspace()`
- `configureHermesApiServer()`
- `buildDockerRunArgs()`
- `startHermesDocker()`
- `getHermesRuntimeStatus()`
- `testHermesApi()`
- `sendHermesResponse()` for `/v1/responses`
- `sendHermesChatCompletion()` for probes
- `readHermesWorkspace()`
- `writeHermesSoul()`

Important behavior:

- Use container name `hermes`.
- Reuse an existing running `hermes` container when it mounts the project `./hermes` directory.
- Do not start a second gateway on the same data directory.
- Do not print secrets in logs or API responses.

**Step 4: Run tests**

Run: `npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/server/hermesRuntime.ts tests/hermesRuntime.test.ts
git commit -m "feat: add hermes runtime controller"
```

### Task 3: Backend API Surface

**Files:**
- Modify: `/Users/elanchou/Desktop/Projects/a./server.ts`
- Test: `/Users/elanchou/Desktop/Projects/a./tests/backendRoutes.test.ts`

**Step 1: Write failing route tests**

Cover:

- `GET /api/hermes/runtime` returns status and redacts secrets.
- `POST /api/hermes/setup` starts or reuses Docker and returns runtime status.
- `GET /api/hermes/workspace` returns data dir, SOUL, skill count, and config presence.
- `POST /api/hermes/config` writes SOUL and API server env values.
- `POST /api/hermes/probe` calls Hermes through backend.

Use dependency injection or test doubles for Docker and Hermes HTTP calls so tests do not require Docker.

**Step 2: Run test to verify failure**

Run: `npm test -- tests/backendRoutes.test.ts`

Expected: FAIL.

**Step 3: Implement routes**

Add backend routes:

- `GET /api/hermes/runtime`
- `POST /api/hermes/setup`
- `GET /api/hermes/workspace`
- `POST /api/hermes/config`
- `POST /api/hermes/probe`
- `POST /api/agent/control`
- `GET /api/executions`

Keep legacy endpoints only if the UI still needs them.

**Step 4: Run tests**

Run: `npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add server.ts tests/backendRoutes.test.ts
git commit -m "feat: expose hermes control plane api"
```

### Task 4: Venue Adapter Interface

**Files:**
- Create: `/Users/elanchou/Desktop/Projects/a./src/server/venues/types.ts`
- Create: `/Users/elanchou/Desktop/Projects/a./src/server/venues/okxOnchainVenue.ts`
- Create: `/Users/elanchou/Desktop/Projects/a./src/server/venues/mockVenue.ts`
- Test: `/Users/elanchou/Desktop/Projects/a./tests/venueAdapters.test.ts`

**Step 1: Write failing tests**

Cover:

- Mock venue returns deterministic evidence.
- OKX venue builds a Hermes instruction payload instead of calling OKX directly from backend.
- Adapter output always normalizes into `ExecutionEvidence`.

**Step 2: Run failure**

Run: `npm test -- tests/venueAdapters.test.ts`

Expected: FAIL.

**Step 3: Implement adapters**

Define:

```ts
interface ExecutionVenueAdapter {
  id: ExecutionVenue;
  buildHermesInstruction(intent: ExecutionIntent): string;
  normalizeHermesResult(result: unknown): ExecutionEvidence[];
}
```

OKX adapter should produce Hermes instructions that tell Hermes to use OKX Onchain OS Skills/MCP. Backend does not call OKX as a direct callback target.

**Step 4: Run tests**

Run: `npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/server/venues tests/venueAdapters.test.ts
git commit -m "feat: add execution venue adapters"
```

### Task 5: Risk Gate And Audit Store

**Files:**
- Create: `/Users/elanchou/Desktop/Projects/a./src/server/risk.ts`
- Create: `/Users/elanchou/Desktop/Projects/a./src/server/auditStore.ts`
- Test: `/Users/elanchou/Desktop/Projects/a./tests/riskAndAudit.test.ts`

**Step 1: Write failing tests**

Cover:

- Reject live trades when kill switch is active.
- Reject disallowed venue.
- Reject disallowed chain/token.
- Reject trade above max USD.
- Require manual approval above threshold.
- Audit store redacts secret-looking fields.

**Step 2: Run failure**

Run: `npm test -- tests/riskAndAudit.test.ts`

Expected: FAIL.

**Step 3: Implement minimal risk gates**

Implement:

- `evaluateRisk(intent, config, portfolioState)`
- `appendAuditEvent(event)`
- `listAuditEvents()`

Store audit data in memory first. File-backed SQLite or JSONL can be a later enhancement.

**Step 4: Run tests**

Run: `npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/server/risk.ts src/server/auditStore.ts tests/riskAndAudit.test.ts
git commit -m "feat: add risk gates and audit store"
```

### Task 6: Agent Execution Orchestrator

**Files:**
- Create: `/Users/elanchou/Desktop/Projects/a./src/server/executionOrchestrator.ts`
- Modify: `/Users/elanchou/Desktop/Projects/a./server.ts`
- Test: `/Users/elanchou/Desktop/Projects/a./tests/executionOrchestrator.test.ts`

**Step 1: Write failing tests**

Cover:

- Paper execution uses mock venue and records evidence.
- Live execution calls risk gate before Hermes.
- Hermes result is normalized into execution records.
- Failed Hermes response becomes failed evidence.

**Step 2: Run failure**

Run: `npm test -- tests/executionOrchestrator.test.ts`

Expected: FAIL.

**Step 3: Implement orchestrator**

Implement:

- `createExecutionIntent()`
- `runExecutionIntent()`
- `reconcileExecutionEvidence()`

Prefer Hermes `/v1/responses` for command runs because it supports server-side conversation state. Keep `/v1/chat/completions` for connection probes.

**Step 4: Run tests**

Run: `npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/server/executionOrchestrator.ts server.ts tests/executionOrchestrator.test.ts
git commit -m "feat: orchestrate hermes venue execution"
```

### Task 7: Frontend Settings And Runtime UI

**Files:**
- Modify: `/Users/elanchou/Desktop/Projects/a./src/components/SettingsView.tsx`
- Modify: `/Users/elanchou/Desktop/Projects/a./src/types.ts`

**Step 1: Add UI states**

Settings must show:

- Docker container status
- Hermes API health
- data directory
- SOUL editor
- skill count
- API probe button
- redacted secret status

**Step 2: Connect to backend routes**

Use:

- `POST /api/hermes/setup`
- `GET /api/hermes/runtime`
- `GET /api/hermes/workspace`
- `POST /api/hermes/config`
- `POST /api/hermes/probe`

**Step 3: Manual browser check**

Run: `npm run dev`

Open: `http://localhost:3000`

Expected:

- Start Hermes button reports existing/running/healthy state.
- Probe chat shows Hermes response or a clear failure.
- SOUL save updates backend state.

**Step 4: Commit**

```bash
git add src/components/SettingsView.tsx src/types.ts
git commit -m "feat: add hermes runtime settings ui"
```

### Task 8: Frontend Execution Evidence UI

**Files:**
- Modify: `/Users/elanchou/Desktop/Projects/a./src/App.tsx`
- Modify: `/Users/elanchou/Desktop/Projects/a./src/components/TradeList.tsx`
- Create: `/Users/elanchou/Desktop/Projects/a./src/components/ExecutionEvidencePanel.tsx`

**Step 1: Add evidence display**

Create a panel that renders:

- Venue
- Evidence kind
- Status
- txHash or orderId
- Last reconciliation time
- Error summary when failed

**Step 2: Wire executions route**

Fetch `GET /api/executions`.

**Step 3: Manual browser check**

Expected:

- Paper mode creates mock evidence.
- OKX mode shows pending/submitted evidence from Hermes result.
- CEX-shaped mock evidence renders without UI changes.

**Step 4: Commit**

```bash
git add src/App.tsx src/components/TradeList.tsx src/components/ExecutionEvidencePanel.tsx
git commit -m "feat: show generic execution evidence"
```

### Task 9: End-To-End Verification

**Files:**
- Modify: `/Users/elanchou/Desktop/Projects/a./README.md`
- Modify: `/Users/elanchou/Desktop/Projects/a./.gitignore`

**Step 1: Clean runtime ignores**

Ensure `.gitignore` excludes:

- `hermes/`
- `.playwright-mcp/`
- dashboard screenshots
- `.env`
- `.env.local`

**Step 2: Run checks**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: all pass. Build may show chunk size warning; that is acceptable.

**Step 3: Docker integration check**

Run local backend and verify:

- `POST /api/hermes/setup`
- `GET /api/hermes/runtime`
- `POST /api/hermes/probe`

Expected:

- If Docker is available, Hermes starts or is reused.
- If port is occupied by a compatible `hermes` container, backend reuses it.
- If Hermes is unhealthy, error explains next step.

**Step 4: Browser check**

Open `http://localhost:3000`.

Check:

- Settings setup/probe flow.
- SOUL save flow.
- Dashboard start/pause/kill flow.
- Execution evidence display.

**Step 5: Commit**

```bash
git add README.md .gitignore
git commit -m "docs: document hermes control plane workflow"
```

### Task 10: Final Review

**Files:**
- All touched files

**Step 1: Review git diff**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: clean or only intentional untracked local runtime files.

**Step 2: Summarize behavior**

Document:

- Docker startup path
- Hermes API path
- OKX venue path
- Evidence reconciliation path
- Known limitations

**Step 3: Final commit if needed**

Only commit intentional docs or cleanup.
