import http from "node:http";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildOperationalReadinessReport } from "../src/services/observabilityService.js";
import {
  buildOperationalAlertDeliveryPlan,
  deliverOperationalAlerts,
  renderOperationalAlertDeliveryText,
  signOperationalAlertPayload,
} from "../src/services/operationalAlertDeliveryService.js";

const cliPath = fileURLToPath(new URL("./operationalAlertDelivery.js", import.meta.url));
const secret = "ops-alert-secret-for-regression";
const report = buildOperationalReadinessReport({
  storageReadiness: {
    status: "blocked",
    blockerCount: 1,
    issues: [{ collection: "users", type: "duplicate_primary_key", count: 1 }],
  },
  auditIntegrity: {
    status: "needs_review",
    invalidEvents: 1,
  },
  auditTrail: {
    external: {
      enabled: true,
      required: true,
      status: "needs_configuration",
      endpointConfigured: false,
      missingFromExternalCount: 1,
    },
  },
  paymentGateway: {
    provider: "stripe_checkout",
    configured: false,
  },
  webhookEvents: 4,
  rejectedWebhookEvents: 3,
}, {
  repository: {
    adapter: "postgres",
    productionReady: true,
    scopedReads: "query_level_sql_where",
  },
  generatedAt: "2026-06-05T00:34:39.000Z",
});

const disabled = await deliverOperationalAlerts(report, {
  env: {},
  generatedAt: "2026-06-05T00:35:00.000Z",
});
assertEqual(disabled.status, "disabled", "Missing optional webhook URL should disable delivery.");
assertEqual(disabled.ok, true, "Disabled optional delivery should not block readiness.");
assertHasCheck(disabled, "webhook_url", "warning");

const blocked = await deliverOperationalAlerts(report, {
  env: {
    OPERATIONAL_ALERT_WEBHOOK_REQUIRED: "true",
  },
  generatedAt: "2026-06-05T00:35:01.000Z",
});
assertEqual(blocked.status, "blocked", "Required missing webhook config should block delivery.");
assertEqual(blocked.ok, false, "Required missing webhook config should fail.");
assertHasCheck(blocked, "webhook_url", "blocker");
assertHasCheck(blocked, "webhook_secret", "blocker");

let requestCount = 0;
const successServer = await listenServer(async (req, res, body) => {
  requestCount += 1;
  const timestamp = req.headers["x-stockflix-ops-timestamp"];
  const expectedSignature = signOperationalAlertPayload({ body, secret, timestamp });
  assertEqual(req.headers["x-stockflix-ops-signature"], expectedSignature, "Webhook signature should match request body.");
  assertEqual(req.headers["x-stockflix-ops-version"], "stockflix-ops-alert-delivery-v1", "Webhook version header should be present.");
  const payload = JSON.parse(body);
  assertEqual(payload.alerts.length, report.alerts.length, "Webhook payload should include all readiness alerts.");
  assert(!body.includes(secret), "Webhook payload must not include signing secret.");
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("accepted");
});

try {
  const endpoint = `http://127.0.0.1:${successServer.address().port}/ops-alerts?token=super-secret-query`;
  const dryRun = await deliverOperationalAlerts(report, {
    endpoint,
    secret,
    dryRun: true,
    generatedAt: "2026-06-05T00:35:02.000Z",
  });
  assertEqual(dryRun.status, "dry_run", "Dry-run should not send a webhook.");
  assertEqual(requestCount, 0, "Dry-run should not contact server.");
  assert(dryRun.config.endpoint.includes("token=****"), "Sanitized endpoint should mask query parameters.");
  assertEqual(dryRun.config.secret, "****", "Sanitized config should mask secret.");
  assertEqual(dryRun.requestPreview.headers["x-stockflix-ops-signature"], "****", "Request preview should mask signature.");

  const delivered = await deliverOperationalAlerts(report, {
    endpoint,
    secret,
    generatedAt: "2026-06-05T00:35:03.000Z",
  });
  assertEqual(delivered.status, "delivered", "Configured webhook should deliver alerts.");
  assertEqual(delivered.ok, true, "Successful delivery should be ok.");
  assertEqual(delivered.delivery.statusCode, 200, "Delivery result should expose response status.");
  assertEqual(requestCount, 1, "Successful delivery should send exactly one request.");

  const text = renderOperationalAlertDeliveryText(delivered);
  assert(text.includes("Operational Alert Delivery"), "Text renderer should include title.");
  assert(!text.includes(secret), "Text renderer must not expose secret.");
  assert(!JSON.stringify(delivered).includes(secret), "Delivery result JSON must not expose secret.");
} finally {
  await closeServer(successServer);
}

