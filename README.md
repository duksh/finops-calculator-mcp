# MCP Workspace

This folder is dedicated to all Model Context Protocol (MCP) related work for the FinOps calculator.

## Current contents

- `spec.md` - draft MCP tool contract and rollout scope
- `schemas/finops.calculate.request.schema.json` - request schema for the main calculator MCP tool
- `schemas/finops.calculate.response.schema.json` - response schema for the main calculator MCP tool
- `examples/calculate.request.json` - sample request payload
- `examples/calculate.response.json` - sample response payload
- `client-config-examples.md` - copy-paste MCP client configuration snippets (Cursor, Windsurf, Claude Desktop)
- `public-availability-plan.md` - rollout guide for making the MCP publicly consumable
- `server/finops-core.js` - extracted pure calculator logic for MCP handlers
- `server/index.js` - MCP stdio server with tool registration and JSON-RPC handling
- `server/package.json` - scripts for local run/check/test
- `tests/run-tests.mjs` - contract and JSON-RPC protocol tests

## Run MCP server locally

```bash
node /absolute/path/to/finops-calculator/mcp/server/index.js
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

Client integration examples:

```text
See mcp/client-config-examples.md
```

Public rollout plan:

```text
See mcp/public-availability-plan.md
```

## Next implementation steps

1. Choose one rollout path from `mcp/public-availability-plan.md` and execute it.
2. Add scenario-based golden fixtures for regression coverage.
3. Add optional schema-runtime validation in server request handling.

## License

Apache-2.0. See `../LICENSE`.
