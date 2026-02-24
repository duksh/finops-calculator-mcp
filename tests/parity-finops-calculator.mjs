import assert from "node:assert/strict";
import https from "node:https";
import vm from "node:vm";

import { calculateTool } from "../server/finops-core.js";

const DEFAULT_RAW_URL = "https://raw.githubusercontent.com/duksh/finops-calculator/main/index.html";
const DEFAULT_RELIABILITY_ENGINE_RAW_URL = "https://raw.githubusercontent.com/duksh/finops-calculator/main/src/features/sla-slo-sli-economics/engine.js";
const EXPECTED_MODEL_DEFAULTS = Object.freeze({
  K: 50000,
  a: 0.45,
  c: 0.8,
  b: 1.28,
  g: 0.68,
  ARPU: 30,
  m: 0.15,
  nMax: 1000
});
const EXPECTED_SHARE_STATE_VERSION = 1;
const EXPECTED_DOMAINS = Object.freeze(["cloud", "saas", "licensing", "private-cloud", "data-center", "labor"]);
const EXPECTED_UI_MODES = Object.freeze(["quick", "operator", "architect"]);
const EXPECTED_UI_INTENTS = Object.freeze(["viability", "operations", "architecture", "executive"]);
const REQUIRED_INPUT_IDS = Object.freeze([
  "inp-techDomains",
  "inp-costSaaS",
  "inp-costLicensing",
  "inp-costPrivateCloud",
  "inp-costDataCenter",
  "inp-costLabor",
  "inp-reliabilityEnabled",
  "inp-sloTargetAvailabilityPct",
  "inp-sliObservedAvailabilityPct",
  "inp-incidentCountMonthly",
  "inp-mttrHours",
  "inp-incidentBlendedHourlyRate",
  "inp-criticalRevenuePerMinute",
  "inp-arrExposedMonthly",
  "inp-slaPenaltyRatePerBreachPointMonthly",
  "inp-reliabilityInvestmentMonthly"
]);

