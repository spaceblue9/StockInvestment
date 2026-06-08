import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildPostgresPatchValidationRunbook,
  renderPostgresPatchValidationRunbookText,
} from "../src/services/postgresPatchValidationRunbookService.js";

const cliPath = fileURLToPath(new URL("./postgresPatchValidationRunbook.js", import.meta.url));
const secretUrl = "postgres://stockflix:super-secret-patch-db@db.example.com:5432/stockflix_staging";

const readyOptions = {
  repositoryAdapter: "postgres",
  databaseUrl: secretUrl,
  sslMode: "require",
  backupStrategy: "both",
  pgDriverReady: true,
  importDryRunDone: true,
  stateImported: true,
  backupVerified: true,
  rollbackPlanApproved: true,
  patchSmokeApproved: true,
  scopedReadVerified: true,
  auditMirrorVerified: true,
  canaryUserId: "patch-user-001",
  canaryOrganizationId: "patch-org-001",
  generatedAt: "2026-06-06T14:42:03.000Z",
};

const readyRunbook = buildPostgresPatchValidationRunbook(readyOptions);
assertEqual(readyRunbook.status, "ready", "Fully confirmed patch validation runbook should be ready.");
assertEqual(readyRunbook.summary.blockers, 0, "Ready runbook should have no blockers.");
assertEqual(readyRunbook.summary.warnings, 0, "Ready runbook should have no warnings.");
assertEqual(readyRunbook.patchWriteMode, "collection_level_transaction", "Runbook should report Postgres collection-level patch write mode.");
assert(readyRunbook.database.safeUrl.includes("****"), "DATABASE_URL should be masked.");
assert(!JSON.stringify(readyRunbook).includes("super-secret-patch-db"), "Runbook JSON must not expose database password.");
assert(readyRunbook.patchSmoke.operations.some((operation) => operation.operation === "upsert" && operation.collection === "users"), "Runbook should include user upsert smoke.");
assert(readyRunbook.patchSmoke.operations.some((operation) => operation.operation === "append" && operation.collection === "sessions"), "Runbook should include session append smoke.");
assert(readyRunbook.patchSmoke.operations.some((operation) => operation.operation === "delete" && operation.collection === "sessions"), "Runbook should include session delete smoke.");
assert(readyRunbook.patchSmoke.operations.some((operation) => operation.operation === "append" && operation.collection === "auditEvents"), "Runbook should include audit append smoke.");
assert(readyRunbook.verificationQueries.some((query) => query.includes("audit_events")), "Runbook should include audit verification query.");
assert(readyRunbook.rollbackPlan.some((step) => step.includes("backup/restore")), "Runbook should include rollback plan.");

const readyText = renderPostgresPatchValidationRunbookText(readyRunbook);
assert(readyText.includes("Postgres Patch Write Validation Runbook"), "Text renderer should include title.");
assert(readyText.includes("Patch Smoke Matrix"), "Text renderer should include patch smoke matrix.");
assert(readyText.includes("Verification Queries"), "Text renderer should include verification queries.");
assert(!readyText.includes("super-secret-patch-db"), "Text renderer must not expose database password.");

const needsReviewRunbook = buildPostgresPatchValidationRunbook({
  ...readyOptions,
  scopedReadVerified: false,
  auditMirrorVerified: false,
});
assertEqual(needsReviewRunbook.status, "needs_review", "Missing post-smoke verification should require review, not block prerequisites.");
assertHasCheck(needsReviewRunbook, "scoped_read_verified", "warning");
assertHasCheck(needsReviewRunbook, "audit_mirror_verified", "warning");

const blockedRunbook = buildPostgresPatchValidationRunbook({
  repositoryAdapter: "local_file",
  databaseUrl: "",
  sslMode: "disable",
  backupStrategy: "unknown",
  pgDriverReady: false,
  importDryRunDone: false,
  stateImported: false,
  backupVerified: false,
  rollbackPlanApproved: false,
  patchSmokeApproved: false,
});
assertEqual(blockedRunbook.status, "blocked", "Local or incomplete config should block patch validation.");
assert(blockedRunbook.summary.blockers >= 8, "Blocked runbook should report multiple blockers.");
assertHasCheck(blockedRunbook, "repository_adapter", "blocker");
assertHasCheck(blockedRunbook, "database_url", "blocker");
assertHasCheck(blockedRunbook, "pg_driver_ready", "blocker");
assertHasCheck(blockedRunbook, "import_dry_run_done", "blocker");
assertHasCheck(blockedRunbook, "state_imported", "blocker");
assertHasCheck(blockedRunbook, "backup_verified", "blocker");
assertHasCheck(blockedRunbook, "rollback_plan_approved", "blocker");
assertHasCheck(blockedRunbook, "patch_smoke_approved", "blocker");
assertHasCheck(blockedRunbook, "backup_strategy", "blocker");
assertHasCheck(blockedRunbook, "database_ssl_mode", "warning");

