# FinOps MCP Public Availability Plan

This document defines what must happen to make `finops-calculator-mcp` publicly available and reliably usable.

## Goal

Allow external users to discover, install, and run FinOps MCP tools with predictable behavior and versioned releases.

## Current state

- MCP server exists as local stdio server (`mcp/server/index.js`)
- Core logic is extracted (`mcp/server/finops-core.js`)
- Contract + protocol tests exist (`mcp/tests/run-tests.mjs`)
- Client config examples exist (`mcp/client-config-examples.md`)

## Public availability paths

## Path A - Open-source local run (recommended first)

Users run the server on their own machine via MCP client config.

### Required actions

1. **Repository hygiene**
   - Keep clear setup docs in `mcp/README.md`
   - Add release notes/changelog for each version
2. **Versioning**
   - Use semantic version tags (e.g., `v0.1.0`, `v0.1.1`)
3. **Distribution**
   - Option 1: git clone + `npm run start`
   - Option 2: publish package to npm for easier install
4. **Quality gate**
   - Require `npm run check` and `npm run test` before release
5. **User onboarding**
   - Keep copy/paste config for Cursor/Windsurf/Claude Desktop up to date

### Outcome

Fastest route to public usage with low ops overhead.

## Path B - Hosted MCP service (team/public SaaS-style)

Users connect to a hosted endpoint instead of running locally.

### Required actions

1. **Transport layer**
   - Add hosted MCP transport mode (HTTP/SSE/WebSocket based on target clients)
2. **Deployment target**
   - Pick runtime: Cloud Run, Fly.io, Render, or internal platform
3. **Security**
   - API auth (API keys or OAuth)
   - TLS enforced
   - request size/time limits and rate limiting
4. **Reliability**
   - health endpoint and restart policy
   - structured logs + basic metrics
5. **Operations**
   - CI/CD deploy pipeline
   - incident ownership and support process

### Outcome

Best for centralized multi-user access, but higher build + operational cost.

## Recommended rollout strategy

1. **Phase 1 (now): Public repo + local stdio**
   - Publish docs and release tags
   - Keep improving regression fixtures
2. **Phase 2: Optional npm package**
   - Simplify user installation and upgrades
3. **Phase 3: Hosted service (if demand requires)**
   - Add auth, observability, and SLO-backed deployment

## Release checklist (minimum)

- [ ] `npm run check` passes
- [ ] `npm run test` passes
- [ ] `mcp/examples/*` aligned with current model outputs
- [ ] `mcp/client-config-examples.md` validated
- [ ] release tag created
- [ ] release notes published

## Decision guide

Use **Path A** if your primary goal is immediate community adoption with minimal infrastructure.
Use **Path B** if your primary goal is organization-wide shared access and central governance.
