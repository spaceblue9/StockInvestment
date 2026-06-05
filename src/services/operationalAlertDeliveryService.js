import crypto from "node:crypto";

export const OPERATIONAL_ALERT_DELIVERY_VERSION = "stockflix-ops-alert-delivery-v1";

const DEFAULT_TIMEOUT_MS = 5000;
const SECRET_PATTERN = /SECRET|PASSWORD|TOKEN|KEY|DATABASE_URL|AUTH|COOKIE/u;

export function buildOperationalAlertPayload(readinessReport = {}, options = {}) {
  const alerts = Array.isArray(readinessReport.alerts) ? readinessReport.alerts : [];
  const generatedAt = options.generatedAt || new Date().toISOString();

  return sanitizeValue({
    version: OPERATIONAL_ALERT_DELIVERY_VERSION,
    generatedAt,
    source: options.source || "stockflix",
    environment: options.environment || process.env.NODE_ENV || "unknown",
    readiness: {
      version: readinessReport.version || "",
      status: readinessReport.status || "unknown",
      ok: readinessReport.ok !== false,
      generatedAt: readinessReport.generatedAt || "",
      summary: readinessReport.summary || {},
    },
    alerts: alerts.map((alert) => ({
      id: alert.id || "",
      severity: alert.severity || "info",
      title: alert.title || "",
      message: alert.message || "",
      details: alert.details || {},
    })),
    runbook: readinessReport.runbook || {},
  });
}

export function buildOperationalAlertDeliveryPlan(readinessReport = {}, options = {}) {
  const config = deliveryConfig(options);
  const payload = buildOperationalAlertPayload(readinessReport, {
    generatedAt: options.generatedAt,
    source: config.source,
    environment: config.environment,
  });
  const alertCount = payload.alerts.length;
  const checks = deliveryChecks(config, alertCount);
  const blockerCount = checks.filter((check) => check.severity === "blocker").length;
  const warningCount = checks.filter((check) => check.severity === "warning").length;
  const body = JSON.stringify(payload);
  const timestamp = options.timestamp || Math.floor(Date.now() / 1000).toString();
  const headers = config.secret
    ? signedHeaders({ body, secret: config.secret, timestamp })
    : baseHeaders(timestamp);

  return {
    version: OPERATIONAL_ALERT_DELIVERY_VERSION,
    generatedAt: options.generatedAt || new Date().toISOString(),
    status: deliveryPlanStatus({ config, blockerCount, alertCount }),
    ok: blockerCount === 0,
    summary: {
      alerts: alertCount,
      criticalAlerts: payload.alerts.filter((alert) => alert.severity === "critical").length,
      warningAlerts: payload.alerts.filter((alert) => alert.severity === "warning").length,
      blockers: blockerCount,
      warnings: warningCount,
    },
    config: sanitizedConfig(config),
    checks,
    payload,
    requestPreview: {
      method: "POST",
      url: config.endpoint ? maskUrl(config.endpoint) : "(missing)",
      headers: sanitizeHeaders(headers),
      bodyBytes: Buffer.byteLength(body, "utf8"),
    },
  };
}