const readyCli = runCli(["--format", "json", "--strict"], readyEnv());
assertEqual(readyCli.status, 0, "CLI strict mode should exit 0 when runbook is ready.");
const readyCliRunbook = JSON.parse(readyCli.stdout);
assertEqual(readyCliRunbook.status, "ready", "CLI JSON output should report ready.");
assert(!readyCli.stdout.includes("super-secret-patch-db"), "CLI JSON output must not expose database password.");

const textCli = runCli(["--format", "text", "--strict"], readyEnv());
assertEqual(textCli.status, 0, "CLI text strict mode should exit 0 when ready.");
assert(textCli.stdout.includes("Patch Smoke Matrix"), "CLI text should include patch smoke matrix.");
assert(!textCli.stdout.includes("super-secret-patch-db"), "CLI text output must not expose database password.");

const blockedCli = runCli(["--format", "json", "--strict"], {
  APP_STATE_REPOSITORY: "local_file",
  DATABASE_URL: "",
  DATABASE_SSL_MODE: "disable",
  POSTGRES_BACKUP_STRATEGY: "unknown",
});
assertEqual(blockedCli.status, 1, "CLI strict mode should exit 1 when blocked.");
const blockedCliRunbook = JSON.parse(blockedCli.stdout);
assertEqual(blockedCliRunbook.status, "blocked", "CLI JSON output should report blocked.");

console.log(JSON.stringify({
  ok: true,
  readyStatus: readyRunbook.status,
  needsReviewStatus: needsReviewRunbook.status,
  blockedStatus: blockedRunbook.status,
  checkCount: readyRunbook.summary.totalChecks,
}, null, 2));

function readyEnv() {
  return {
    APP_STATE_REPOSITORY: "postgres",
    DATABASE_URL: secretUrl,
    DATABASE_SSL_MODE: "require",
    POSTGRES_BACKUP_STRATEGY: "both",
    POSTGRES_PATCH_VALIDATION_PG_DRIVER_READY: "true",
    POSTGRES_PATCH_IMPORT_DRY_RUN_DONE: "true",
    POSTGRES_PATCH_STATE_IMPORTED: "true",
    POSTGRES_PATCH_BACKUP_VERIFIED: "true",
    POSTGRES_PATCH_ROLLBACK_PLAN_APPROVED: "true",
    POSTGRES_PATCH_SMOKE_APPROVED: "true",
    POSTGRES_PATCH_SCOPED_READ_VERIFIED: "true",
    POSTGRES_PATCH_AUDIT_MIRROR_VERIFIED: "true",
    POSTGRES_PATCH_VALIDATION_CANARY_USER_ID: "patch-user-001",
    POSTGRES_PATCH_VALIDATION_CANARY_ORGANIZATION_ID: "patch-org-001",
  };
}

function runCli(args, env) {
  const scrubbedEnv = {
    APP_STATE_REPOSITORY: "",
    DATABASE_URL: "",
    DATABASE_SSL_MODE: "",
    POSTGRES_BACKUP_STRATEGY: "",
    POSTGRES_PATCH_VALIDATION_PG_DRIVER_READY: "",
    POSTGRES_PATCH_IMPORT_DRY_RUN_DONE: "",
    POSTGRES_PATCH_STATE_IMPORTED: "",
    POSTGRES_PATCH_BACKUP_VERIFIED: "",
    POSTGRES_PATCH_ROLLBACK_PLAN_APPROVED: "",
    POSTGRES_PATCH_SMOKE_APPROVED: "",
    POSTGRES_PATCH_SCOPED_READ_VERIFIED: "",
    POSTGRES_PATCH_AUDIT_MIRROR_VERIFIED: "",
    POSTGRES_PATCH_VALIDATION_CANARY_USER_ID: "",
    POSTGRES_PATCH_VALIDATION_CANARY_ORGANIZATION_ID: "",
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

function assertHasCheck(runbook, id, severity) {
  assert(
    runbook.checks.some((check) => check.id === id && check.severity === severity),
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
