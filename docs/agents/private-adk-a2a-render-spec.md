# Private Implementation Spec: FiceCal Agent Hub (ADK + A2A) on Render

## Status
- Draft v0.1
- Scope: MVP implementation plan for agent features on top of the existing MCP calculator core.
- Privacy intent: internal planning artifact (not for public site mirroring).

## Goals
1. Add an agent orchestration layer without changing deterministic FinOps math.
2. Reuse existing MCP tool logic (`finops.calculate`, `finops.health`, `finops.recommend`).
3. Provide an HTTP runtime that can be hosted on Render free tier for MVP.
4. Define a first workflow: Triage Agent (high-priority actions + executive summary).
5. Keep an extension point for A2A interoperability after MVP hardening.

## Non-goals (MVP)
- No replacement of existing MCP stdio server.
- No multi-tenant auth system in v0.1.
- No long-running async task queue in v0.1.
- No external LLM dependency required for first deterministic triage run.

## Current baseline
- Existing stdio MCP server: `server/index.js`
- Deterministic model and recommendations: `server/finops-core.js`
- Existing tools already available for orchestration:
  - `finops.calculate`
  - `finops.health`
  - `finops.recommend`
  - `finops.state.encode`
  - `finops.state.decode`

## Target architecture (MVP)

### Components
1. **MCP Core (existing)**
   - Source of truth for calculations and recommendations.
   - Remains deterministic and auditable.

2. **Agent Hub HTTP service (new, `server/agents`)**
   - Render-hostable web service.
   - Entry endpoint for agent requests (`/v1/agent/triage`).
   - Calls MCP core functions in-process for v0.1.

3. **Workflow definition files (new)**
   - JSON workflow contracts under `server/agents/workflows/`.
   - First workflow: `triage.workflow.v1.json`.

4. **Tool contracts (new)**
   - Request/response JSON schemas under `server/agents/contracts/`.

5. **A2A Gateway (planned, post-MVP)**
   - Optional endpoint group (`/v1/a2a/*`) for agent-to-agent tasks.
   - Disabled by default in v0.1.

## Render deployment profile
- Platform: Render Web Service
- Plan: Free
- Runtime: Node.js (from `server/agents/package.json`)
- Startup command: `npm run start`
- Health endpoint: `GET /healthz`
- CORS origin allowlist: `https://duksh.github.io`

Expected MVP behavior on free tier:
- Cold starts possible after idle periods.
- Suitable for demos and low-volume executive workflows.

## MVP API contract
- `POST /v1/agent/triage`
  - Input: `finops.agent.triage.request.schema.json`
  - Output: `finops.agent.triage.response.schema.json`

## First ADK workflow (triage)
1. Validate request shape and defaults.
2. Run baseline model (`finops.calculate`).
3. Derive health status (`health` from calculate response).
4. Select and rank top 3 actions from recommendations.
5. Build executive summary (headline + action plan + assumptions).
6. Return deterministic response with trace metadata.

## Tooling and versioning rules
- Contracts use explicit version suffix (`v1`).
- Backward incompatible schema changes require new file version (`v2`).
- Workflow file and tool contract versions must be bumped together.

## Security and privacy controls (MVP)
- No secrets in repo.
- Render environment variables only for runtime flags.
- Restrict CORS to approved origin(s).
- Add request ID and timestamp in each response for auditability.

## Rollout plan
1. **R1**: Contract + workflow + folder skeleton (this phase).
2. **R2**: Add ADK runtime adapter (same contracts, same workflow semantics).
3. **R3**: Add A2A interoperability endpoints and capability card.
4. **R4**: Add auth, rate limits, and async task execution for larger simulations.

## Acceptance criteria for this draft
- Agent folder skeleton exists and is Render-ready.
- Exact triage request/response contracts are checked in.
- First workflow file exists and maps directly to current MCP tools.
- Service can return a deterministic triage response in local run.
