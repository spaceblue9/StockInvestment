import {
  buildProductionDeploymentChecklist,
  renderProductionDeploymentChecklistText,
} from "../src/services/deploymentChecklistService.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const checklist = buildProductionDeploymentChecklist();

if (args.format === "text") {
  process.stdout.write(renderProductionDeploymentChecklistText(checklist));
} else {
  process.stdout.write(`${JSON.stringify(checklist, null, 2)}\n`);
}

if (args.strict && checklist.status === "blocked") {
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {
    format: "json",
    strict: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] || "";

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--format") {
      parsed.format = next() === "text" ? "text" : "json";
    } else if (arg === "--strict") {
      parsed.strict = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  process.stdout.write(`Production deployment checklist dry-run

Usage:
  npm run deployment:check -- [options]

Options:
  --format json|text
  --strict
  --help

This command validates deployment configuration from environment variables.
It does not deploy, migrate, backup, restore, or call external providers.
`);
}