const RELIABILITY_PARITY_FIXTURES = Object.freeze([
  {
    name: "healthy",
    inputs: {
      nRef: 420,
      devPerClient: 210,
      infraTotal: 3600,
      techDomains: ["cloud", "saas"],
      costSaaS: 620,
      reliabilityEnabled: "on",
      sloTargetAvailabilityPct: 99.9,
      sliObservedAvailabilityPct: 99.82,
      incidentCountMonthly: 2,
      mttrHours: 0.9,
      incidentBlendedHourlyRate: 95,
      criticalRevenuePerMinute: 24,
      arrExposedMonthly: 65000,
      slaPenaltyRatePerBreachPointMonthly: 3000,
      reliabilityInvestmentMonthly: 1800
    }
  },
  {
    name: "moderate-risk",
    inputs: {
      nRef: 200,
      devPerClient: 420,
      infraTotal: 3200,
      reliabilityEnabled: "on",
      sloTargetAvailabilityPct: 99.9,
      sliObservedAvailabilityPct: 99.45,
      incidentCountMonthly: 4,
      mttrHours: 1.8,
      incidentBlendedHourlyRate: 110,
      criticalRevenuePerMinute: 40,
      arrExposedMonthly: 95000,
      slaPenaltyRatePerBreachPointMonthly: 5000,
      reliabilityInvestmentMonthly: 1600
    }
  },
  {
    name: "high-risk",
    inputs: {
      nRef: 55,
      devPerClient: 1200,
      infraTotal: 6400,
      reliabilityEnabled: "on",
      sloTargetAvailabilityPct: 99.9,
      sliObservedAvailabilityPct: 98.9,
      incidentCountMonthly: 11,
      mttrHours: 3.7,
      incidentBlendedHourlyRate: 140,
      criticalRevenuePerMinute: 110,
      arrExposedMonthly: 180000,
      slaPenaltyRatePerBreachPointMonthly: 12000,
      reliabilityInvestmentMonthly: 900
    }
  },
  {
    name: "over-invested",
    inputs: {
      nRef: 300,
      devPerClient: 260,
      infraTotal: 4100,
      reliabilityEnabled: "on",
      sloTargetAvailabilityPct: 99.9,
      sliObservedAvailabilityPct: 99.92,
      incidentCountMonthly: 1,
      mttrHours: 0.4,
      incidentBlendedHourlyRate: 90,
      criticalRevenuePerMinute: 12,
      arrExposedMonthly: 30000,
      slaPenaltyRatePerBreachPointMonthly: 3000,
      reliabilityInvestmentMonthly: 18000
    }
  }
]);

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          fetchText(res.headers.location).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Failed to fetch calculator source (${res.statusCode}) from ${url}`));
          return;
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

function parseModelDefaults(html) {
  const match = html.match(/const MODEL_DEFAULTS = \{([^}]+)\};/);
  assert.ok(match, "Unable to locate MODEL_DEFAULTS in calculator index.html");

  const entries = match[1]
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [key, rawValue] = chunk.split(":").map((part) => part.trim());
      return [key, Number(rawValue)];
    });

  return Object.fromEntries(entries);
}

function parseDomainKeys(html) {
  const matches = Array.from(html.matchAll(/data-domain="([a-z-]+)"/g)).map((m) => m[1]);
  return Array.from(new Set(matches));
}

function parseNumericConstant(html, constantName) {
  const escaped = constantName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`const ${escaped} = (\\d+);`));
  assert.ok(match, `Unable to locate ${constantName} in calculator index.html`);
  return Number(match[1]);
}

function parseStringArrayConstant(html, constantName) {
  const escaped = constantName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`const ${escaped} = \\[(.*?)\\];`));
  assert.ok(match, `Unable to locate ${constantName} in calculator index.html`);

  return match[1]
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^['\"]|['\"]$/g, ""));
}

function loadReliabilityEngine(engineSource) {
  const context = {
    globalThis: {},
    window: undefined
  };
  vm.createContext(context);
  vm.runInContext(engineSource, context, { filename: "reliability-engine.js" });
  const engine = context.globalThis.FiceCalReliabilityEconomics;
  assert.ok(engine && typeof engine.calculate === "function", "Unable to load reliability engine from calculator source");
  return engine;
}

function approxEqual(actual, expected, label, epsilon = 1e-6) {
  assert.equal(typeof actual, "number", `${label}: actual value must be numeric`);
  assert.equal(typeof expected, "number", `${label}: expected value must be numeric`);
  const delta = Math.abs(actual - expected);
  assert.ok(delta <= epsilon, `${label}: expected ${expected}, got ${actual}`);
}

function runReliabilityParityFixtures(reliabilityEngine) {
  RELIABILITY_PARITY_FIXTURES.forEach((fixture) => {
    const mcpResult = calculateTool({
      inputs: fixture.inputs,
      options: {
        includeHealth: false,
        includeRecommendations: false,
        includeSeries: false,
        includeStateToken: false
      }
    });

    const reliability = mcpResult.outputs.reliability;
    assert.ok(reliability && typeof reliability === "object", `Fixture ${fixture.name}: missing reliability output object`);

    const nSample = fixture.inputs.nRef || 100;
    const totalCoreCostAtSample =
      mcpResult.model.K * Math.pow(nSample, -mcpResult.model.a) +
      mcpResult.model.c * Math.pow(nSample, mcpResult.model.b);
    const budgetBasisCost = mcpResult.outputs.normalization.totalMonthly > 0
      ? mcpResult.outputs.normalization.totalMonthly
      : totalCoreCostAtSample;

    const expected = reliabilityEngine.calculate({
      ...fixture.inputs,
      enabled: fixture.inputs.reliabilityEnabled,
      existingModeledCostMonthly: budgetBasisCost
    });

    assert.equal(reliability.enabled, expected.enabled, `Fixture ${fixture.name}: enabled mismatch`);
    assert.equal(reliability.reliabilityRiskBand, expected.reliabilityRiskBand, `Fixture ${fixture.name}: risk band mismatch`);
    assert.equal(reliability.reliabilityDataConfidence, expected.reliabilityDataConfidence, `Fixture ${fixture.name}: confidence mismatch`);

    [
      "expectedDowntimeMinutes",
      "expectedSlaPenaltyMonthly",
      "expectedIncidentLaborMonthly",
      "expectedRevenueAtRiskMonthly",
      "expectedChurnRiskMonthly",
      "expectedReliabilityFailureCostMonthly",
      "reliabilityInvestmentMonthly",
      "reliabilityAdjustedCostMonthly"
    ].forEach((key) => {
      if (expected[key] === null) {
        assert.equal(reliability[key], null, `Fixture ${fixture.name}: ${key} should be null`);
      } else {
        approxEqual(reliability[key], expected[key], `Fixture ${fixture.name}: ${key}`);
      }
    });
  });
}

export async function runCrossRepoParityGuard(
  rawUrl = process.env.FINOPS_CALCULATOR_RAW_URL || DEFAULT_RAW_URL,
  reliabilityEngineRawUrl = process.env.FINOPS_CALCULATOR_RELIABILITY_RAW_URL || DEFAULT_RELIABILITY_ENGINE_RAW_URL
) {
  const [html, reliabilityEngineSource] = await Promise.all([
    fetchText(rawUrl),
    fetchText(reliabilityEngineRawUrl)
  ]);

  const modelDefaults = parseModelDefaults(html);
  Object.entries(EXPECTED_MODEL_DEFAULTS).forEach(([key, expected]) => {
    assert.equal(modelDefaults[key], expected, `MODEL_DEFAULTS.${key} drift detected (expected ${expected}, got ${modelDefaults[key]})`);
  });

  REQUIRED_INPUT_IDS.forEach((id) => {
    assert.ok(html.includes(`id="${id}"`), `Calculator input field missing for parity guard: ${id}`);
  });

  const domainKeys = parseDomainKeys(html);
  assert.deepEqual(domainKeys, [...EXPECTED_DOMAINS], "Technology domains drift detected between calculator UI and MCP");

  const shareStateVersion = parseNumericConstant(html, "SHARE_STATE_VERSION");
  assert.equal(shareStateVersion, EXPECTED_SHARE_STATE_VERSION, "Share-state version drift detected");

  const uiModes = parseStringArrayConstant(html, "UI_MODE_OPTIONS");
  assert.deepEqual(uiModes, [...EXPECTED_UI_MODES], "UI mode options drift detected between calculator UI and MCP");

  const uiIntents = parseStringArrayConstant(html, "UI_INTENT_OPTIONS");
  assert.deepEqual(uiIntents, [...EXPECTED_UI_INTENTS], "UI intent options drift detected between calculator UI and MCP");

  assert.ok(
    html.includes("Multi-Domain Normalized Tech Cost"),
    "Expected multi-domain normalization formula card not found in calculator"
  );
  assert.ok(
    html.includes("Financial Truth mode (recommended)"),
    "Expected weighting policy guidance missing from calculator"
  );

  const reliabilityEngine = loadReliabilityEngine(reliabilityEngineSource);
  runReliabilityParityFixtures(reliabilityEngine);

  return {
    rawUrl,
    reliabilityEngineRawUrl,
    checkedDomains: domainKeys,
    checkedInputIds: [...REQUIRED_INPUT_IDS]
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCrossRepoParityGuard()
    .then((result) => {
      process.stdout.write(`Calculator parity check passed (${result.rawUrl}, ${result.reliabilityEngineRawUrl}).\n`);
    })
    .catch((err) => {
      process.stderr.write(`Calculator parity check failed: ${err.message}\n`);
      process.exit(1);
    });
}
