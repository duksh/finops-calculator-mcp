# MCP Client Configuration Examples

Use these snippets to connect the local FinOps MCP stdio server:

- Server command: `node`
- Server args: `[/absolute/path/to/finops-calculator/mcp/server/index.js]`

> Replace paths with your own absolute paths.

## 1) Cursor

Cursor supports MCP server definitions in `mcp.json` (global or workspace scope depending on your setup).

Example:

```json
{
  "mcpServers": {
    "finops-calculator": {
      "command": "node",
      "args": [
        "/absolute/path/to/finops-calculator/mcp/server/index.js"
      ]
    }
  }
}
```

## 2) Windsurf

In Windsurf, open **Settings > Cascade > MCP Servers**, then use **View raw config** to edit `mcp_config.json`.

Example:

```json
{
  "mcpServers": {
    "finops-calculator": {
      "command": "node",
      "args": [
        "/absolute/path/to/finops-calculator/mcp/server/index.js"
      ]
    }
  }
}
```

## 3) Claude Desktop (macOS)

Config file path:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Example:

```json
{
  "mcpServers": {
    "finops-calculator": {
      "command": "node",
      "args": [
        "/absolute/path/to/finops-calculator/mcp/server/index.js"
      ]
    }
  }
}
```

## Verification checklist

1. Start the server manually once: `npm run start` (from `mcp/server`) and confirm no startup error.
2. Reload your MCP client after saving config.
3. Confirm the following tools appear:
   - `finops.calculate`
   - `finops.health`
   - `finops.recommend`
   - `finops.state.encode`
   - `finops.state.decode`