export async function deliverOperationalAlerts(readinessReport = {}, options = {}) {
  const plan = buildOperationalAlertDeliveryPlan(readinessReport, options);
  const config = deliveryConfig(options);
  const payloadBody = JSON.stringify(plan.payload);
  const timestamp = options.timestamp || Math.floor(Date.now() / 1000).toString();
  const headers = config.secret
    ? signedHeaders({ body: payloadBody, secret: config.secret, timestamp })
    : baseHeaders(timestamp);

  if (plan.summary.blockers > 0) {
    return resultFromPlan(plan, {
      status: "blocked",
      ok: false,
      message: "Operational alert delivery is blocked by missing required configuration.",
    });
  }

  if (!config.endpoint) {
    return resultFromPlan(plan, {
      status: "disabled",
      ok: true,
      message: "Operational alert delivery is disabled because no webhook URL is configured.",
    });
  }

  if (plan.summary.alerts === 0) {
    return resultFromPlan(plan, {
      status: "no_alerts",
      ok: true,
      message: "Operational readiness has no alerts to deliver.",
    });
  }

  if (config.dryRun) {
    return resultFromPlan(plan, {
      status: "dry_run",
      ok: true,
      message: "Operational alert delivery dry-run completed without sending a webhook.",
    });
  }

  try {
    const response = await postWebhook({
      endpoint: config.endpoint,
      headers,
      body: payloadBody,
      timeoutMs: config.timeoutMs,
      fetchImpl: options.fetchImpl,
    });
    const success = response.status >= 200 && response.status < 300;
    const status = success ? "delivered" : config.required ? "failed" : "needs_review";

    return resultFromPlan(plan, {
      status,
      ok: success || !config.required,
      message: success
        ? "Operational alerts were delivered to the configured webhook."
        : "Operational alert webhook returned a non-2xx response.",
      delivery: {
        statusCode: response.status,
        responsePreview: response.body.slice(0, 500),
      },
    });
  } catch (error) {
    return resultFromPlan(plan, {
      status: config.required ? "failed" : "needs_review",
      ok: !config.required,
      message: error.message || "Operational alert webhook delivery failed.",
      delivery: {
        error: error.message || String(error),
      },
    });
  }
}

export function renderOperationalAlertDeliveryText(result) {
  const lines = [
    `Operational Alert Delivery (${result.status})`,
    `Generated: ${result.generatedAt}`,
    `Alerts: ${result.summary.alerts} total, ${result.summary.criticalAlerts} critical, ${result.summary.warningAlerts} warnings`,
    `Webhook: ${result.config.endpoint}`,
    `Required: ${result.config.required}`,
    `Dry run: ${result.config.dryRun}`,
    "",
    "Checks:",
    ...result.checks.map((check) => `- [${check.severity}] ${check.id}: ${check.message}`),
    "",
    "Alerts:",
    ...(result.payload.alerts.length
      ? result.payload.alerts.map((alert) => `- [${alert.severity}] ${alert.id}: ${alert.title}`)
      : ["- none"]),
    "",
    `Message: ${result.message}`,
  ];

  if (result.delivery) {
    lines.push("", "Delivery:", ...Object.entries(result.delivery).map(([key, value]) => `- ${key}: ${value}`));
  }

  return `${lines.join("\n")}\n`;
}

