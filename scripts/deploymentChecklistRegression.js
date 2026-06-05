import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildProductionDeploymentChecklist,
  renderProductionDeploymentChecklistText,
} from "../src/services/deploymentChecklistService.js";

const cliPath = fileURLToPath(new URL("./deploymentChecklist.js", import.meta.url));

const readyEnv = {
  NODE_ENV: "production",
  PORT: "3000",
  APP_STATE_REPOSITORY: "postgres",
  DATABASE_URL: "postgres://stockflix:super-secret-db@db.example.com:5432/stockflix_prod",
  DATABASE_SSL_MODE: "require",
  PAYMENT_GATEWAY_PROVIDER: "stripe_checkout",
  PAYMENT_GATEWAY_STRIPE_SECRET_KEY: "sk_live_secret_for_regression",
  PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET: "whsec_secret_for_regression",
  PAYMENT_GATEWAY_STRIPE_SUCCESS_URL: "https://stockflix.example/billing/success?session={sessionId}&plan={planId}",
  PAYMENT_GATEWAY_STRIPE_CANCEL_URL: "https://stockflix.example/billing/cancel?session={sessionId}",
  PAYMENT_GATEWAY_STRIPE_PRICE_STARTER: "price_starter",
  PAYMENT_GATEWAY_STRIPE_PRICE_PRO: "price_pro",
  PAYMENT_GATEWAY_STRIPE_PRICE_ADVISOR: "price_advisor",
  PAYMENT_WEBHOOK_SECRET: "local-gateway-prod-secret",
  AUDIT_TRAIL_EXTERNAL_PROVIDER: "http_webhook",
  AUDIT_TRAIL_EXTERNAL_REQUIRED: "true",
  AUDIT_TRAIL_HTTP_URL: "https://audit.example/events",
  AUDIT_TRAIL_HTTP_SECRET: "external-audit-prod-secret",
  POSTGRES_BACKUP_STRATEGY: "both",
  POSTGRES_BACKUP_RETENTION_DAYS: "30",
};

const readyChecklist = buildProductionDeploymentChecklist({
  env: readyEnv,
  generatedAt: "2026-06-04T14:14:16.000Z",
});

assertEqual(readyChecklist.status, "ready", "Fully configured deployment checklist should be ready.");
assertEqual(readyChecklist.summary.blockers, 0, "Ready checklist should have no blockers.");
assertEqual(readyChecklist.summary.warnings, 0, "Ready checklist should have no warnings.");
assert(readyChecklist.checks.every((check) => check.severity === "ok"), "Ready checklist should mark every check ok.");
assert(readyChecklist.sanitizedEnvironment.DATABASE_URL.includes("****"), "DATABASE_URL should mask password.");
assertEqual(readyChecklist.sanitizedEnvironment.PAYMENT_WEBHOOK_SECRET, "****", "Payment webhook secret should be masked.");
assert(readyChecklist.preflightCommands.some((command) => command.includes("npm run ci:quality")), "Checklist should include CI quality gate.");
assert(readyChecklist.preflightCommands.some((command) => command.includes("postgres:backup-runbook")), "Checklist should include Postgres backup runbook.");
assert(readyChecklist.preflightCommands.some((command) => command.includes("import:postgres")), "Checklist should include importer dry-run.");

const readyJson = JSON.stringify(readyChecklist);
const readyText = renderProductionDeploymentChecklistText(readyChecklist);

for (const secret of [
  "super-secret-db",
  "sk_live_secret_for_regression",
  "whsec_secret_for_regression",
  "local-gateway-prod-secret",
  "external-audit-prod-secret",
]) {
  assert(!readyJson.includes(secret), `Checklist JSON must not expose secret: ${secret}`);
  assert(!readyText.includes(secret), `Checklist text must not expose secret: ${secret}`);
}

assert(readyText.includes("Production Deployment Checklist"), "Text renderer should include title.");
assert(readyText.includes("Release Checklist"), "Text renderer should include release checklist.");
assert(readyText.includes("Rollback Checklist"), "Text renderer should include rollback checklist.");

const blockedChecklist = buildProductionDeploymentChecklist({
  env: {
    NODE_ENV: "development",
    APP_STATE_REPOSITORY: "local_file",
    PAYMENT_GATEWAY_PROVIDER: "local_gateway",
    PAYMENT_WEBHOOK_SECRET: "stockflix-local-webhook-secret",
    POSTGRES_BACKUP_STRATEGY: "unknown",
    POSTGRES_BACKUP_RETENTION_DAYS: "3",
  },
  generatedAt: "2026-06-04T14:15:00.000Z",
});

assertEqual(blockedChecklist.status, "blocked", "Prototype/local config should block production deployment.");
assert(blockedChecklist.summary.blockers >= 4, "Blocked checklist should report multiple blockers.");
assertHasCheck(blockedChecklist, "state_repository", "blocker");
assertHasCheck(blockedChecklist, "database_url", "blocker");
assertHasCheck(blockedChecklist, "payment_gateway_provider", "blocker");
assertHasCheck(blockedChecklist, "stripe_configuration", "blocker");
assertHasCheck(blockedChecklist, "postgres_backup_strategy", "blocker");
assertHasCheck(blockedChecklist, "node_env", "warning");
assertHasCheck(blockedChecklist, "local_gateway_webhook_secret", "warning");
assertHasCheck(blockedChecklist, "postgres_backup_retention", "warning");

const blockedText = renderProductionDeploymentChecklistText(blockedChecklist);
assert(blockedText.includes("blocked"), "Blocked text should include blocked status.");
assert(!blockedText.includes("stockflix-local-webhook-secret"), "Blocked text must mask default local secret.");

const readyCli = runCli(["--format", "json", "--strict"], readyEnv);
assertEqual(readyCli.status, 0, "CLI strict mode should exit 0 when checklist is ready.");
const readyCliChecklist = JSON.parse(readyCli.stdout);
assertEqual(readyCliChecklist.status, "ready", "CLI JSON output should report ready status.");
assert(!readyCli.stdout.includes("super-secret-db"), "CLI JSON output must not expose database password.");

const blockedCli = runCli(["--format", "json", "--strict"], {
  NODE_ENV: "development",
  APP_STATE_REPOSITORY: "local_file",
  PAYMENT_GATEWAY_PROVIDER: "local_gateway",
  PAYMENT_WEBHOOK_SECRET: "stockflix-local-webhook-secret",
  POSTGRES_BACKUP_STRATEGY: "unknown",
  POSTGRES_BACKUP_RETENTION_DAYS: "3",
});
assertEqual(blockedCli.status, 1, "CLI strict mode should exit 1 when checklist is blocked.");
const blockedCliChecklist = JSON.parse(blockedCli.stdout);
assertEqual(blockedCliChecklist.status, "blocked", "CLI JSON output should report blocked status.");
assert(!blockedCli.stdout.includes("stockflix-local-webhook-secret"), "CLI blocked output must mask default local secret.");

console.log(JSON.stringify({
  ok: true,
  readyStatus: readyChecklist.status,
  blockedStatus: blockedChecklist.status,
  readyChecks: readyChecklist.summary.totalChecks,
  blockedBlockers: blockedChecklist.summary.blockers,
}, null, 2));

function assertHasCheck(checklist, id, severity) {
  assert(
    checklist.checks.some((check) => check.id === id && check.severity === severity),
    `Expected ${id} to be ${severity}.`,
  );
}

function runCli(args, env) {
  const scrubbedEnv = Object.fromEntries(Object.keys(readyEnv).map((key) => [key, ""]));
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
