# MCP Workspace

Official product name: **FiceCal**.

Former descriptive name: FinOps and Cloud Economics Calculator.

This folder is dedicated to all Model Context Protocol (MCP) related work for FiceCal.

## Release 2 bundle (today)

Release 2 for MCP focuses on parity and model integrity with the FiceCal calculator:

- Deterministic economic scan (`scanEconomicRange`) for break-even and minimum unit-cost detection
- Unified cost helper (`totalCostAtClients`) reused across pricing and health calculations
- Break-even and recommendation context aligned to integer-range economics scan (not sampled chart points)
- Zero-infra CCER handling aligned to `Infinity` semantics with finite-only penalty scoring
- Zero-value cost input paths (`devPerClient=0`, `infraTotal=0`) normalized consistently in model derivation
- Cross-repo parity test validated against calculator source (`npm run test:parity`)
- Package version bumped to `0.2.0`

---

## Current contents

- `spec.md` - draft MCP tool contract and rollout scope
- `schemas/finops.calculate.request.schema.json` - request schema for the main calculator MCP tool
- `schemas/finops.calculate.response.schema.json` - response schema for the main calculator MCP tool
- `examples/calculate.request.json` - sample request payload
- `examples/calculate.response.json` - sample response payload
- `client-config-examples.md` - copy-paste MCP client configuration snippets (Cursor, Windsurf, Claude Desktop)
- `server/finops-core.js` - extracted pure calculator logic for MCP handlers
- `server/index.js` - MCP stdio server with tool registration and JSON-RPC handling
- `server/package.json` - scripts for local run/check/test
- `tests/run-tests.mjs` - contract and JSON-RPC protocol tests
- `tests/parity-finops-calculator.mjs` - cross-repo parity guard against `duksh/finops-calculator` main `index.html`
- `.github/workflows/mcp-parity.yml` - CI pipeline running syntax, tests, and parity guard

## Run MCP server locally

```bash
node /absolute/path/to/finops-calculator-mcp/server/index.js
```

Or from the server folder:

```bash
npm run start
```

Syntax check:

```bash
npm run check
```

Test suite:

```bash
npm run test
```

Cross-repo parity guard (MCP <-> web calculator):

```bash
npm run test:parity
```

Optional override target for parity checks:

```bash
FINOPS_CALCULATOR_RAW_URL="https://raw.githubusercontent.com/duksh/finops-calculator/main/index.html" npm run test:parity
```

Client integration examples:

```text
See client-config-examples.md
```

## Next implementation steps

1. Add scenario-based golden fixtures for regression coverage.
2. Add optional schema-runtime validation in server request handling.
3. Add hosted transport support if you need shared multi-user access.

## License

Apache-2.0. See `LICENSE`.
