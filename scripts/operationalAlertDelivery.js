import { operationalReadinessReport } from "../src/services/observabilityService.js";
import {
  deliverOperationalAlerts,
  renderOperationalAlertDeliveryText,
} from "../src/services/operationalAlertDeliveryService.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const readiness = await operationalReadinessReport();
const result = await deliverOperationalAlerts(readiness, {
  dryRun: args.dryRun,
});

if (args.format === "text") {
  process.stdout.write(renderOperationalAlertDeliveryText(result));
} else {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (args.strict && !result.ok) {
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {
    format: "json",
    dryRun: false,
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
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--strict") {
      parsed.strict = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  process.stdout.write(`Operational alert delivery

Usage:
  npm run ops:alerts -- [options]

Options:
  --format json|text
  --dry-run
  --strict
  --help

Environment:
  OPERATIONAL_ALERT_WEBHOOK_URL
  OPERATIONAL_ALERT_WEBHOOK_SECRET
  OPERATIONAL_ALERT_WEBHOOK_REQUIRED=true|false
  OPERATIONAL_ALERT_WEBHOOK_DRY_RUN=true|false
  OPERATIONAL_ALERT_WEBHOOK_TIMEOUT_MS=5000

This command sends operational readiness alerts to a generic signed webhook only
when the webhook URL is configured and dry-run is not active.
`);
}
