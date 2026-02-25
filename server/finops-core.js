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

const DEFAULT_MINUTES_IN_MONTH = 30 * 24 * 60;
const DEFAULT_N_REF = 100;
const SHARE_STATE_VERSION = 1;
const DEFAULT_CURRENCY_CODE = "EUR";
const CURRENCY_CODES = Object.freeze(["EUR", "GBP", "USD"]);
const ACCEPTED_CURRENCY_CODES = Object.freeze([
  ...CURRENCY_CODES,
  ...CURRENCY_CODES.map((code) => code.toLowerCase())
]);
const UI_MODE_OPTIONS = Object.freeze(["quick", "operator", "architect"]);
const UI_INTENT_OPTIONS = Object.freeze(["viability", "operations", "architecture", "executive"]);
const UI_MODE_DEFAULT = "quick";
const UI_INTENT_DEFAULT = "viability";

const PROVIDERS = Object.freeze(["aws", "azure", "gcp", "oci", "ibm", "alibaba", "huawei", "multi"]);
const CURVE_KEYS = Object.freeze(["dev", "infra-raw", "infra-cud", "total", "total-rel", "revenue", "profit", "profit-rel", "price-min"]);
const TECH_DOMAIN_SCHEMA = Object.freeze([
  { key: "cloud", inputKey: "infraTotal", label: "Cloud" },
  { key: "saas", inputKey: "costSaaS", label: "SaaS" },
  { key: "licensing", inputKey: "costLicensing", label: "Licensing" },
  { key: "private-cloud", inputKey: "costPrivateCloud", label: "Private Cloud" },
  { key: "data-center", inputKey: "costDataCenter", label: "Data Center" },
  { key: "labor", inputKey: "costLabor", label: "Labor" }
]);
const DEFAULT_TECH_DOMAINS = Object.freeze(["cloud"]);
const VALID_TECH_DOMAIN_KEYS = Object.freeze(TECH_DOMAIN_SCHEMA.map((item) => item.key));
const PRIORITY_WEIGHT_BANDS = Object.freeze({
  cloud: [0.25, 0.45],
  saas: [0.15, 0.30],
  licensing: [0.08, 0.20],
  "private-cloud": [0.05, 0.20],
  "data-center": [0.03, 0.15],
  labor: [0.08, 0.20]
});
const BALANCED_PRIORITY_PROFILE = Object.freeze({
  cloud: 0.35,
  saas: 0.20,
  licensing: 0.12,
  "private-cloud": 0.13,
  "data-center": 0.08,
  labor: 0.12
});
const RECOMMENDATION_CATEGORIES = Object.freeze([
  "all",
  "infrastructure",
  "pricing",
  "marketing",
  "crm",
  "governance"
]);

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

function normalizeToggle(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;
  const lowered = value.trim().toLowerCase();
  return lowered === "on" || lowered === "true" || lowered === "1";
}

function normalizeCurrencyCode(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim().toUpperCase();
  return CURRENCY_CODES.includes(normalized) ? normalized : null;
}

function clampPercent(value, fallback = 0) {
  const n = toNumber(value);
  const base = isFiniteNumber(n) ? n : fallback;
  return Math.max(0, Math.min(100, base));
}

function countProvided(values) {
  return values.reduce((count, value) => {
    if (value === null || value === undefined || value === "") return count;
    return isFiniteNumber(toNumber(value)) ? count + 1 : count;
  }, 0);
}

function normalizeTechDomains(value) {
  if (!Array.isArray(value)) return [...DEFAULT_TECH_DOMAINS];
  const deduped = [];
  const seen = new Set();
  value.forEach((entry) => {
    if (typeof entry !== "string") return;
    if (!VALID_TECH_DOMAIN_KEYS.includes(entry)) return;
    if (seen.has(entry)) return;
    seen.add(entry);
    deduped.push(entry);
  });
  return deduped.length ? deduped : [...DEFAULT_TECH_DOMAINS];
}

