# FinOps Calculator MCP - Tool Specification (Draft v0.1)

This document defines the initial MCP contract for exposing the FinOps calculator as machine-consumable tools.

## Design goals
- Keep calculator math identical to the current web model.
- Return structured outputs for both UI and automation workflows.
- Support startup planning flows where ARPU is unknown.
- Preserve deterministic, auditable decisions.

## Proposed tools

### 1) `finops.calculate`
Primary tool. Runs model derivations and returns key outputs.

**Input**
- `inputs`: calculator inputs (`nRef`, `devPerClient`, `infraTotal`, `ARPU`, `startupTargetPrice`, `startupTargetClients`, `cudPct`, `margin`, `nMax`)
- `providers`: selected cloud providers
- `hiddenCurves`: optional chart visibility preferences
- `options`: output flags

**Output**
- `normalizedInputs`
- `model` (K, a, c, b, g, ARPU, m, nMax)
- `outputs` (break-even, min price, VCPU, margin, CCER, CUD saving, startup outputs)
- `health`
- `recommendations`
- `stateToken` (shareable snapshot token)

### 2) `finops.health`
Returns health score and zone only.

**Input**
- `inputs`
- `providers`

**Output**
- `zoneKey`, `zoneTitle`, `score`, `failedChecks`

### 3) `finops.recommend`
Returns prioritized recommendation cards by zone and providers.

**Input**
- `zoneKey`
- `providers`

**Output**
- `recommendations[]`

### 4) `finops.state.encode`
Encodes current state into a URL-safe token.

### 5) `finops.state.decode`
Decodes token back into validated state.

## Mapping to current codebase
Current browser logic to extract into shared core module:
- Recalculation pipeline: `recalculate()`
- Health engine: `updateHealthAndRecommendations()`
- Series generation: `buildData()`
- Share token behavior: `encodeShareState()` / `decodeShareState()`

## Suggested file layout
- `mcp/spec.md`
- `mcp/schemas/*.schema.json`
- `mcp/examples/*.json`
- `mcp/client-config-examples.md`
- `mcp/public-availability-plan.md`
- `mcp/server/finops-core.js`
- `mcp/server/index.js`
- `mcp/server/package.json`
- `mcp/tests/run-tests.mjs`

## Next implementation step
1. Add deterministic golden scenario fixtures beyond the current sample payload.
2. Select and execute one deployment/runtime profile from `mcp/public-availability-plan.md`.
3. Add optional schema-runtime validation layer in server request handling (AJV or equivalent).
