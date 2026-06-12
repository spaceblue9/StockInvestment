import {
  recoverZeroMarketPortfolioSnapshots,
  renderPortfolioSnapshotRecoveryText,
} from "../src/services/portfolioSnapshotRecoveryService.js";

const args = parseArgs(process.argv.slice(2));
const result = await recoverZeroMarketPortfolioSnapshots({
  confirm: Boolean(args.confirm),
  userId: args.userId || "",
});

if (args.format === "json") {
  console.log(JSON.stringify(result, null, 2));
} else {
  process.stdout.write(renderPortfolioSnapshotRecoveryText(result));
}

function parseArgs(values) {
  const parsed = {
    confirm: false,
    format: "text",
    userId: "",
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--confirm") {
      parsed.confirm = true;
    } else if (value === "--user-id") {
      parsed.userId = values[index + 1] || "";
      index += 1;
    } else if (value === "--format") {
      parsed.format = values[index + 1] || "text";
      index += 1;
    } else if (value === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  if (!["json", "text"].includes(parsed.format)) {
    throw new Error("--format must be json or text.");
  }

  return parsed;
}

function printHelp() {
  process.stdout.write(`Usage:
  npm run portfolio:recover-zero-market -- [--user-id <id>] [--format text|json]
  npm run portfolio:recover-zero-market -- --confirm [--user-id <id>]

Default mode is dry-run. Use --confirm to write repaired snapshots after reviewing the output.
`);
}