export function normalizeInputs(inputs = {}) {
  return {
    nRef: normalizeNumber(inputs.nRef, { min: 1, max: 100000, integer: true }),
    currency: normalizeCurrencyCode(inputs.currency),
    devPerClient: normalizeNumber(inputs.devPerClient, { min: 0 }),
    infraTotal: normalizeNumber(inputs.infraTotal, { min: 0 }),
    ARPU: normalizeNumber(inputs.ARPU, { min: 0 }),
    startupTargetPrice: normalizeNumber(inputs.startupTargetPrice, { min: 0 }),
    startupTargetClients: normalizeNumber(inputs.startupTargetClients, { min: 1, integer: true }),
    cudPct: normalizeNumber(inputs.cudPct, { min: 0, max: 95 }),
    margin: normalizeNumber(inputs.margin, { min: 0, max: 200 }),
    nMax: normalizeNumber(inputs.nMax, { min: 10, max: 100000, integer: true }),
    techDomains: normalizeTechDomains(inputs.techDomains),
    costSaaS: normalizeNumber(inputs.costSaaS, { min: 0 }),
    costLicensing: normalizeNumber(inputs.costLicensing, { min: 0 }),
    costPrivateCloud: normalizeNumber(inputs.costPrivateCloud, { min: 0 }),
    costDataCenter: normalizeNumber(inputs.costDataCenter, { min: 0 }),
    costLabor: normalizeNumber(inputs.costLabor, { min: 0 }),
    reliabilityEnabled: normalizeToggle(inputs.reliabilityEnabled),
    sloTargetAvailabilityPct: normalizeNumber(inputs.sloTargetAvailabilityPct, { min: 0, max: 100 }),
    sliObservedAvailabilityPct: normalizeNumber(inputs.sliObservedAvailabilityPct, { min: 0, max: 100 }),
    incidentCountMonthly: normalizeNumber(inputs.incidentCountMonthly, { min: 0, integer: true }),
    mttrHours: normalizeNumber(inputs.mttrHours, { min: 0 }),
    incidentBlendedHourlyRate: normalizeNumber(inputs.incidentBlendedHourlyRate, { min: 0 }),
    criticalRevenuePerMinute: normalizeNumber(inputs.criticalRevenuePerMinute, { min: 0 }),
    arrExposedMonthly: normalizeNumber(inputs.arrExposedMonthly, { min: 0 }),
    slaPenaltyRatePerBreachPointMonthly: normalizeNumber(inputs.slaPenaltyRatePerBreachPointMonthly, { min: 0 }),
    reliabilityInvestmentMonthly: normalizeNumber(inputs.reliabilityInvestmentMonthly, { min: 0 }),
    minutesInMonth: normalizeNumber(inputs.minutesInMonth, { min: 1, integer: true }),
    incidentFteCount: normalizeNumber(inputs.incidentFteCount, { min: 0 }),
    criticalTrafficSharePct: normalizeNumber(inputs.criticalTrafficSharePct, { min: 0, max: 100 }),
    churnSensitivityPct: normalizeNumber(inputs.churnSensitivityPct, { min: 0, max: 100 }),
    breachProbabilityPct: normalizeNumber(inputs.breachProbabilityPct, { min: 0, max: 100 }),
    slaPenaltyMonthly: normalizeNumber(inputs.slaPenaltyMonthly, { min: 0 })
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

function normalizeUiMode(value) {
  return typeof value === "string" && UI_MODE_OPTIONS.includes(value) ? value : UI_MODE_DEFAULT;
}

function normalizeUiIntent(value) {
  return typeof value === "string" && UI_INTENT_OPTIONS.includes(value) ? value : UI_INTENT_DEFAULT;
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

export function buildData(model, points = 300, reliabilityLoadMonthly = null) {
  const { K, a, c, b, ARPU, m, nMax } = model;
  const normalizedReliabilityLoad = Number.isFinite(reliabilityLoadMonthly)
    ? Math.max(0, Number(reliabilityLoadMonthly) || 0)
    : null;
  const hasReliabilityOverlay = Number.isFinite(normalizedReliabilityLoad);
  const totalPoints = Math.max(10, Math.round(points));

  const rows = [];
  for (let i = 0; i <= totalPoints; i += 1) {
    const n = Math.max(1, (i / totalPoints) * nMax);
    const dev = K * Math.pow(n, -a);
    const infraRaw = c * Math.pow(n, b);
    const infraCud = model.g * c * Math.pow(n, b * 0.96);
    const total = dev + infraRaw;
    const revenue = ARPU * n;
    const profit = revenue - total;
    const priceMin = total * (1 + m);
    const totalRel = hasReliabilityOverlay ? total + normalizedReliabilityLoad : null;
    const profitRel = hasReliabilityOverlay ? revenue - totalRel : null;
    rows.push({ n, dev, infraRaw, infraCud, total, totalRel, revenue, profit, profitRel, priceMin });
  }
  return rows;
}

export function totalCostAtClients(n, model) {
  const safeN = Math.max(1, n);
  return model.K * Math.pow(safeN, -model.a) + model.c * Math.pow(safeN, model.b);
}

export function scanEconomicRange(arpu, maxN, model) {
  const limit = Math.max(1, Math.round(maxN));
  const hasArpu = isFiniteNumber(arpu) && arpu > 0;
  let breakEvenN = null;
  let minUnitCost = Infinity;
  let minUnitCostN = 1;

  for (let n = 1; n <= limit; n += 1) {
    const total = totalCostAtClients(n, model);
    const unitCost = total / n;

    if (unitCost < minUnitCost) {
      minUnitCost = unitCost;
      minUnitCostN = n;
    }

    if (hasArpu && breakEvenN === null && (arpu * n) >= total) {
      breakEvenN = n;
    }
  }

  return {
    breakEvenN,
    minUnitCostN,
    minUnitCostPerClient: Number.isFinite(minUnitCost) ? minUnitCost : null
  };
}

export function minPriceAtClients(n, model) {
  const safeN = Math.max(1, n);
  const total = totalCostAtClients(safeN, model);
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

export function findRequiredClientsForTargetPriceWithReliability(targetPrice, maxN, reliabilityLoadMonthly = 0, model) {
  if (!(targetPrice > 0)) return null;
  const limit = Math.max(1, Math.round(maxN));
  const reliabilityLoad = Math.max(0, Number(reliabilityLoadMonthly) || 0);

  for (let n = 1; n <= limit; n += 1) {
    const baseTotal = totalCostAtClients(n, model);
    const adjustedMinPrice = ((baseTotal + reliabilityLoad) / Math.max(1, n)) * (1 + model.m);
    if (adjustedMinPrice <= targetPrice) return n;
  }
  return null;
}

export function buildNormalizationSnapshot(inputs = {}) {
  const nSample = isFiniteNumber(inputs.nRef) && inputs.nRef > 0 ? inputs.nRef : DEFAULT_N_REF;
  const selectedDomains = normalizeTechDomains(inputs.techDomains);
  const selectedSet = new Set(selectedDomains);

  const rows = TECH_DOMAIN_SCHEMA.map((def) => {
    const raw = inputs[def.inputKey];
    const monthly = isFiniteNumber(raw) && raw > 0 ? raw : 0;
    const provided = monthly > 0;
    const inScope = selectedSet.has(def.key);
    return {
      key: def.key,
      label: def.label,
      inputKey: def.inputKey,
      inScope,
      provided,
      monthly,
      normalized: monthly / nSample
    };
  });

  const inScopeRows = rows.filter((row) => row.inScope);
  const selectedCount = inScopeRows.length;
  const providedInScopeCount = inScopeRows.filter((row) => row.provided).length;
  const providedCount = rows.filter((row) => row.provided).length;
  const totalTrackedDomains = rows.length;
  const schemaCoveragePct = (providedCount / totalTrackedDomains) * 100;
  const coveragePct = selectedCount > 0 ? (providedInScopeCount / selectedCount) * 100 : 0;
  const totalMonthly = inScopeRows.reduce((sum, row) => sum + row.monthly, 0);
  const normalizedTotal = selectedCount > 0 ? totalMonthly / nSample : 0;
  const nonCloudInScope = inScopeRows.some((row) => row.key !== "cloud");
  const nonCloudProvidedInScope = inScopeRows.some((row) => row.key !== "cloud" && row.provided);

  let confidence = "Low";
  if (coveragePct >= 80 && selectedCount >= 2 && nonCloudProvidedInScope) confidence = "High";
  else if (coveragePct >= 50) confidence = "Medium";

  const warnings = [];
  const advisories = [];
  if (!(isFiniteNumber(inputs.nRef) && inputs.nRef > 0) && totalMonthly > 0) {
    warnings.push(`Normalization uses default client baseline n=${DEFAULT_N_REF}. Add nRef for exact comparability.`);
  }
  if (selectedCount === 1) {
    advisories.push("Single-domain mode is active. Select additional domains for portfolio comparability.");
  }
  if (!nonCloudInScope) {
    advisories.push("Only Cloud is in scope. Add non-cloud domains for broader FinOps 2026 alignment.");
  }
  if (selectedCount > 0 && providedInScopeCount < selectedCount) {
    const missing = inScopeRows.filter((row) => !row.provided).map((row) => row.label);
    warnings.push(`Selected scope missing costs for: ${missing.join(", ")}.`);
  }

  return {
    rows,
    selectedDomains,
    selectedCount,
    providedInScopeCount,
    totalTrackedDomains,
    schemaCoveragePct,
    coveragePct,
    totalMonthly,
    normalizedTotal,
    confidence,
    warnings,
    advisories,
    formula: "NTC/client = sum(alpha_d * C_d) / n",
    weightingPolicy: {
      recommendedMode: "financial-truth",
      financialTruthRule: "alpha_d = 1 if selected in scope, else 0",
      optionalPriorityIndexRule: "sum(w_d) = 1",
      bands: PRIORITY_WEIGHT_BANDS,
      balancedDefaultProfile: BALANCED_PRIORITY_PROFILE
    }
  };
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

  if (isFiniteNumber(devPerClient) && devPerClient >= 0) {
    const n = isFiniteNumber(nRef) && nRef > 0 ? nRef : DEFAULT_N_REF;
    model.K = devPerClient * Math.pow(n, model.a);
    derivations.push(`K=${model.K.toFixed(0)}`);
  }

  if (isFiniteNumber(infraTotal) && infraTotal >= 0) {
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
    ((isFiniteNumber(devPerClient) && devPerClient >= 0) || (isFiniteNumber(infraTotal) && infraTotal >= 0))
  ) {
    model.ARPU = minPriceAtClients(startupTargetClients, model);
    effectiveARPU = model.ARPU;
    arpuMode = "startup-clients";
    derivations.push(`ARPU~${model.ARPU.toFixed(2)}@clients=${Math.round(startupTargetClients)}`);
  }

  return { model, effectiveARPU, arpuMode, derivations };
}

function computeReliabilityMetrics(inputs, existingModeledCostMonthly) {
  const enabled = Boolean(inputs && inputs.reliabilityEnabled);
  if (!enabled) {
    return {
      enabled: false,
      expectedDowntimeMinutes: null,
      expectedSlaPenaltyMonthly: null,
      expectedIncidentLaborMonthly: null,
      expectedRevenueAtRiskMonthly: null,
      expectedChurnRiskMonthly: null,
      expectedReliabilityFailureCostMonthly: null,
      reliabilityInvestmentMonthly: null,
      reliabilityAdjustedCostMonthly: null,
      reliabilityRiskBand: "none",
      reliabilityDataConfidence: "low"
    };
  }

  const minutesInMonth = Math.max(1, toNumber(inputs.minutesInMonth) || DEFAULT_MINUTES_IN_MONTH);
  const sloTargetAvailabilityPct = clampPercent(inputs.sloTargetAvailabilityPct, 99.9);
  const sliObservedAvailabilityPct = clampPercent(inputs.sliObservedAvailabilityPct, 99.9);
  const incidentCountMonthly = Math.max(0, toNumber(inputs.incidentCountMonthly) || 0);
  const mttrHours = Math.max(0, toNumber(inputs.mttrHours) || 0);
  const incidentFteCount = Math.max(0, toNumber(inputs.incidentFteCount) || 1);
  const incidentBlendedHourlyRate = Math.max(0, toNumber(inputs.incidentBlendedHourlyRate) || 0);
  const criticalRevenuePerMinute = Math.max(0, toNumber(inputs.criticalRevenuePerMinute) || 0);
  const criticalTrafficSharePct = clampPercent(inputs.criticalTrafficSharePct, 100);
  const arrExposedMonthly = Math.max(0, toNumber(inputs.arrExposedMonthly) || 0);
  const churnSensitivityPct = clampPercent(inputs.churnSensitivityPct, 0);
  const breachProbabilityPct = clampPercent(inputs.breachProbabilityPct, 0);
  const reliabilityInvestmentMonthly = Math.max(0, toNumber(inputs.reliabilityInvestmentMonthly) || 0);
  const modeledCostMonthly = Math.max(0, toNumber(existingModeledCostMonthly) || 0);

  const observedAvailability = sliObservedAvailabilityPct / 100;
  const criticalTrafficShare = criticalTrafficSharePct / 100;
  const expectedDowntimeMinutes = Math.max(0, (1 - observedAvailability) * minutesInMonth);

  const breachGapPct = Math.max(0, sloTargetAvailabilityPct - sliObservedAvailabilityPct);
  const penaltyOverride = toNumber(inputs.slaPenaltyMonthly) || 0;
  const penaltyRatePerBreachPointMonthly = Math.max(0, toNumber(inputs.slaPenaltyRatePerBreachPointMonthly) || 0);
  const expectedSlaPenaltyMonthly = penaltyOverride > 0
    ? penaltyOverride
    : (breachGapPct * penaltyRatePerBreachPointMonthly);

  const expectedIncidentLaborMonthly = incidentCountMonthly * mttrHours * incidentFteCount * incidentBlendedHourlyRate;
  const expectedRevenueAtRiskMonthly = expectedDowntimeMinutes * criticalRevenuePerMinute * criticalTrafficShare;
  const expectedChurnRiskMonthly = arrExposedMonthly * (churnSensitivityPct / 100) * (breachProbabilityPct / 100);
  const expectedReliabilityFailureCostMonthly =
    expectedSlaPenaltyMonthly +
    expectedIncidentLaborMonthly +
    expectedRevenueAtRiskMonthly +
    expectedChurnRiskMonthly;

  const reliabilityAdjustedCostMonthly =
    modeledCostMonthly + reliabilityInvestmentMonthly + expectedReliabilityFailureCostMonthly;

  const failureCostShare = reliabilityAdjustedCostMonthly > 0
    ? expectedReliabilityFailureCostMonthly / reliabilityAdjustedCostMonthly
    : 0;

  let reliabilityRiskBand = "low";
  if (failureCostShare >= 0.2 || breachGapPct >= 0.5 || sliObservedAvailabilityPct < 99.0) {
    reliabilityRiskBand = "high";
  } else if (failureCostShare >= 0.1 || breachGapPct >= 0.1 || sliObservedAvailabilityPct < 99.5) {
    reliabilityRiskBand = "medium";
  }

  const confidenceInputs = [
    inputs.sloTargetAvailabilityPct,
    inputs.sliObservedAvailabilityPct,
    inputs.incidentCountMonthly,
    inputs.mttrHours,
    inputs.incidentBlendedHourlyRate,
    inputs.criticalRevenuePerMinute,
    inputs.arrExposedMonthly,
    inputs.churnSensitivityPct,
    inputs.breachProbabilityPct,
    inputs.reliabilityInvestmentMonthly
  ];
  const providedCount = countProvided(confidenceInputs);
  let reliabilityDataConfidence = "low";
  if (providedCount >= 8) {
    reliabilityDataConfidence = "high";
  } else if (providedCount >= 5) {
    reliabilityDataConfidence = "medium";
  }

  return {
    enabled: true,
    sloTargetAvailabilityPct,
    sliObservedAvailabilityPct,
    expectedDowntimeMinutes,
    expectedSlaPenaltyMonthly,
    expectedIncidentLaborMonthly,
    expectedRevenueAtRiskMonthly,
    expectedChurnRiskMonthly,
    expectedReliabilityFailureCostMonthly,
    reliabilityInvestmentMonthly,
    reliabilityAdjustedCostMonthly,
    reliabilityRiskBand,
    reliabilityDataConfidence
  };
}

export function computeOutputs(inputs, model, effectiveARPU, arpuMode) {
  const {
    nRef,
    devPerClient,
    infraTotal,
    ARPU: arpuInput,
    startupTargetPrice,
    startupTargetClients,
    techDomains,
    costSaaS,
    costLicensing,
    costPrivateCloud,
    costDataCenter,
    costLabor
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
  const ccer = hasInfra && hasARPU ? (infraRaw > 0 ? (revenue / infraRaw) : Number.POSITIVE_INFINITY) : null;
  const cudMonthlySaving = hasInfra ? infraRaw - infraCud : null;

  const searchMax = Math.max(20000, model.nMax);
  const economics = scanEconomicRange(arpuUsed, searchMax, model);
  const requiredClientsAtTargetPrice = (hasStartupPrice && hasAnyCostInput)
    ? findRequiredClientsForTargetPrice(startupTargetPrice, searchMax, model)
    : null;

  const requiredPriceAtTargetClients = (hasStartupClients && hasAnyCostInput)
    ? minPriceAtClients(startupTargetClients, model)
    : null;

  const reqClientsFromClientsMode = (arpuMode === "startup-clients" && isFiniteNumber(requiredPriceAtTargetClients))
    ? findRequiredClientsForTargetPrice(requiredPriceAtTargetClients, searchMax, model)
    : null;

  const normalization = buildNormalizationSnapshot({
    nRef,
    infraTotal,
    techDomains,
    costSaaS,
    costLicensing,
    costPrivateCloud,
    costDataCenter,
    costLabor
  });
  const budgetBasisCost = normalization.totalMonthly > 0 ? normalization.totalMonthly : total;
  const reliability = computeReliabilityMetrics(inputs, budgetBasisCost);
  const hasReliabilitySignal = Boolean(reliability && reliability.enabled && reliability.expectedReliabilityFailureCostMonthly !== null);
  const reliabilityLoadMonthly = hasReliabilitySignal
    ? (Math.max(0, Number(reliability.reliabilityInvestmentMonthly) || 0) + Math.max(0, Number(reliability.expectedReliabilityFailureCostMonthly) || 0))
    : null;

  const beN = economics.breakEvenN;

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

  const reliabilityAdjustedProfit = hasARPU && reliability.reliabilityAdjustedCostMonthly !== null
    ? (revenue - reliability.reliabilityAdjustedCostMonthly)
    : null;
  const requiredARPU_with_rel = reliability.reliabilityAdjustedCostMonthly !== null
    ? (reliability.reliabilityAdjustedCostMonthly / Math.max(1, nSample)) * (1 + model.m)
    : null;
  const arpuUplift_with_rel = hasARPU && requiredARPU_with_rel !== null
    ? Math.max(0, requiredARPU_with_rel - arpuUsed)
    : null;
  const requiredClients_with_rel = hasARPU && hasAnyCostInput && reliabilityLoadMonthly !== null
    ? findRequiredClientsForTargetPriceWithReliability(arpuUsed, searchMax, reliabilityLoadMonthly, model)
    : null;
  const extraClients_with_rel = requiredClients_with_rel !== null
    ? Math.max(0, Math.ceil(requiredClients_with_rel - nSample))
    : null;

  return {
    breakEvenClients,
    minPricePerClient: hasAnyCostInput ? minPricePerClient : null,
    vcpu: hasInfra ? vcpu : null,
    contributionMargin: hasInfra && hasARPU ? contributionMargin : null,
    ccer,
    cudMonthlySaving,
    requiredClientsAtTargetPrice,
    requiredPriceAtTargetClients,
    targetMonthlyRevenue,
    reliabilityAdjustedProfit,
    requiredARPU_with_rel,
    arpuUplift_with_rel,
    requiredClients_with_rel,
    extraClients_with_rel,
    reliability,
    normalization: {
      selectedDomains: normalization.selectedDomains,
      selectedCount: normalization.selectedCount,
      providedInScopeCount: normalization.providedInScopeCount,
      totalTrackedDomains: normalization.totalTrackedDomains,
      schemaCoveragePct: normalization.schemaCoveragePct,
      coveragePct: normalization.coveragePct,
      totalMonthly: normalization.totalMonthly,
      normalizedTechCostPerClient: normalization.normalizedTotal,
      confidence: normalization.confidence,
      warnings: normalization.warnings,
      advisories: normalization.advisories,
      formula: normalization.formula,
      weightingPolicy: normalization.weightingPolicy,
      domainRows: normalization.rows
    }
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
  const ccer = infraRaw > 0 ? (revenue / infraRaw) : Number.POSITIVE_INFINITY;
  const cudSaveGapPct = infraRaw > 0 ? ((infraRaw - infraCud) / infraRaw) : 0;

  const economics = scanEconomicRange(arpuUsed, Math.max(20000, model.nMax), model);
  const beN = economics.breakEvenN;

  let score = 100;
  const failed = [];

  if (beN === null) {
    score -= 35;
    failed.push("No break-even point exists within the current model range.");
  } else if (nSample < beN) {
    score -= 35;
    failed.push(`Current clients (${Math.round(nSample)}) are below break-even (${beN}).`);
  }

  if (Number.isFinite(ccer) && ccer < 1) {
    score -= 30;
    failed.push(`CCER is ${ccer.toFixed(2)}x (<1x).`);
  } else if (Number.isFinite(ccer) && ccer < 3) {
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

function normalizeRecommendationCategory(category) {
  if (typeof category !== "string") return "all";
  return RECOMMENDATION_CATEGORIES.includes(category) ? category : "all";
}

function inferRecommendationCategory(rec) {
  if (rec && typeof rec.category === "string") {
    const explicit = normalizeRecommendationCategory(rec.category);
    return explicit === "all" ? "infrastructure" : explicit;
  }

  const haystack = `${rec?.title || ""} ${rec?.desc || ""} ${rec?.action || ""}`.toLowerCase();

  if (/(crm|churn|renewal|upsell|cross-sell|retention)/.test(haystack)) return "crm";
  if (/(pricing|price floor|arpu|package|fee increase|realized price)/.test(haystack)) return "pricing";
  if (/(marketing|funnel|mql|sql|cac|demand generation|acquisition|sales motion)/.test(haystack)) return "marketing";
  if (/(tagging|forecast|budget|anomaly|governance|allocation|guardrail|policy)/.test(haystack)) return "governance";
  return "infrastructure";
}

function buildStrategicRecommendations({ zoneKey, nSample, beN, arpuUsed, minCostN, minCostPerClient }) {
  if (!["green", "yellow", "red"].includes(zoneKey)) return [];
  if (!isFiniteNumber(arpuUsed)) return [];

  const strategic = [];
  const minCostGap = Math.max(0, minCostPerClient - arpuUsed);
  const upliftPct = arpuUsed > 0 ? (minCostGap / arpuUsed) * 100 : 0;

  if (beN === null && minCostGap > 0) {
    strategic.push({
      title: "Raise realized ARPU above cost floor",
      desc: `Current ARPU (${arpuUsed.toFixed(2)} per client) is below the model floor (${minCostPerClient.toFixed(2)} per client near n~${minCostN}).`,
      action: `Improve realized price by at least ${minCostGap.toFixed(2)} per client (${upliftPct.toFixed(1)}%) via packaging tiers, add-ons, annual commitment discounts, or selective fee increases.`,
      category: "pricing",
      providers: [],
      zones: [zoneKey],
      priority: "high"
    });
    strategic.push({
      title: "Marketing + funnel acceleration toward efficient scale",
      desc: `Client volume still matters: unit cost bottoms near n~${minCostN}. Demand generation should align with this operating band.`,
      action: "Run a 90-day growth motion (paid + partner + referral), improve MQL->SQL->Win conversion in CRM, and review CAC payback against the ARPU gap weekly.",
      category: "marketing",
      providers: [],
      zones: [zoneKey],
      priority: "medium"
    });
    strategic.push({
      title: "CRM retention and expansion revenue playbook",
      desc: "When cost cuts are near limit, expansion and retention become the fastest margin levers.",
      action: `Launch upsell/cross-sell journeys, renewal controls, and churn-prevention triggers to add at least ${minCostGap.toFixed(2)} per client in net revenue over the next cycle.`,
      category: "crm",
      providers: [],
      zones: [zoneKey],
      priority: "high"
    });
    return strategic;
  }

  if (isFiniteNumber(beN) && nSample < beN) {
    const gapClients = Math.max(1, Math.round(beN - nSample));
    strategic.push({
      title: "Close break-even client gap with GTM execution",
      desc: `You are ${gapClients} clients below break-even volume (${beN}).`,
      action: "Prioritize pipeline quality, onboarding speed, and CRM conversion stages to move qualified demand into paying clients faster while protecting margin.",
      category: "marketing",
      providers: [],
      zones: [zoneKey],
      priority: "high"
    });
  }

  return strategic;
}

function buildRecommendationContext(inputs, model, effectiveARPU) {
  if (!inputs || !model) return null;

  const nSample = isFiniteNumber(inputs.nRef) && inputs.nRef > 0 ? inputs.nRef : DEFAULT_N_REF;
  const arpuUsed = (isFiniteNumber(effectiveARPU) && effectiveARPU > 0)
    ? effectiveARPU
    : (isFiniteNumber(inputs.ARPU) && inputs.ARPU > 0 ? inputs.ARPU : null);

  const economics = scanEconomicRange(arpuUsed, Math.max(20000, model.nMax), model);

  return {
    nSample,
    arpuUsed,
    beN: economics.breakEvenN,
    minCostN: economics.minUnitCostN,
    minCostPerClient: economics.minUnitCostPerClient
  };
}

function buildPrioritizedRecommendations({ zoneKey, providers, category, inputs, model, effectiveARPU }) {
  if (!["green", "yellow", "red"].includes(zoneKey)) return [];

  const categoryKey = normalizeRecommendationCategory(category);
  const context = buildRecommendationContext(inputs, model, effectiveARPU);
  const strategicRecommendations = context
    ? buildStrategicRecommendations({ zoneKey, ...context })
    : [];

  return [...strategicRecommendations, ...RECOMMENDATIONS]
    .map((rec) => ({ ...rec, category: inferRecommendationCategory(rec) }))
    .filter((rec) => rec.zones.includes(zoneKey))
    .filter((rec) => rec.providers.length === 0 || providers.some((provider) => rec.providers.includes(provider)))
    .filter((rec) => categoryKey === "all" || rec.category === categoryKey)
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority))
    .map((rec) => ({
      title: rec.title,
      priority: rec.priority,
      providers: rec.providers,
      category: rec.category,
      desc: rec.desc,
      action: rec.action
    }));
}

export function recommendTool(args = {}) {
  const zoneKey = typeof args.zoneKey === "string" ? args.zoneKey : "awaiting";
  const providers = normalizeProviders(args.providers);
  const category = normalizeRecommendationCategory(args.category);
  const normalizedInputs = args.inputs && typeof args.inputs === "object" ? normalizeInputs(args.inputs) : null;
  const derived = normalizedInputs ? deriveModel(normalizedInputs) : null;

  const recommendations = buildPrioritizedRecommendations({
    zoneKey,
    providers,
    category,
    inputs: normalizedInputs,
    model: derived ? derived.model : null,
    effectiveARPU: derived ? derived.effectiveARPU : null
  });

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

function buildSerializedInputState(inputs) {
  if (!inputs || typeof inputs !== "object") return {};
  const state = {};
  Object.entries(inputs).forEach(([key, value]) => {
    if (key === "techDomains") return;
    if (key === "currency") {
      const normalizedCurrency = normalizeCurrencyCode(value);
      if (!normalizedCurrency || normalizedCurrency === DEFAULT_CURRENCY_CODE) return;
      state[key] = normalizedCurrency;
      return;
    }
    if (value === null || value === undefined || value === "") return;
    state[key] = String(value);
  });
  return state;
}

function normalizeShareStatePayload(payload = {}) {
  const inputState = payload.i && typeof payload.i === "object"
    ? payload.i
    : (payload.inputs && typeof payload.inputs === "object" ? payload.inputs : {});

  return {
    v: SHARE_STATE_VERSION,
    ui: normalizeUiIntent(payload.ui),
    um: normalizeUiMode(payload.um),
    i: buildSerializedInputState(inputState),
    td: normalizeTechDomains(payload.td),
    p: normalizeProviders(payload.p),
    h: normalizeHiddenCurves(payload.h)
  };
}

export function encodeStateTool(args = {}) {
  const state = args.state && typeof args.state === "object"
    ? normalizeShareStatePayload(args.state)
    : normalizeShareStatePayload({
      ui: args.uiIntent,
      um: args.uiMode,
      i: args.inputs && typeof args.inputs === "object" ? args.inputs : {},
      td: args.inputs && typeof args.inputs === "object" ? args.inputs.techDomains : undefined,
      p: args.providers,
      h: args.hiddenCurves
    });

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
    ? buildPrioritizedRecommendations({
      zoneKey: health ? health.zoneKey : "awaiting",
      providers,
      category: "all",
      inputs,
      model: derived.model,
      effectiveARPU: derived.effectiveARPU
    })
    : [];

  const stateToken = options.includeStateToken
    ? encodeShareState(normalizeShareStatePayload({
      ui: args.uiIntent,
      um: args.uiMode,
      i: buildSerializedInputState(inputs),
      td: inputs.techDomains,
      p: providers,
      h: hiddenCurves
    }))
    : null;

  const result = {
    normalizedInputs: inputs,
    model: derived.model,
    meta: {
      effectiveARPU: derived.effectiveARPU,
      arpuMode: derived.arpuMode,
      warnings: outputs.normalization.warnings
    },
    outputs,
    health,
    recommendations,
    stateToken
  };

  if (options.includeSeries) {
    const reliabilitySeriesLoad = outputs.reliability && outputs.reliability.enabled && outputs.reliability.expectedReliabilityFailureCostMonthly !== null
      ? (Math.max(0, Number(outputs.reliability.reliabilityInvestmentMonthly) || 0) + Math.max(0, Number(outputs.reliability.expectedReliabilityFailureCostMonthly) || 0))
      : null;
    result.series = buildData(derived.model, 300, reliabilitySeriesLoad);
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
        currency: { type: ["string", "null"], enum: [...ACCEPTED_CURRENCY_CODES, null] },
        devPerClient: { type: ["number", "null"], minimum: 0 },
        infraTotal: { type: ["number", "null"], minimum: 0 },
        ARPU: { type: ["number", "null"], minimum: 0 },
        startupTargetPrice: { type: ["number", "null"], minimum: 0 },
        startupTargetClients: { type: ["number", "null"], minimum: 1 },
        cudPct: { type: ["number", "null"], minimum: 0, maximum: 95 },
        margin: { type: ["number", "null"], minimum: 0, maximum: 200 },
        nMax: { type: ["number", "null"], minimum: 10, maximum: 100000 },
        techDomains: {
          type: "array",
          items: { type: "string", enum: VALID_TECH_DOMAIN_KEYS },
          uniqueItems: true
        },
        costSaaS: { type: ["number", "null"], minimum: 0 },
        costLicensing: { type: ["number", "null"], minimum: 0 },
        costPrivateCloud: { type: ["number", "null"], minimum: 0 },
        costDataCenter: { type: ["number", "null"], minimum: 0 },
        costLabor: { type: ["number", "null"], minimum: 0 },
        reliabilityEnabled: { type: ["boolean", "string"], enum: [true, false, "on", "off"] },
        sloTargetAvailabilityPct: { type: ["number", "null"], minimum: 0, maximum: 100 },
        sliObservedAvailabilityPct: { type: ["number", "null"], minimum: 0, maximum: 100 },
        incidentCountMonthly: { type: ["number", "null"], minimum: 0 },
        mttrHours: { type: ["number", "null"], minimum: 0 },
        incidentBlendedHourlyRate: { type: ["number", "null"], minimum: 0 },
        criticalRevenuePerMinute: { type: ["number", "null"], minimum: 0 },
        arrExposedMonthly: { type: ["number", "null"], minimum: 0 },
        slaPenaltyRatePerBreachPointMonthly: { type: ["number", "null"], minimum: 0 },
        reliabilityInvestmentMonthly: { type: ["number", "null"], minimum: 0 },
        minutesInMonth: { type: ["number", "null"], minimum: 1 },
        incidentFteCount: { type: ["number", "null"], minimum: 0 },
        criticalTrafficSharePct: { type: ["number", "null"], minimum: 0, maximum: 100 },
        churnSensitivityPct: { type: ["number", "null"], minimum: 0, maximum: 100 },
        breachProbabilityPct: { type: ["number", "null"], minimum: 0, maximum: 100 },
        slaPenaltyMonthly: { type: ["number", "null"], minimum: 0 }
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
    uiIntent: { type: "string", enum: UI_INTENT_OPTIONS },
    uiMode: { type: "string", enum: UI_MODE_OPTIONS },
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
    providers: { type: "array", items: { type: "string", enum: PROVIDERS }, uniqueItems: true },
    category: { type: "string", enum: RECOMMENDATION_CATEGORIES },
    inputs: INPUT_SCHEMA_CALCULATE.properties.inputs
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
    hiddenCurves: { type: "array", items: { type: "string", enum: CURVE_KEYS }, uniqueItems: true },
    uiIntent: { type: "string", enum: UI_INTENT_OPTIONS },
    uiMode: { type: "string", enum: UI_MODE_OPTIONS }
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
