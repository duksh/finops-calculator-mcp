# FiceCal Agent Hub (Render MVP Skeleton)

This folder contains the first implementation skeleton for agent features on top of the existing MCP core.

## Why this exists
- Keep `server/index.js` as stdio MCP for tool clients.
- Add a separate HTTP service suitable for Render hosting.
- Start with deterministic triage flow using existing calculator logic.

## Folder layout
- `api-server.js` - HTTP entrypoint for `/healthz` and `/v1/agent/triage`
- `contracts/` - versioned request/response schemas and tool contract docs
- `workflows/` - first workflow definition (`triage.workflow.v1.json`)
- `render/` - Render deployment blueprint
- `.env.example` - runtime env template

## Local run
```bash
npm run start
```

Default URL:
- `http://localhost:10000/healthz`
- `http://localhost:10000/v1/agent/triage`

## Contract source of truth
Use `contracts/finops.agent.triage.request.schema.json` and `contracts/finops.agent.triage.response.schema.json`.

## Notes
- This is intentionally dependency-light and deterministic for MVP.
- ADK runtime adapter can be added without changing public API contracts.
