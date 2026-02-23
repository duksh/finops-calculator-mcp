import assert from "node:assert/strict";
import https from "node:https";

const DEFAULT_RAW_URL = "https://raw.githubusercontent.com/duksh/finops-calculator/main/index.html";
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
  "inp-costLabor"
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

export async function runCrossRepoParityGuard(rawUrl = process.env.FINOPS_CALCULATOR_RAW_URL || DEFAULT_RAW_URL) {
  const html = await fetchText(rawUrl);

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

  return {
    rawUrl,
    checkedDomains: domainKeys,
    checkedInputIds: [...REQUIRED_INPUT_IDS]
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCrossRepoParityGuard()
    .then((result) => {
      process.stdout.write(`Calculator parity check passed (${result.rawUrl}).\n`);
    })
    .catch((err) => {
      process.stderr.write(`Calculator parity check failed: ${err.message}\n`);
      process.exit(1);
    });
}
