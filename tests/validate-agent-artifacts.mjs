import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readJson(relativePath) {
  const abs = path.resolve(__dirname, relativePath);
  const raw = await readFile(abs, "utf8");
  return JSON.parse(raw);
}

function assertHasKey(obj, key, context) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `${context} missing required key: ${key}`);
}

function assertNodeNextPointers(nodes) {
  const idSet = new Set(nodes.map((node) => node.id));
  nodes.forEach((node) => {
    if (!Object.prototype.hasOwnProperty.call(node, "next")) return;
    assert.ok(idSet.has(node.next), `workflow node '${node.id}' points to unknown next node '${node.next}'`);
  });
}

async function main() {
  const requestSchema = await readJson("../server/agents/contracts/finops.agent.triage.request.schema.json");
  const responseSchema = await readJson("../server/agents/contracts/finops.agent.triage.response.schema.json");
  const workflow = await readJson("../server/agents/workflows/triage.workflow.v1.json");

  assert.equal(requestSchema.$id, "finops.agent.triage.request.schema.json", "request schema $id mismatch");
  assert.ok((requestSchema.required || []).includes("inputs"), "request schema must require inputs");

  assert.equal(responseSchema.$id, "finops.agent.triage.response.schema.json", "response schema $id mismatch");
  assert.ok((responseSchema.required || []).includes("status"), "response schema must require status");

  assert.equal(workflow.workflowId, "triage.workflow.v1", "workflowId mismatch");
  assert.equal(workflow.entrypoint, "validate_input", "workflow entrypoint mismatch");
  assert.ok(Array.isArray(workflow.nodes) && workflow.nodes.length > 0, "workflow nodes should be non-empty array");
  assertNodeNextPointers(workflow.nodes);

  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));

  const validateInputNode = byId.get("validate_input");
  assert.ok(validateInputNode, "validate_input node missing");
  assertHasKey(validateInputNode.config || {}, "schema", "validate_input.config");
  assert.equal(
    validateInputNode.config.schema,
    "../contracts/finops.agent.triage.request.schema.json",
    "validate_input should reference triage request schema"
  );

  const calculateNode = byId.get("calculate_baseline");
  assert.ok(calculateNode, "calculate_baseline node missing");
  assert.equal(calculateNode.type, "tool_call", "calculate_baseline should be tool_call node");
  assert.equal(calculateNode.config?.tool, "finops.calculate", "calculate_baseline should call finops.calculate");

  const emitNode = byId.get("emit_response");
  assert.ok(emitNode, "emit_response node missing");
  assert.equal(
    emitNode.config?.schema,
    "../contracts/finops.agent.triage.response.schema.json",
    "emit_response should reference triage response schema"
  );

  process.stdout.write("Agent artifact validation passed.\n");
}

main().catch((err) => {
  process.stderr.write(`Agent artifact validation failed: ${err.message}\n`);
  process.exit(1);
});
