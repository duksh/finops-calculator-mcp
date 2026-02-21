import {
  calculateTool,
  healthTool,
  recommendTool,
  encodeStateTool,
  decodeStateTool,
  INPUT_SCHEMA_CALCULATE,
  INPUT_SCHEMA_HEALTH,
  INPUT_SCHEMA_RECOMMEND,
  INPUT_SCHEMA_STATE_ENCODE,
  INPUT_SCHEMA_STATE_DECODE
} from "./finops-core.js";

const SERVER_INFO = {
  name: "finops-calculator-mcp",
  version: "0.1.0"
};

const tools = [
  {
    name: "finops.calculate",
    description: "Run the FinOps calculator model and return normalized outputs, health, recommendations, and optional state token.",
    inputSchema: INPUT_SCHEMA_CALCULATE,
    handler: calculateTool
  },
  {
    name: "finops.health",
    description: "Compute health zone and score from calculator inputs.",
    inputSchema: INPUT_SCHEMA_HEALTH,
    handler: healthTool
  },
  {
    name: "finops.recommend",
    description: "Return prioritized recommendations based on health zone, provider, and optional category filter; when inputs are provided, strategic pricing/marketing/CRM recommendations are included.",
    inputSchema: INPUT_SCHEMA_RECOMMEND,
    handler: recommendTool
  },
  {
    name: "finops.state.encode",
    description: "Encode calculator state into a URL-safe state token.",
    inputSchema: INPUT_SCHEMA_STATE_ENCODE,
    handler: encodeStateTool
  },
  {
    name: "finops.state.decode",
    description: "Decode a URL-safe state token back into calculator state.",
    inputSchema: INPUT_SCHEMA_STATE_DECODE,
    handler: decodeStateTool
  }
];

const toolMap = new Map(tools.map((tool) => [tool.name, tool]));

function toErrorPayload(code, message, data) {
  return {
    code,
    message,
    ...(data ? { data } : {})
  };
}

function writeMessage(msg) {
  const json = JSON.stringify(msg);
  const payload = Buffer.from(json, "utf8");
  const header = Buffer.from(`Content-Length: ${payload.length}\r\n\r\n`, "utf8");
  process.stdout.write(Buffer.concat([header, payload]));
}

function writeResponse(id, result) {
  writeMessage({ jsonrpc: "2.0", id, result });
}

function writeError(id, code, message, data) {
  writeMessage({ jsonrpc: "2.0", id, error: toErrorPayload(code, message, data) });
}

function handleInitialize(id, params) {
  const requested = params?.protocolVersion;
  writeResponse(id, {
    protocolVersion: requested || "2024-11-05",
    capabilities: {
      tools: {}
    },
    serverInfo: SERVER_INFO
  });
}

function handleToolsList(id) {
  writeResponse(id, {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  });
}

function handleToolsCall(id, params) {
  const name = params?.name;
  const args = params?.arguments || {};

  if (typeof name !== "string" || !toolMap.has(name)) {
    writeError(id, -32602, `Unknown tool: ${String(name)}`);
    return;
  }

  try {
    const tool = toolMap.get(name);
    const structured = tool.handler(args);
    writeResponse(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(structured, null, 2)
        }
      ],
      structuredContent: structured
    });
  } catch (err) {
    writeResponse(id, {
      content: [
        {
          type: "text",
          text: err instanceof Error ? err.message : "Tool execution failed"
        }
      ],
      isError: true
    });
  }
}

function handleRequest(request) {
  const { id, method, params } = request;

  if (!method || typeof method !== "string") {
    if (id !== undefined) writeError(id, -32600, "Invalid Request");
    return;
  }

  if (method === "initialize") {
    handleInitialize(id, params || {});
    return;
  }

  if (method === "ping") {
    writeResponse(id, {});
    return;
  }

  if (method === "tools/list") {
    handleToolsList(id);
    return;
  }

  if (method === "tools/call") {
    handleToolsCall(id, params || {});
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (id !== undefined) writeError(id, -32601, `Method not found: ${method}`);
}

let buffer = Buffer.alloc(0);

function processBuffer() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const headerRaw = buffer.subarray(0, headerEnd).toString("utf8");
    const headers = headerRaw.split("\r\n");
    const lengthHeader = headers.find((h) => h.toLowerCase().startsWith("content-length:"));

    if (!lengthHeader) {
      buffer = buffer.subarray(headerEnd + 4);
      continue;
    }

    const contentLength = Number(lengthHeader.split(":")[1]?.trim());
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      buffer = buffer.subarray(headerEnd + 4);
      continue;
    }

    const totalNeeded = headerEnd + 4 + contentLength;
    if (buffer.length < totalNeeded) return;

    const payload = buffer.subarray(headerEnd + 4, totalNeeded).toString("utf8");
    buffer = buffer.subarray(totalNeeded);

    try {
      const message = JSON.parse(payload);
      handleRequest(message);
    } catch {
      writeError(null, -32700, "Parse error");
    }
  }
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  processBuffer();
});

process.stdin.on("error", (err) => {
  writeMessage({
    jsonrpc: "2.0",
    method: "server/error",
    params: {
      message: err instanceof Error ? err.message : "Unknown stdin error"
    }
  });
});
