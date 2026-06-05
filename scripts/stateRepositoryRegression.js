import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-state-repository-"));

process.chdir(tempRoot);

try {
  const repository = await import(pathToFileURL(path.join(repoRoot, "src", "services", "stateRepository.js")).href);
  const { readAppState, stateRepositoryInfo, writeAppState } = repository;

  const empty = await readAppState({
    normalize: (state) => ({
      ...state,
      normalized: true,
      users: state.users || [],
    }),
  });
  assertEqual(empty.normalized, true, "Read should pass missing file through normalizer.");
  assertEqual(empty.users.length, 0, "Missing file should normalize to empty users.");

  await writeAppState({
    users: [{ id: "user_1", email: "owner@example.test" }],
    sessions: [],
  });
  const written = await readAppState({
    normalize: (state) => ({
      ...state,
      userCount: (state.users || []).length,
    }),
  });
  assertEqual(written.userCount, 1, "Written state should be readable through repository.");
  assertEqual(written.users[0].email, "owner@example.test", "Repository should preserve JSON content.");

  const info = stateRepositoryInfo();
  assertEqual(info.adapter, "local_file", "Default adapter should be local_file.");
  assertEqual(info.stateFile, "data/app-state.json", "Repository should expose portable state file path.");
  assertEqual(info.normalizedOnRead, true, "Repository should declare normalized reads.");
  assertEqual(info.productionReady, false, "Local file adapter should not be marked production ready.");
  assertIncludes(info.supportedAdapters, ["local_file", "postgres"], "Repository should advertise local and postgres adapters.");

  const stateFile = path.join(tempRoot, "data", "app-state.json");
  const raw = JSON.parse(await fs.readFile(stateFile, "utf8"));
  assertEqual(raw.users.length, 1, "Repository should write to cwd data/app-state.json.");

  process.env.APP_STATE_REPOSITORY = "postgres";
  const postgresInfo = stateRepositoryInfo();
  assertEqual(postgresInfo.adapter, "postgres", "Postgres adapter should be selectable by env.");
  assertEqual(postgresInfo.engine, "postgresql", "Postgres adapter should expose database engine.");
  assertEqual(postgresInfo.databaseUrlConfigured, false, "Postgres adapter should report missing DATABASE_URL.");
  await expectReject(
    () => readAppState(),
    "Postgres adapter should fail fast when DATABASE_URL is missing.",
  );
  process.env.APP_STATE_REPOSITORY = "not_a_repository";
  await expectReject(
    () => readAppState(),
    "Unsupported repository adapter should fail fast.",
  );
  delete process.env.APP_STATE_REPOSITORY;

  console.log(JSON.stringify({
    ok: true,
    tempRoot,
    adapter: info.adapter,
    stateFile: info.stateFile,
    userCount: written.userCount,
  }, null, 2));
} finally {
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    return;
  }

  throw new Error(`${message}\n${JSON.stringify({ actual, expected }, null, 2)}`);
}

function assertIncludes(actual, expectedItems, message) {
  const missing = expectedItems.filter((item) => !actual.includes(item));
  if (!missing.length) {
    return;
  }

  throw new Error(`${message}\nMissing: ${missing.join(", ")}`);
}

async function expectReject(action, message) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(message);
}
