import { createServer } from "node:http";
import { calculateTool } from "../finops-core.js";

const PORT = Number(process.env.PORT || 10000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://duksh.github.io";

function json(res, statusCode, payload, origin = "") {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function toTopActions(recommendations = []) {
  return recommendations.slice(0, 3).map((item, idx) => ({
    rank: idx + 1,
    title: item.title,
    priority: item.priority,
    category: item.category,
    action: item.action,
    rationale: item.desc
  }));
}

function buildTriageResponse(requestId, calcResult, goal) {
  const health = calcResult.health || {};
  const zoneKey = health.zoneKey || "awaiting";
  const zoneTitle = health.zoneTitle || "Awaiting baseline data";
  const actions = toTopActions(calcResult.recommendations || []);

  return {
    requestId,
    status: "success",
    generatedAt: new Date().toISOString(),
    summary: {
      goal,
      currentZoneKey: zoneKey,
      currentZoneTitle: zoneTitle,
      currentScore: health.score ?? null,
      headline: actions.length
        ? `Prioritize ${actions[0].title.toLowerCase()} to improve from ${zoneTitle}.`
        : `Collect more baseline data before action planning.`
    },
    actionPlan: actions,
    assumptions: calcResult.meta?.warnings || [],
    trace: {
      workflowId: "triage.workflow.v1",
      sourceTools: ["finops.calculate"],
      stateTokenIncluded: Boolean(calcResult.stateToken)
    },
    raw: {
      health: calcResult.health || null,
      recommendations: calcResult.recommendations || [],
      stateToken: calcResult.stateToken || null
    }
  };
}

const server = createServer(async (req, res) => {
  const origin = String(req.headers.origin || "");

  if (req.method === "OPTIONS") {
    json(res, 204, {}, origin);
    return;
  }

  if (req.method === "GET" && req.url === "/healthz") {
    json(res, 200, {
      status: "ok",
      service: "ficecal-agent-hub",
      workflow: process.env.AGENT_WORKFLOW_PATH || "./workflows/triage.workflow.v1.json"
    }, origin);
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    json(res, 200, {
      status: "ok",
      service: "ficecal-agent-hub",
      docs: {
        health: "GET /healthz",
        triage: "POST /v1/agent/triage"
      },
      usage: "Call from FiceCal via ?agentApi=<baseUrl> or default frontend fallback endpoint."
    }, origin);
    return;
  }

  if (req.method === "POST" && req.url === "/v1/agent/triage") {
    try {
      const body = await readJsonBody(req);
      const requestId = String(body.requestId || `triage-${Date.now()}`);
      const goal = String(body?.context?.goal || "improve-health-zone");

      if (!body.inputs || typeof body.inputs !== "object") {
        json(res, 400, {
          requestId,
          status: "needs-input",
          error: "Missing required object: inputs"
        }, origin);
        return;
      }

      const calcResult = calculateTool({
        inputs: body.inputs,
        providers: Array.isArray(body.providers) ? body.providers : [],
        options: {
          includeHealth: true,
          includeRecommendations: true,
          includeSeries: false,
          includeStateToken: true
        }
      });

      json(res, 200, buildTriageResponse(requestId, calcResult, goal), origin);
      return;
    } catch (err) {
      json(res, 500, {
        status: "error",
        error: err instanceof Error ? err.message : "Unexpected triage error"
      }, origin);
      return;
    }
  }

  json(res, 404, {
    status: "error",
    error: "Route not found"
  }, origin);
});

server.listen(PORT, () => {
  process.stdout.write(`[agent-hub] listening on :${PORT}\n`);
});