export function signOperationalAlertPayload({ body, secret, timestamp }) {
  return `v1=${crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

function deliveryConfig(options = {}) {
  const env = options.env || process.env;
  return {
    endpoint: stringOption(options, env, "endpoint", "OPERATIONAL_ALERT_WEBHOOK_URL"),
    secret: stringOption(options, env, "secret", "OPERATIONAL_ALERT_WEBHOOK_SECRET"),
    provider: stringOption(options, env, "provider", "OPERATIONAL_ALERT_WEBHOOK_PROVIDER") || "generic_webhook",
    source: stringOption(options, env, "source", "OPERATIONAL_ALERT_SOURCE") || "stockflix",
    environment: stringOption(options, env, "environment", "NODE_ENV") || "unknown",
    required: booleanOption(options, env, "required", "OPERATIONAL_ALERT_WEBHOOK_REQUIRED", false),
    dryRun: booleanOption(options, env, "dryRun", "OPERATIONAL_ALERT_WEBHOOK_DRY_RUN", false),
    timeoutMs: numberOption(options, env, "timeoutMs", "OPERATIONAL_ALERT_WEBHOOK_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
  };
}

function deliveryChecks(config, alertCount) {
  return [
    check(
      "webhook_url",
      config.endpoint ? "ok" : config.required ? "blocker" : "warning",
      config.endpoint
        ? `Operational alert webhook URL is configured for ${maskUrl(config.endpoint)}.`
        : "OPERATIONAL_ALERT_WEBHOOK_URL is not configured; delivery remains disabled.",
    ),
    check(
      "webhook_secret",
      strongSecret(config.secret) ? "ok" : config.required ? "blocker" : "warning",
      strongSecret(config.secret)
        ? "OPERATIONAL_ALERT_WEBHOOK_SECRET is configured for HMAC signatures."
        : "Set OPERATIONAL_ALERT_WEBHOOK_SECRET to sign alert delivery payloads.",
    ),
    check(
      "delivery_timeout",
      config.timeoutMs >= 1000 && config.timeoutMs <= 30000 ? "ok" : "warning",
      `Operational alert webhook timeout is ${config.timeoutMs} ms.`,
    ),
    check(
      "alerts_present",
      alertCount > 0 ? "ok" : "info",
      alertCount > 0
        ? `${alertCount} operational alerts are ready for delivery.`
        : "Operational readiness has no alerts to deliver.",
    ),
  ];
}

function deliveryPlanStatus({ config, blockerCount, alertCount }) {
  if (blockerCount > 0) {
    return "blocked";
  }
  if (!config.endpoint) {
    return "disabled";
  }
  if (alertCount === 0) {
    return "no_alerts";
  }
  if (config.dryRun) {
    return "dry_run";
  }
  return "ready";
}

function resultFromPlan(plan, fields) {
  return {
    ...plan,
    ...fields,
  };
}

async function postWebhook({ endpoint, headers, body, timeoutMs, fetchImpl }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await (fetchImpl || fetch)(endpoint, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    return {
      status: response.status,
      body: await response.text(),
    };
  } finally {
    clearTimeout(timer);
  }
}

function signedHeaders({ body, secret, timestamp }) {
  return {
    ...baseHeaders(timestamp),
    "x-stockflix-ops-signature": signOperationalAlertPayload({ body, secret, timestamp }),
  };
}

function baseHeaders(timestamp) {
  return {
    "content-type": "application/json",
    "x-stockflix-ops-version": OPERATIONAL_ALERT_DELIVERY_VERSION,
    "x-stockflix-ops-timestamp": timestamp,
  };
}

function sanitizedConfig(config) {
  return {
    provider: config.provider,
    endpoint: config.endpoint ? maskUrl(config.endpoint) : "(missing)",
    secret: config.secret ? "****" : "(missing)",
    required: config.required,
    dryRun: config.dryRun,
    timeoutMs: config.timeoutMs,
    source: config.source,
    environment: config.environment,
  };
}

function sanitizeHeaders(headers) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [
    key,
    key.includes("signature") ? "****" : value,
  ]));
}

function sanitizeValue(value, key = "") {
  if (value === null || value === undefined) {
    return value;
  }

  if (SECRET_PATTERN.test(key)) {
    return "****";
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitizeValue(entryValue, entryKey),
    ]));
  }

  if (typeof value === "string" && value.includes("://")) {
    return maskUrl(value);
  }

  return value;
}

function maskUrl(value) {
  try {
    const url = new URL(value);
    if (url.password) {
      url.password = "****";
    }
    for (const key of url.searchParams.keys()) {
      url.searchParams.set(key, "****");
    }
    return url.toString();
  } catch {
    return value;
  }
}

function stringOption(options, env, optionKey, envKey) {
  const value = Object.prototype.hasOwnProperty.call(options, optionKey) ? options[optionKey] : env[envKey];
  return value === null || value === undefined ? "" : String(value).trim();
}

function booleanOption(options, env, optionKey, envKey, fallback) {
  const value = Object.prototype.hasOwnProperty.call(options, optionKey) ? options[optionKey] : env[envKey];
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function numberOption(options, env, optionKey, envKey, fallback) {
  const value = Object.prototype.hasOwnProperty.call(options, optionKey) ? options[optionKey] : env[envKey];
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function strongSecret(value) {
  return String(value || "").trim().length >= 16;
}

function check(id, severity, message) {
  return { id, severity, message };
}
