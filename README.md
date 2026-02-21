# MCP Workspace

This folder is dedicated to all Model Context Protocol (MCP) related work for the FinOps calculator.

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
