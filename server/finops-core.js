const MODEL_DEFAULTS = Object.freeze({
  K: 50000,
  a: 0.45,
  c: 0.8,
  b: 1.28,
  g: 0.68,
  ARPU: 30,
  m: 0.15,
  nMax: 1000
});

const DEFAULT_N_REF = 100;
const SHARE_STATE_VERSION = 1;

const PROVIDERS = Object.freeze(["aws", "azure", "gcp", "oci", "ibm", "alibaba", "huawei", "multi"]);
const CURVE_KEYS = Object.freeze(["dev", "infra-raw", "infra-cud", "total", "revenue", "profit", "price-min"]);

const RECOMMENDATIONS = Object.freeze([
  { title: "You are below break-even", desc: "Current client volume is below the minimum viable threshold; fixed and variable costs are not yet recovered.", action: "Review pricing page and sales funnel conversion. Prioritize moving n above N_min within the next planning cycle.", providers: [], zones: ["red"], priority: "high" },
  { title: "CCER below 3x", desc: "Cloud Cost Efficiency Ratio is below FinOps benchmark. Revenue generated per euro of cloud spend is under target.", action: "Isolate top cost drivers and enforce unit economics guardrails per service.", providers: [], zones: ["red", "yellow"], priority: "high" },
  { title: "Contribution margin is negative", desc: "VCPU is equal to or higher than ARPU. Every incremental client currently destroys value.", action: "Increase package price floor or reduce per-client infra usage before scaling customer acquisition.", providers: [], zones: ["red"], priority: "high" },
  { title: "CUDs/Savings Plans not fully applied", desc: "Discount gap is still material versus committed pricing options. Commitment strategy is likely under-utilized.", action: "Review 12-month steady-state usage and map eligible workloads to commitment instruments.", providers: [], zones: ["green", "yellow", "red"], priority: "medium" },
  { title: "Implement FinOps cost allocation tagging", desc: "Without consistent tags, accountability and optimization loops remain weak across teams.", action: "Enforce mandatory tags for owner, environment, product, and cost-center in IaC and policy checks.", providers: [], zones: ["green"], priority: "low" },
  { title: "Set up 12-month cost forecasting", desc: "Proactive forecasting improves commitment timing, budget confidence, and board-level planning.", action: "Build monthly forecast scenarios (base/growth/stress) and review variance at each month close.", providers: [], zones: ["green"], priority: "low" },
  { title: "AWS Savings Plans coverage", desc: "Compute Savings Plans can reduce eligible compute spend significantly when baseline usage is stable.", action: "AWS Console -> Billing and Cost Management -> Savings Plans -> Recommendations.", providers: ["aws"], zones: ["green", "yellow", "red"], priority: "medium" },
  { title: "AWS right-sizing opportunities", desc: "Idle and oversized resources create avoidable waste in EC2, EBS, and managed services.", action: "AWS Cost Explorer -> Rightsizing Recommendations; prioritize top monthly impact accounts.", providers: ["aws"], zones: ["yellow", "red"], priority: "medium" },
  { title: "Use Spot for fault-tolerant workloads", desc: "Spot capacity can materially reduce non-critical compute costs for resilient jobs.", action: "EC2 Auto Scaling Groups -> Mixed Instances Policy with Spot allocation strategies.", providers: ["aws"], zones: ["yellow", "red"], priority: "medium" },
  { title: "Enable Cost Anomaly Detection", desc: "Unexpected spikes should be detected rapidly to reduce financial blast radius.", action: "AWS Console -> Cost Management -> Cost Anomaly Detection -> Create monitor and alerts.", providers: ["aws"], zones: ["green", "yellow", "red"], priority: "high" },
  { title: "S3 Intelligent-Tiering for cold data", desc: "Automatically shifting infrequently accessed objects reduces storage spend with minimal effort.", action: "S3 Bucket -> Management -> Lifecycle rules and Intelligent-Tiering transition policy.", providers: ["aws"], zones: ["green"], priority: "low" },
  { title: "Azure Reservations + Hybrid Benefit", desc: "Reserved capacity and license benefits can materially reduce long-running VM/database costs.", action: "Azure Portal -> Cost Management + Billing -> Reservations -> Purchase recommendations.", providers: ["azure"], zones: ["yellow", "red"], priority: "medium" },
  { title: "Azure Advisor cost recommendations", desc: "Advisor identifies right-size, idle shutdown, and architecture-level cost opportunities.", action: "Azure Portal -> Advisor -> Cost tab; export recommendations into remediation backlog.", providers: ["azure"], zones: ["yellow", "red"], priority: "medium" },
  { title: "Azure budget alerts and controls", desc: "Budget and anomaly alerting strengthens accountability before overruns become systemic.", action: "Azure Portal -> Cost Management -> Budgets -> Create budget with action groups.", providers: ["azure"], zones: ["green", "yellow", "red"], priority: "high" },
  { title: "Azure Spot VMs for non-critical jobs", desc: "Spot VMs reduce compute spend for interruption-tolerant processing.", action: "Azure Portal -> Virtual Machines -> Spot instance deployment for candidate workloads.", providers: ["azure"], zones: ["yellow", "red"], priority: "medium" },
  { title: "GCP Resource-based CUDs", desc: "Resource-based commitments can reduce sustained baseline compute spend on eligible workloads.", action: "Google Cloud Console -> Billing -> Committed Use Discounts -> Purchase commitments.", providers: ["gcp"], zones: ["green", "yellow", "red"], priority: "medium" },
  { title: "Verify Sustained Use Discounts", desc: "Check whether workloads are reaching expected utilization to realize automatic discount benefits.", action: "GCP Billing export -> BigQuery; validate sustained usage discount effectiveness by SKU.", providers: ["gcp"], zones: ["green", "yellow"], priority: "low" },
  { title: "Use GCP Recommender for idle resources", desc: "Idle resources continue to consume spend without revenue contribution.", action: "GCP Console -> Recommender -> Cost recommendations and cleanup actions.", providers: ["gcp"], zones: ["yellow", "red"], priority: "high" },
  { title: "Set Billing Budget alerts with Pub/Sub", desc: "Automated budget threshold events help trigger operational response workflows quickly.", action: "GCP Console -> Billing -> Budgets & alerts -> Enable Pub/Sub notifications.", providers: ["gcp"], zones: ["green", "yellow", "red"], priority: "high" },
  { title: "BigQuery query cost controls", desc: "Query cost can drift quickly without governance on scan bytes and query patterns.", action: "BigQuery -> Reservations/Quotas + max bytes billed + scheduled query audits.", providers: ["gcp"], zones: ["yellow", "red"], priority: "medium" },
  { title: "OCI Universal Credits planning", desc: "Universal Credits can improve commitment flexibility when workloads shift across OCI services.", action: "OCI Console -> Billing and Cost Management -> Usage and Credit Allocation review.", providers: ["oci"], zones: ["green", "yellow", "red"], priority: "medium" },
  { title: "OCI Always Free for dev/test", desc: "Move suitable non-production workloads to Always Free resources where practical.", action: "OCI Console -> Compute/Storage provisioning templates mapped to Always Free limits.", providers: ["oci"], zones: ["green"], priority: "low" },
  { title: "IBM Reserved Virtual Servers", desc: "Long-running workloads should be shifted to reservation models for lower unit costs.", action: "IBM Cloud Console -> Billing and Usage -> Reservation planning for persistent workloads.", providers: ["ibm"], zones: ["yellow", "red"], priority: "medium" },
  { title: "IBM sustainability + cost co-optimization", desc: "Joint carbon and cost intelligence can identify high-impact remediation opportunities.", action: "IBM Environmental Intelligence Suite + cost reports for optimization prioritization.", providers: ["ibm"], zones: ["green"], priority: "low" },
  { title: "Alibaba subscription billing shift", desc: "Subscription billing can materially reduce compute costs versus pay-as-you-go baselines.", action: "Alibaba Console -> Billing -> Resource Plans / Subscription migration candidates.", providers: ["alibaba"], zones: ["yellow", "red"], priority: "medium" },
  { title: "Huawei ECS Reservations", desc: "Reservation strategies reduce long-run compute cost where workloads are predictable.", action: "Huawei Cloud Console -> Billing Center -> Reserved Instances for ECS fleet.", providers: ["huawei"], zones: ["yellow", "red"], priority: "medium" },
  { title: "Adopt unified multi-cloud FinOps platform", desc: "Cross-cloud visibility and unit economics governance require a single cost operating model.", action: "Integrate billing exports into a common platform (CloudHealth/OpenCost/warehouse model).", providers: ["multi"], zones: ["green", "yellow", "red"], priority: "high" },
  { title: "Control inter-region / inter-cloud egress", desc: "Network egress charges often become hidden margin erosion drivers in multi-cloud topologies.", action: "Build monthly egress map by service path; redesign data flows to reduce charge-heavy hops.", providers: ["multi"], zones: ["green", "yellow", "red"], priority: "medium" }
]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeNumber(value, config = {}) {
  const n = toNumber(value);
  if (!isFiniteNumber(n)) return null;

  const normalized = config.integer ? Math.round(n) : n;
  if (isFiniteNumber(config.min) && normalized < config.min) return null;
  if (isFiniteNumber(config.max) && normalized > config.max) return null;
  return normalized;
}

export function normalizeInputs(inputs = {}) {
  return {
    nRef: normalizeNumber(inputs.nRef, { min: 1, max: 100000, integer: true }),
    devPerClient: normalizeNumber(inputs.devPerClient, { min: 0 }),
    infraTotal: normalizeNumber(inputs.infraTotal, { min: 0 }),
    ARPU: normalizeNumber(inputs.ARPU, { min: 0 }),
    startupTargetPrice: normalizeNumber(inputs.startupTargetPrice, { min: 0 }),
    startupTargetClients: normalizeNumber(inputs.startupTargetClients, { min: 1, integer: true }),
    cudPct: normalizeNumber(inputs.cudPct, { min: 0, max: 95 }),
    margin: normalizeNumber(inputs.margin, { min: 0, max: 200 }),
    nMax: normalizeNumber(inputs.nMax, { min: 10, max: 100000, integer: true })
  };
}

export function normalizeProviders(providers) {
  if (!Array.isArray(providers)) return [];
  const seen = new Set();
  const out = [];
  providers.forEach((provider) => {
    if (typeof provider !== "string") return;
    if (!PROVIDERS.includes(provider)) return;
    if (seen.has(provider)) return;
    seen.add(provider);
    out.push(provider);
  });
  return out;
}

export function normalizeHiddenCurves(hiddenCurves) {
  if (!Array.isArray(hiddenCurves)) return [];
  const seen = new Set();
  const out = [];
  hiddenCurves.forEach((curve) => {
    if (typeof curve !== "string") return;
    if (!CURVE_KEYS.includes(curve)) return;
    if (seen.has(curve)) return;
    seen.add(curve);
    out.push(curve);
  });
  return out;
}

function normalizeOptions(options = {}) {
  const defaults = {
    includeHealth: true,
    includeRecommendations: true,
    includeSeries: false,
    includeStateToken: true
  };

  return {
    includeHealth: typeof options.includeHealth === "boolean" ? options.includeHealth : defaults.includeHealth,
    includeRecommendations: typeof options.includeRecommendations === "boolean" ? options.includeRecommendations : defaults.includeRecommendations,
    includeSeries: typeof options.includeSeries === "boolean" ? options.includeSeries : defaults.includeSeries,
    includeStateToken: typeof options.includeStateToken === "boolean" ? options.includeStateToken : defaults.includeStateToken
  };
}

export function buildData(model, points = 300) {
  const { K, a, c, b, ARPU, m, nMax } = model;
  const totalPoints = Math.max(10, Math.round(points));

  const rows = [];
  for (let i = 0; i <= totalPoints; i += 1) {
    const n = Math.max(1, (i / totalPoints) * nMax);
    const dev = K * Math.pow(n, -a);
    const infraRaw = c * Math.pow(n, b);
    const infraCud = model.g * c * Math.pow(n, b * 0.96);
    const total = dev + infraRaw;
    const revenue = ARPU;
    const profit = revenue - total;
    const priceMin = total * (1 + m);
    rows.push({ n, dev, infraRaw, infraCud, total, revenue, profit, priceMin });
  }
  return rows;
}

export function minPriceAtClients(n, model) {
  const safeN = Math.max(1, n);
  const total = model.K * Math.pow(safeN, -model.a) + model.c * Math.pow(safeN, model.b);
  return (total / safeN) * (1 + model.m);
}

export function findRequiredClientsForTargetPrice(targetPrice, maxN, model) {
  if (!(targetPrice > 0)) return null;
  const limit = Math.max(1, Math.round(maxN));

  for (let n = 1; n <= limit; n += 1) {
    if (minPriceAtClients(n, model) <= targetPrice) return n;
  }
  return null;
}

export function deriveModel(inputs) {
  const model = { ...MODEL_DEFAULTS };
  let effectiveARPU = null;
  let arpuMode = "missing";
  const derivations = [];

  const {
    nRef,
    devPerClient,
    infraTotal,
    ARPU,
    startupTargetPrice,
    startupTargetClients,
    cudPct,
    margin,
    nMax
  } = inputs;

  if (isFiniteNumber(nMax) && nMax >= 10) model.nMax = nMax;
  if (isFiniteNumber(margin)) model.m = Math.max(0, margin / 100);
  if (isFiniteNumber(cudPct)) {
    model.g = Math.max(0.01, 1 - cudPct / 100);
    derivations.push(`g=${model.g.toFixed(2)}`);
  }

  if (isFiniteNumber(devPerClient) && devPerClient > 0) {
    const n = isFiniteNumber(nRef) && nRef > 0 ? nRef : DEFAULT_N_REF;
    model.K = devPerClient * Math.pow(n, model.a);
    derivations.push(`K=${model.K.toFixed(0)}`);
  }

  if (isFiniteNumber(infraTotal) && infraTotal > 0) {
    const n = isFiniteNumber(nRef) && nRef > 0 ? nRef : DEFAULT_N_REF;
    model.c = infraTotal / Math.pow(n, model.b);
    derivations.push(`c=${model.c.toFixed(4)}@n=${n}`);
  }

  if (isFiniteNumber(ARPU) && ARPU > 0) {
    model.ARPU = ARPU;
    effectiveARPU = ARPU;
    arpuMode = "manual";
  } else if (isFiniteNumber(startupTargetPrice) && startupTargetPrice > 0) {
    model.ARPU = startupTargetPrice;
    effectiveARPU = startupTargetPrice;
    arpuMode = "startup-price";
    derivations.push(`ARPU~${model.ARPU.toFixed(2)}(startup-price)`);
  } else if (
    isFiniteNumber(startupTargetClients) && startupTargetClients > 0 &&
    ((isFiniteNumber(devPerClient) && devPerClient > 0) || (isFiniteNumber(infraTotal) && infraTotal > 0))
  ) {
    model.ARPU = minPriceAtClients(startupTargetClients, model);
    effectiveARPU = model.ARPU;
    arpuMode = "startup-clients";
    derivations.push(`ARPU~${model.ARPU.toFixed(2)}@clients=${Math.round(startupTargetClients)}`);
  }

  return { model, effectiveARPU, arpuMode, derivations };
}

export function computeOutputs(inputs, model, effectiveARPU, arpuMode) {
  const {
    nRef,
    devPerClient,
    infraTotal,
    ARPU: arpuInput,
    startupTargetPrice,
    startupTargetClients
  } = inputs;

  const nSample = isFiniteNumber(nRef) && nRef > 0 ? nRef : DEFAULT_N_REF;
  const arpuUsed = (isFiniteNumber(effectiveARPU) && effectiveARPU > 0)
    ? effectiveARPU
    : (isFiniteNumber(arpuInput) && arpuInput > 0 ? arpuInput : null);

  const hasARPU = isFiniteNumber(arpuUsed);
  const hasInfra = isFiniteNumber(infraTotal);
  const hasDev = isFiniteNumber(devPerClient);
  const hasStartupPrice = isFiniteNumber(startupTargetPrice) && startupTargetPrice > 0;
  const hasStartupClients = isFiniteNumber(startupTargetClients) && startupTargetClients > 0;
  const hasAnyCostInput = hasInfra || hasDev;

  const dev = model.K * Math.pow(nSample, -model.a);
  const infraRaw = model.c * Math.pow(nSample, model.b);
  const infraCud = model.g * model.c * Math.pow(nSample, model.b * 0.96);
  const total = dev + infraRaw;
  const revenue = hasARPU ? arpuUsed * nSample : 0;
  const vcpu = infraRaw / nSample;
  const contributionMargin = hasARPU ? arpuUsed - vcpu : null;
  const minPricePerClient = (total / nSample) * (1 + model.m);
  const ccer = hasInfra && hasARPU && infraRaw > 0 ? revenue / infraRaw : null;
  const cudMonthlySaving = hasInfra ? infraRaw - infraCud : null;

  const searchMax = Math.max(20000, model.nMax);
  const requiredClientsAtTargetPrice = (hasStartupPrice && hasAnyCostInput)
    ? findRequiredClientsForTargetPrice(startupTargetPrice, searchMax, model)
    : null;

  const requiredPriceAtTargetClients = (hasStartupClients && hasAnyCostInput)
    ? minPriceAtClients(startupTargetClients, model)
    : null;

  const reqClientsFromClientsMode = (arpuMode === "startup-clients" && isFiniteNumber(requiredPriceAtTargetClients))
    ? findRequiredClientsForTargetPrice(requiredPriceAtTargetClients, searchMax, model)
    : null;

  const series = buildData(model);
  const bePoint = series.find((d) => d.revenue >= d.total) || null;
  const beN = bePoint ? Math.round(bePoint.n) : null;

  let breakEvenClients = null;
  const beNeedsArpu = !hasARPU;
  const beNeedsCost = !hasAnyCostInput;

  if (!beNeedsArpu && !beNeedsCost) {
    if (arpuMode === "startup-price" && isFiniteNumber(requiredClientsAtTargetPrice)) {
      breakEvenClients = requiredClientsAtTargetPrice;
    } else if (arpuMode === "startup-clients" && isFiniteNumber(reqClientsFromClientsMode)) {
      breakEvenClients = reqClientsFromClientsMode;
    } else if (isFiniteNumber(beN) && beN <= model.nMax) {
      breakEvenClients = beN;
    }
  }

  let targetMonthlyRevenue = null;
  if (hasStartupClients && isFiniteNumber(requiredPriceAtTargetClients)) {
    const priceForRevenue = hasStartupPrice ? startupTargetPrice : requiredPriceAtTargetClients;
    targetMonthlyRevenue = priceForRevenue * startupTargetClients;
  } else if (hasStartupPrice && isFiniteNumber(requiredClientsAtTargetPrice)) {
    targetMonthlyRevenue = startupTargetPrice * requiredClientsAtTargetPrice;
  }

  return {
    breakEvenClients,
    minPricePerClient: hasAnyCostInput ? minPricePerClient : null,
    vcpu: hasInfra ? vcpu : null,
    contributionMargin: hasInfra && hasARPU ? contributionMargin : null,
    ccer,
    cudMonthlySaving,
    requiredClientsAtTargetPrice,
    requiredPriceAtTargetClients,
    targetMonthlyRevenue
  };
}

export function computeHealth(inputs, model, effectiveARPU, arpuMode) {
  const { nRef, infraTotal, ARPU: arpuInput } = inputs;
  const nSample = isFiniteNumber(nRef) && nRef > 0 ? nRef : DEFAULT_N_REF;

  const hasInfra = isFiniteNumber(infraTotal);
  const arpuUsed = (isFiniteNumber(effectiveARPU) && effectiveARPU > 0)
    ? effectiveARPU
    : (isFiniteNumber(arpuInput) && arpuInput > 0 ? arpuInput : null);
  const hasARPU = isFiniteNumber(arpuUsed);

  if (!hasInfra || !hasARPU) {
    return {
      zoneKey: "awaiting",
      zoneTitle: "Awaiting Inputs",
      score: null,
      failedChecks: []
    };
  }

  const dev = model.K * Math.pow(nSample, -model.a);
  const infraRaw = model.c * Math.pow(nSample, model.b);
  const infraCud = model.g * model.c * Math.pow(nSample, model.b * 0.96);
  const total = dev + infraRaw;
  const revenue = arpuUsed * nSample;
  const vcpu = infraRaw / nSample;
  const contributionMargin = arpuUsed - vcpu;
  const ccer = infraRaw > 0 ? revenue / infraRaw : 0;
  const cudSaveGapPct = infraRaw > 0 ? ((infraRaw - infraCud) / infraRaw) : 0;

  const series = buildData(model);
  const be = series.find((d) => d.revenue >= d.total);
  const beN = be ? Math.round(be.n) : null;

  let score = 100;
  const failed = [];

  if (beN === null) {
    score -= 35;
    failed.push("No break-even point exists within the current model range.");
  } else if (nSample < beN) {
    score -= 35;
    failed.push(`Current clients (${Math.round(nSample)}) are below break-even (${beN}).`);
  }

  if (ccer < 1) {
    score -= 30;
    failed.push(`CCER is ${ccer.toFixed(2)}x (<1x).`);
  } else if (ccer < 3) {
    score -= 15;
    failed.push(`CCER is ${ccer.toFixed(2)}x (below 3x benchmark).`);
  }

  if (contributionMargin <= 0) {
    score -= 20;
    failed.push(`Contribution margin is negative (${contributionMargin.toFixed(2)} per client).`);
  }

  if (cudSaveGapPct > 0.15) {
    score -= 5;
    failed.push(`Commitment saving gap is ${(cudSaveGapPct * 100).toFixed(1)}% of infra spend.`);
  }

  score = Math.max(0, Math.min(100, score));

  let zoneKey = "green";
  let zoneTitle = "Green Zone - Healthy Economics";

  if (score < 40) {
    zoneKey = "red";
    zoneTitle = "Red Zone - Critical Action Needed";
  } else if (score < 70) {
    zoneKey = "yellow";
    zoneTitle = "Yellow Zone - Needs Improvement";
  }

  if (arpuMode === "startup-price" && !failed.includes("Planning mode: startup-price")) {
    failed.push("Planning mode: ARPU estimated from target price assumption.");
  } else if (arpuMode === "startup-clients" && !failed.includes("Planning mode: startup-clients")) {
    failed.push("Planning mode: ARPU estimated from target clients assumption.");
  }

  return {
    zoneKey,
    zoneTitle,
    score: Math.round(score),
    failedChecks: failed
  };
}

function priorityWeight(priority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

export function recommendTool(args = {}) {
  const zoneKey = typeof args.zoneKey === "string" ? args.zoneKey : "awaiting";
  const providers = normalizeProviders(args.providers);

  if (!["green", "yellow", "red"].includes(zoneKey)) {
    return { recommendations: [] };
  }

  const recommendations = RECOMMENDATIONS
    .filter((rec) => rec.zones.includes(zoneKey))
    .filter((rec) => rec.providers.length === 0 || providers.some((provider) => rec.providers.includes(provider)))
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority))
    .map((rec) => ({
      title: rec.title,
      priority: rec.priority,
      providers: rec.providers,
      desc: rec.desc,
      action: rec.action
    }));

  return { recommendations };
}