const failureServer = await listenServer(async (_req, res) => {
  res.writeHead(500, { "Content-Type": "text/plain" });
  res.end("temporary failure");
});

try {
  const endpoint = `http://127.0.0.1:${failureServer.address().port}/ops-alerts`;
  const optionalFailure = await deliverOperationalAlerts(report, {
    endpoint,
    secret,
  });
  assertEqual(optionalFailure.status, "needs_review", "Optional failed delivery should need review.");
  assertEqual(optionalFailure.ok, true, "Optional failed delivery should not block strict deployment.");

  const requiredFailure = await deliverOperationalAlerts(report, {
    endpoint,
    secret,
    required: true,
  });
  assertEqual(requiredFailure.status, "failed", "Required failed delivery should fail.");
  assertEqual(requiredFailure.ok, false, "Required failed delivery should block strict deployment.");
} finally {
  await closeServer(failureServer);
}

const noAlertPlan = buildOperationalAlertDeliveryPlan({
  ok: true,
  status: "ok",
  alerts: [],
  summary: {},
}, {
  endpoint: "https://ops.example/alerts",
  secret,
});
assertEqual(noAlertPlan.status, "no_alerts", "Plan should detect no-alert readiness.");
assertHasCheck(noAlertPlan, "alerts_present", "info");

const cliDryRun = runCli(["--format", "json", "--dry-run", "--strict"], {
  OPERATIONAL_ALERT_WEBHOOK_URL: "https://ops.example/alerts?token=cli-secret",
  OPERATIONAL_ALERT_WEBHOOK_SECRET: secret,
  OPERATIONAL_ALERT_WEBHOOK_REQUIRED: "true",
});
assertEqual(cliDryRun.status, 0, "CLI dry-run strict mode should pass when config is present.");
const cliDryRunBody = JSON.parse(cliDryRun.stdout);
assertEqual(cliDryRunBody.status, "dry_run", "CLI dry-run should report dry_run.");
assert(!cliDryRun.stdout.includes(secret), "CLI output must not expose secret.");
assert(!cliDryRun.stdout.includes("cli-secret"), "CLI output must mask URL query parameters.");

const cliBlocked = runCli(["--format", "json", "--strict"], {
  OPERATIONAL_ALERT_WEBHOOK_REQUIRED: "true",
});
assertEqual(cliBlocked.status, 1, "CLI strict mode should fail when required config is missing.");
const cliBlockedBody = JSON.parse(cliBlocked.stdout);
assertEqual(cliBlockedBody.status, "blocked", "CLI strict blocked output should report blocked.");

console.log(JSON.stringify({
  ok: true,
  alertCount: report.alerts.length,
  disabledStatus: disabled.status,
  blockedStatus: blocked.status,
  cliDryRunStatus: cliDryRunBody.status,
}, null, 2));

function listenServer(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", async () => {
        try {
          await handler(req, res, Buffer.concat(chunks).toString("utf8"));
        } catch (error) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(error.message);
        }
      });
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function runCli(args, env) {
  const scrubbedEnv = {
    OPERATIONAL_ALERT_WEBHOOK_URL: "",
    OPERATIONAL_ALERT_WEBHOOK_SECRET: "",
    OPERATIONAL_ALERT_WEBHOOK_REQUIRED: "",
    OPERATIONAL_ALERT_WEBHOOK_DRY_RUN: "",
    OPERATIONAL_ALERT_WEBHOOK_TIMEOUT_MS: "",
  };
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    env: {
      ...process.env,
      ...scrubbedEnv,
      ...env,
    },
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function assertHasCheck(result, id, severity) {
  assert(
    result.checks.some((check) => check.id === id && check.severity === severity),
    `Expected ${id} to be ${severity}.`,
  );
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n${JSON.stringify({ actual, expected }, null, 2)}`);
  }
}
