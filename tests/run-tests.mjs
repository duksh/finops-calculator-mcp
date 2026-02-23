import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  calculateTool,
  healthTool,
  recommendTool,
  encodeStateTool,
  decodeStateTool
} from "../server/finops-core.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readJson(relativePath) {
  const abs = path.resolve(__dirname, relativePath);
  const raw = await readFile(abs, "utf8");
  return JSON.parse(raw);
}

function assertRequiredKeys(obj, required, context) {
  required.forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `${context} missing required key: ${key}`);
  });
}

async function runContractTests() {
  const reqSchema = await readJson("../schemas/finops.calculate.request.schema.json");
  const resSchema = await readJson("../schemas/finops.calculate.response.schema.json");
  const requestExample = await readJson("../examples/calculate.request.json");
  const responseExample = await readJson("../examples/calculate.response.json");

  assertRequiredKeys(requestExample, reqSchema.required || [], "request example");

  const calculated = calculateTool(requestExample);
  assertRequiredKeys(calculated, resSchema.required || [], "calculate response");
  assertRequiredKeys(calculated.model, resSchema.properties.model.required || [], "calculate response model");

  assert.equal(
    calculated.meta.arpuMode,
    responseExample.meta.arpuMode,
    "arpuMode should match the example response fixture"
  );
  assert.equal(
    calculated.outputs.breakEvenClients,
    responseExample.outputs.breakEvenClients,
    "break-even should match the example response fixture"
  );
  assert.equal(
    calculated.health?.zoneKey,
    responseExample.health?.zoneKey,
    "health zone should match the example response fixture"
  );
  assert.ok(calculated.outputs.normalization, "normalization output should be present");
  assert.deepEqual(
    calculated.outputs.normalization.selectedDomains,
    responseExample.outputs.normalization.selectedDomains,
    "selected domains should match example fixture"
  );
  assert.equal(
    calculated.outputs.normalization.weightingPolicy.recommendedMode,
    "financial-truth",
    "default weighting policy mode should be financial-truth"
  );
  assert.ok(Array.isArray(calculated.recommendations), "recommendations should be array");

  const withSeries = calculateTool({
    inputs: {
      nRef: 100,
      devPerClient: 500,
      infraTotal: 2400,
      ARPU: 30,
      nMax: 500
    },
    options: {
      includeHealth: false,
      includeRecommendations: false,
      includeSeries: true,
      includeStateToken: false
    }
  });
  assert.ok(Array.isArray(withSeries.series), "includeSeries should return a series array");
  assert.ok(withSeries.series.length > 0, "series should include data points");
  const lastPoint = withSeries.series[withSeries.series.length - 1];
  assert.ok(lastPoint && Number.isFinite(lastPoint.n), "series last point should include n");
  assert.ok(Number.isFinite(lastPoint.revenue), "series last point should include revenue");
  assert.equal(
    Math.round(lastPoint.revenue),
    Math.round(withSeries.model.ARPU * lastPoint.n),
    "series revenue should scale as ARPU * n"
  );

  const health = healthTool({
    inputs: {
      devPerClient: 500,
      infraTotal: 2400,
      startupTargetPrice: 35
    }
  });
  assert.ok(["green", "yellow", "red", "awaiting"].includes(health.zoneKey), "invalid health zone");

  const recs = recommendTool({ zoneKey: "yellow", providers: ["aws"] });
  assert.ok(Array.isArray(recs.recommendations), "recommendation output should be array");
  assert.ok(
    recs.recommendations.every((rec) => typeof rec.category === "string"),
    "recommendations should include category field"
  );

  const categoryFiltered = recommendTool({
    zoneKey: "yellow",
    category: "pricing",
    providers: ["aws"],
    inputs: {
      nRef: 120,
      devPerClient: 500,
      infraTotal: 2400,
      startupTargetPrice: 35
    }
  });
  assert.ok(
    categoryFiltered.recommendations.every((rec) => rec.category === "pricing"),
    "category filter should scope recommendation output"
  );
  assert.ok(
    categoryFiltered.recommendations.length > 0,
    "pricing category should return at least one recommendation"
  );

  const encoded = encodeStateTool({
    inputs: {
      devPerClient: 500,
      infraTotal: 2400,
      startupTargetPrice: 35,
      techDomains: ["cloud", "saas"]
    },
    uiIntent: "operations",
    uiMode: "operator",
    providers: ["aws"],
    hiddenCurves: ["profit"]
  });
  assert.ok(typeof encoded.stateToken === "string" && encoded.stateToken.length > 0, "state token should be non-empty string");

  const decoded = decodeStateTool({ stateToken: encoded.stateToken });
  assert.equal(decoded.state.p[0], "aws", "decoded provider should match encoded state");
  assert.deepEqual(decoded.state.td, ["cloud", "saas"], "decoded domain scope should match encoded state");
  assert.equal(decoded.state.ui, "operations", "decoded ui intent should match encoded context");
  assert.equal(decoded.state.um, "operator", "decoded ui mode should match encoded context");

  const calcWithStateContext = calculateTool({
    inputs: {
      devPerClient: 500,
      infraTotal: 2400,
      ARPU: 30
    },
    uiIntent: "executive",
    uiMode: "operator",
    providers: ["aws"],
    options: {
      includeHealth: true,
      includeRecommendations: true,
      includeSeries: false,
      includeStateToken: true
    }
  });
  assert.ok(typeof calcWithStateContext.stateToken === "string", "calculate should return a state token when enabled");
  const decodedFromCalculate = decodeStateTool({ stateToken: calcWithStateContext.stateToken });
  assert.equal(decodedFromCalculate.state.ui, "executive", "calculate state token should preserve ui intent");
  assert.equal(decodedFromCalculate.state.um, "operator", "calculate state token should preserve ui mode");
}

