# FiceCal Agent Hub Tool Contracts (v1)

This file defines the exact HTTP contracts for the first agent runtime hosted on Render.

## Base URL
- Render: `https://<service-name>.onrender.com`
- Local: `http://localhost:10000`

## 1) Health Check

### Request
- Method: `GET`
- Path: `/healthz`

### Response (200)
```json
{
  "status": "ok",
  "service": "ficecal-agent-hub",
  "workflow": "./workflows/triage.workflow.v1.json"
}
```

## 2) Triage Agent

### Request
- Method: `POST`
- Path: `/v1/agent/triage`
- Schema: `contracts/finops.agent.triage.request.schema.json`

Example:
```json
{
  "requestId": "req-2026-02-26-001",
  "inputs": {
    "nRef": 30,
    "devPerClient": 50,
    "infraTotal": 900,
    "ARPU": 120,
    "margin": 20,
    "cudPct": 0
  },
  "providers": ["aws"],
  "context": {
    "goal": "improve-health-zone",
    "audience": "cto",
    "maxActions": 3,
    "timeHorizonDays": 90
  },
  "options": {
    "includeStateToken": true,
    "includeRaw": true
  }
}
```

### Response
- Schema: `contracts/finops.agent.triage.response.schema.json`

### Success (200)
```json
{
  "requestId": "req-2026-02-26-001",
  "status": "success",
  "generatedAt": "2026-02-26T16:10:00.000Z",
  "summary": {
    "goal": "improve-health-zone",
    "currentZoneKey": "yellow",
    "currentZoneTitle": "Needs attention",
    "currentScore": 61,
    "headline": "Prioritize optimize commitment coverage to improve from Needs attention."
  },
  "actionPlan": [],
  "assumptions": [],
  "trace": {
    "workflowId": "triage.workflow.v1",
    "sourceTools": ["finops.calculate"],
    "stateTokenIncluded": true
  },
  "raw": {
    "health": {},
    "recommendations": [],
    "stateToken": "..."
  }
}
```

### Validation error (400)
```json
{
  "requestId": "triage-1700000000",
  "status": "needs-input",
  "error": "Missing required object: inputs"
}
```

### Internal error (500)
```json
{
  "status": "error",
  "error": "<message>"
}
```

## MCP mapping
- Triage execution uses existing deterministic MCP logic through `calculateTool()` from `server/finops-core.js`.
- No change to stdio MCP contract in `server/index.js` is required for v1.

## Planned v2 contracts
- `POST /v1/agent/whatif` (scenario search)
- `POST /v1/agent/executive-brief` (audience-shaped narrative)
- `POST /v1/a2a/task` (A2A task envelope)
