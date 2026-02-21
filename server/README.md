# FinOps MCP Server (stdio)

Minimal MCP server exposing calculator capabilities via JSON-RPC over stdio.

## Tools
- `finops.calculate`
- `finops.health`
- `finops.recommend`
- `finops.state.encode`
- `finops.state.decode`

## Run locally

```bash
node /absolute/path/to/finops-calculator-mcp/server/index.js
```

Or from this folder:

```bash
npm run start
```

Validate server files and tests:

```bash
npm run check
npm run test
npm run test:parity
```

## Notes
- No external dependencies required.
- Uses the same model defaults and startup-planning behavior as the web calculator.
- Input and output contract targets files in `../schemas/`.