function encodeRpcMessage(message) {
  const json = JSON.stringify(message);
  const payload = Buffer.from(json, "utf8");
  const header = Buffer.from(`Content-Length: ${payload.length}\r\n\r\n`, "utf8");
  return Buffer.concat([header, payload]);
}

function createRpcClient(child) {
  let buffer = Buffer.alloc(0);
  const pending = new Map();

  child.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;

      const headerRaw = buffer.subarray(0, headerEnd).toString("utf8");
      const lengthHeader = headerRaw
        .split("\r\n")
        .find((line) => line.toLowerCase().startsWith("content-length:"));

      if (!lengthHeader) {
        buffer = buffer.subarray(headerEnd + 4);
        continue;
      }

      const len = Number(lengthHeader.split(":")[1]?.trim());
      if (!Number.isFinite(len) || len < 0) {
        buffer = buffer.subarray(headerEnd + 4);
        continue;
      }

      const total = headerEnd + 4 + len;
      if (buffer.length < total) break;

      const body = buffer.subarray(headerEnd + 4, total).toString("utf8");
      buffer = buffer.subarray(total);

      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(parsed, "id") && pending.has(parsed.id)) {
        const { resolve, reject, timer } = pending.get(parsed.id);
        clearTimeout(timer);
        pending.delete(parsed.id);
        if (parsed.error) reject(new Error(parsed.error.message || "RPC error"));
        else resolve(parsed);
      }
    }
  });

  function request(id, method, params = {}) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timeout waiting for RPC response: ${method}`));
      }, 5000);

      pending.set(id, { resolve, reject, timer });
      child.stdin.write(encodeRpcMessage({ jsonrpc: "2.0", id, method, params }));
    });
  }

  function notify(method, params = {}) {
    child.stdin.write(encodeRpcMessage({ jsonrpc: "2.0", method, params }));
  }

  return { request, notify };
}

async function runProtocolTests() {
  const serverPath = path.resolve(__dirname, "../server/index.js");
  const child = spawn(process.execPath, [serverPath], { stdio: ["pipe", "pipe", "pipe"] });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString("utf8");
  });

  const client = createRpcClient(child);

  try {
    const init = await client.request(1, "initialize", {
      protocolVersion: "2024-11-05",
      clientInfo: { name: "finops-test", version: "0.1.0" },
      capabilities: {}
    });

    assert.equal(init.result.serverInfo.name, "finops-calculator-mcp", "server name mismatch");
    client.notify("notifications/initialized", {});

    const list = await client.request(2, "tools/list", {});
    const names = list.result.tools.map((tool) => tool.name);
    assert.ok(names.includes("finops.calculate"), "tools/list missing finops.calculate");
    assert.ok(names.includes("finops.health"), "tools/list missing finops.health");

    const calculateArgs = {
      name: "finops.calculate",
      arguments: {
        inputs: {
          devPerClient: 500,
          infraTotal: 2400,
          startupTargetPrice: 35,
          techDomains: ["cloud", "saas"],
          costSaaS: 600
        },
        providers: ["aws"]
      }
    };
    const expectedFromCore = calculateTool(calculateArgs.arguments);
    const call = await client.request(3, "tools/call", calculateArgs);

    const payload = call.result.structuredContent;
    assert.equal(payload.meta.arpuMode, "startup-price", "tools/call returned unexpected arpuMode");
    assert.equal(
      payload.outputs.breakEvenClients,
      expectedFromCore.outputs.breakEvenClients,
      "tools/call returned unexpected break-even"
    );
    assert.deepEqual(
      payload.outputs.normalization.selectedDomains,
      ["cloud", "saas"],
      "tools/call should return scoped selected domains"
    );
    assert.ok(Array.isArray(payload.recommendations), "tools/call recommendations should be array");
    assert.ok(
      payload.recommendations.every((rec) => typeof rec.category === "string"),
      "tools/call recommendations should include category"
    );

    let unknownToolError = null;
    try {
      await client.request(4, "tools/call", {
        name: "finops.unknown",
        arguments: {}
      });
    } catch (err) {
      unknownToolError = err;
    }
    assert.ok(unknownToolError instanceof Error, "unknown tool should return JSON-RPC error");
    assert.match(unknownToolError.message, /Unknown tool:/, "unknown tool error message should be explicit");

    const invalidDecode = await client.request(5, "tools/call", {
      name: "finops.state.decode",
      arguments: {
        stateToken: "not-a-valid-token"
      }
    });
    assert.equal(invalidDecode.result.isError, true, "invalid state decode should return tool error envelope");
  } finally {
    child.kill();
    if (stderr.trim()) {
      process.stderr.write(`\n[MCP server stderr]\n${stderr}\n`);
    }
  }
}

(async function main() {
  await runContractTests();
  await runProtocolTests();
  process.stdout.write("All MCP tests passed.\n");
})().catch((err) => {
  process.stderr.write(`MCP tests failed: ${err.message}\n`);
  process.exit(1);
});