export function encodeShareState(payload) {
  try {
    const json = JSON.stringify(payload);
    return Buffer.from(json, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  } catch {
    return null;
  }
}

export function decodeShareState(token) {
  if (typeof token !== "string" || token.length === 0) return null;
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function encodeStateTool(args = {}) {
  const state = args.state && typeof args.state === "object"
    ? args.state
    : {
      v: SHARE_STATE_VERSION,
      i: args.inputs && typeof args.inputs === "object" ? args.inputs : {},
      p: normalizeProviders(args.providers),
      h: normalizeHiddenCurves(args.hiddenCurves)
    };

  const stateToken = encodeShareState(state);
  if (!stateToken) throw new Error("Failed to encode state payload.");
  return { stateToken };
}

export function decodeStateTool(args = {}) {
  const stateToken = typeof args.stateToken === "string" ? args.stateToken : "";
  const state = decodeShareState(stateToken);
  if (!state) throw new Error("Invalid or corrupted state token.");
  return { state };
}

export function healthTool(args = {}) {
  const inputs = normalizeInputs(args.inputs || {});
  const derived = deriveModel(inputs);
  return computeHealth(inputs, derived.model, derived.effectiveARPU, derived.arpuMode);
}

export function calculateTool(args = {}) {
  const inputs = normalizeInputs(args.inputs || {});
  const providers = normalizeProviders(args.providers);
  const hiddenCurves = normalizeHiddenCurves(args.hiddenCurves);
  const options = normalizeOptions(args.options || {});

  const derived = deriveModel(inputs);
  const outputs = computeOutputs(inputs, derived.model, derived.effectiveARPU, derived.arpuMode);

  const health = options.includeHealth
    ? computeHealth(inputs, derived.model, derived.effectiveARPU, derived.arpuMode)
    : null;

  const recommendations = options.includeRecommendations
    ? recommendTool({ zoneKey: health ? health.zoneKey : "awaiting", providers }).recommendations
    : [];

  const serializedInputs = {};
  Object.keys(inputs).forEach((key) => {
    if (inputs[key] !== null && inputs[key] !== undefined) {
      serializedInputs[key] = String(inputs[key]);
    }
  });

  const stateToken = options.includeStateToken
    ? encodeShareState({
      v: SHARE_STATE_VERSION,
      i: serializedInputs,
      p: providers,
      h: hiddenCurves
    })
    : null;

  const result = {
    normalizedInputs: inputs,
    model: derived.model,
    meta: {
      effectiveARPU: derived.effectiveARPU,
      arpuMode: derived.arpuMode,
      warnings: []
    },
    outputs,
    health,
    recommendations,
    stateToken
  };

  if (options.includeSeries) {
    result.series = buildData(derived.model);
  }

  return result;
}

export const INPUT_SCHEMA_CALCULATE = {
  type: "object",
  additionalProperties: false,
  properties: {
    inputs: {
      type: "object",
      additionalProperties: false,
      properties: {
        nRef: { type: ["number", "null"], minimum: 1, maximum: 100000 },
        devPerClient: { type: ["number", "null"], minimum: 0 },
        infraTotal: { type: ["number", "null"], minimum: 0 },
        ARPU: { type: ["number", "null"], minimum: 0 },
        startupTargetPrice: { type: ["number", "null"], minimum: 0 },
        startupTargetClients: { type: ["number", "null"], minimum: 1 },
        cudPct: { type: ["number", "null"], minimum: 0, maximum: 95 },
        margin: { type: ["number", "null"], minimum: 0, maximum: 200 },
        nMax: { type: ["number", "null"], minimum: 10, maximum: 100000 }
      }
    },
    providers: {
      type: "array",
      items: { type: "string", enum: PROVIDERS },
      uniqueItems: true
    },
    hiddenCurves: {
      type: "array",
      items: { type: "string", enum: CURVE_KEYS },
      uniqueItems: true
    },
    options: {
      type: "object",
      additionalProperties: false,
      properties: {
        includeHealth: { type: "boolean", default: true },
        includeRecommendations: { type: "boolean", default: true },
        includeSeries: { type: "boolean", default: false },
        includeStateToken: { type: "boolean", default: true }
      }
    }
  },
  required: ["inputs"]
};

export const INPUT_SCHEMA_HEALTH = {
  type: "object",
  additionalProperties: false,
  properties: {
    inputs: INPUT_SCHEMA_CALCULATE.properties.inputs
  },
  required: ["inputs"]
};

export const INPUT_SCHEMA_RECOMMEND = {
  type: "object",
  additionalProperties: false,
  properties: {
    zoneKey: { type: "string", enum: ["green", "yellow", "red", "awaiting"] },
    providers: { type: "array", items: { type: "string", enum: PROVIDERS }, uniqueItems: true }
  },
  required: ["zoneKey"]
};

export const INPUT_SCHEMA_STATE_ENCODE = {
  type: "object",
  additionalProperties: false,
  properties: {
    state: { type: "object" },
    inputs: INPUT_SCHEMA_CALCULATE.properties.inputs,
    providers: { type: "array", items: { type: "string", enum: PROVIDERS }, uniqueItems: true },
    hiddenCurves: { type: "array", items: { type: "string", enum: CURVE_KEYS }, uniqueItems: true }
  }
};

export const INPUT_SCHEMA_STATE_DECODE = {
  type: "object",
  additionalProperties: false,
  properties: {
    stateToken: { type: "string" }
  },
  required: ["stateToken"]
};
