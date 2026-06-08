import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyStatePatch } from "../src/services/statePatchService.js";
import {
  buildCanaryPatch,
  renderPostgresPatchSmokeText,
  runPostgresPatchSmoke,
} from "../src/services/postgresPatchSmokeService.js";

const cliPath = fileURLToPath(new URL("./postgresPatchSmoke.js", import.meta.url));
const secretUrl = "postgres://stockflix:super-secret-smoke-db@db.example.com:5432/stockflix_staging";
const generatedAt = "2026-06-06T14:54:56.000Z";

const dryRun = await runPostgresPatchSmoke({
  repositoryAdapter: "postgres",
  databaseUrl: secretUrl,
  sslMode: "require",
  nodeEnv: "staging",
  validationRunbookReady: true,
  backupEvidence: "snapshot-staging-001",
  generatedAt,
});
assertEqual(dryRun.status, "dry_run", "Ready smoke without confirm should stay in dry-run mode.");
assertEqual(dryRun.executed, false, "Dry-run must not execute patch writes.");
assertHasCheck(dryRun, "confirm_guard", "warning");
assert(dryRun.patch.operations.some((operation) => operation.collection === "users" && operation.type === "upsert"), "Dry-run should show user upsert.");
assert(dryRun.patch.operations.some((operation) => operation.collection === "sessions" && operation.type === "append"), "Dry-run should show session append.");
assert(dryRun.patch.operations.some((operation) => operation.collection === "sessions" && operation.type === "delete"), "Dry-run should show session delete.");
assert(dryRun.patch.operations.some((operation) => operation.collection === "auditEvents" && operation.type === "append"), "Dry-run should show audit append.");
assert(!JSON.stringify(dryRun).includes("super-secret-smoke-db"), "Dry-run JSON must not expose database password.");

const dryRunText = renderPostgresPatchSmokeText(dryRun);
assert(dryRunText.includes("Postgres Patch Smoke"), "Text renderer should include title.");
assert(dryRunText.includes("Patch Operations"), "Text renderer should include patch operations.");
assert(!dryRunText.includes("super-secret-smoke-db"), "Text renderer must not expose database password.");

const blocked = await runPostgresPatchSmoke({
  repositoryAdapter: "postgres",
  databaseUrl: secretUrl,
  sslMode: "require",
  nodeEnv: "production",
  confirm: true,
  dryRun: false,
  validationRunbookReady: true,
  backupEvidence: "snapshot-staging-001",
  generatedAt,
});
assertEqual(blocked.status, "blocked", "Production smoke should block without allowProduction.");
assertHasCheck(blocked, "production_guard", "blocker");

let writerCalled = 0;
let capturedPatch = null;
let currentState = {
  users: [],
  sessions: [],
  organizations: [],
  auditEvents: [
    {
      id: "seed-audit",
      action: "system.seed",
      eventHash: "seed-hash",
      previousHash: "",
      createdAt: "2026-06-06T14:00:00.000Z",
    },
  ],
};
const executed = await runPostgresPatchSmoke({
  repositoryAdapter: "postgres",
  databaseUrl: secretUrl,
  sslMode: "require",
  nodeEnv: "staging",
  confirm: true,
  dryRun: false,
  validationRunbookReady: true,
  backupEvidence: "snapshot-staging-001",
  generatedAt,
  stateReader: async () => clone(currentState),
  patchWriter: async (patch) => {
    writerCalled += 1;
    capturedPatch = patch;
    const result = applyStatePatch(currentState, patch);
    currentState = result.state;
    return result;
  },
});
assertEqual(executed.status, "executed", "Confirmed staging smoke should execute with injected writer.");
assertEqual(writerCalled, 1, "Patch writer should be called once.");
assertEqual(executed.evidence.beforeCounts.users, 0, "Before counts should capture user count.");
assertEqual(executed.evidence.afterCounts.users, 1, "After counts should capture user upsert.");
assertEqual(executed.evidence.afterCounts.sessions, 0, "Session append/delete smoke should leave no canary session behind.");
assertEqual(executed.evidence.afterCounts.auditEvents, 2, "Audit append should add one canary event.");
assertEqual(executed.evidence.patchSummary.operationCount, 5, "Patch summary should include all smoke operations.");
assertEqual(capturedPatch.operations.length, 5, "Captured patch should include five operations.");
const auditAppend = capturedPatch.operations.find((operation) => operation.collection === "auditEvents");
assertEqual(auditAppend.record.previousHash, "seed-hash", "Audit smoke event should chain to previous hash.");
assert(auditAppend.record.eventHash, "Audit smoke event should include eventHash.");
assert(!JSON.stringify(executed).includes("super-secret-smoke-db"), "Executed evidence must not expose database password.");

const builtPatch = buildCanaryPatch({
  generatedAt,
  previousHash: "seed-hash",
});
assertEqual(builtPatch.operations.length, 5, "Canary patch builder should include five operations.");

const readyCli = runCli(["--format", "json", "--strict"], readyEnv());
assertEqual(readyCli.status, 0, "CLI strict dry-run should exit 0 when non-blocked.");
const readyCliResult = JSON.parse(readyCli.stdout);
assertEqual(readyCliResult.status, "dry_run", "CLI should default to dry-run.");
assert(!readyCli.stdout.includes("super-secret-smoke-db"), "CLI dry-run output must not expose database password.");

const blockedCli = runCli(["--format", "json", "--strict"], {
  APP_STATE_REPOSITORY: "local_file",
  DATABASE_URL: "",
});
assertEqual(blockedCli.status, 1, "CLI strict mode should exit 1 when blocked.");
const blockedCliResult = JSON.parse(blockedCli.stdout);
assertEqual(blockedCliResult.status, "blocked", "Blocked CLI output should report blocked.");

console.log(JSON.stringify({
  ok: true,
  dryRunStatus: dryRun.status,
  executedStatus: executed.status,
  blockedStatus: blocked.status,
  writerCalled,
  operationCount: executed.patch.operationCount,
}, null, 2));

function readyEnv() {
  return {
    APP_STATE_REPOSITORY: "postgres",
    DATABASE_URL: secretUrl,
    DATABASE_SSL_MODE: "require",
    NODE_ENV: "staging",
    POSTGRES_PATCH_VALIDATION_READY: "true",
    POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE: "snapshot-staging-001",
  };
}

function runCli(args, env) {
  const scrubbedEnv = {
    APP_STATE_REPOSITORY: "",
    DATABASE_URL: "",
    DATABASE_SSL_MODE: "",
    NODE_ENV: "",
    POSTGRES_PATCH_VALIDATION_READY: "",
    POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE: "",
    POSTGRES_PATCH_SMOKE_CANARY_USER_ID: "",
    POSTGRES_PATCH_SMOKE_CANARY_ORGANIZATION_ID: "",
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
