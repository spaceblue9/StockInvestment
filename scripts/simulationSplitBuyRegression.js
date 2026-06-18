import { simulateRows } from "../src/services/simulationService.js";

const rows = Array.from({ length: 70 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 0, index + 1)),
  close: 10,
  high: 20,
  low: 10,
}));

const split = simulateRows(rows, rows, {
  initialCapital: 100000,
  buyMode: "split",
  tranches: 5,
  trancheIntervalDays: 10,
});

assertEqual(split.buyPlan.mode, "split", "Buy plan should preserve split mode.");
assertEqual(split.buyPlan.tranches, 5, "Split buy should keep requested tranche count.");
assertEqual(split.buyPlan.amountPerTranche, 20000, "100,000 THB split into 5 tranches should allocate 20,000 per tranche.");
assertEqual(split.summary.completedTranches, 5, "Simulation should release all five tranches across enough rows.");
assertEqual(split.summary.deployedCapital, 100000, "Split simulation should deploy the full planned capital when all tranches complete.");
assertEqual(split.trades.length, 5, "Split strategy should create one buy trade per due tranche when buy conditions remain valid.");
assert(split.trades.every((trade) => trade.Action.startsWith("BUY T")), "Split trades should identify tranche buys.");
assertEqual(split.summary.averageCost, 10, "Average cost should be calculated from tranche buy costs.");
assert(split.history.some((row) => row.Deployed_Capital === 20000), "History should expose staged deployed capital.");

const lump = simulateRows(rows, rows, {
  initialCapital: 100000,
  buyMode: "lump_sum",
});

assertEqual(lump.buyPlan.mode, "lump_sum", "Default strategy should keep lump sum mode.");
assertEqual(lump.buyPlan.tranches, 1, "Lump sum mode should report one tranche.");
assertEqual(lump.trades.length, 1, "Lump sum strategy should still buy once when conditions remain valid.");
assertEqual(lump.summary.deployedCapital, 100000, "Lump sum should have full capital available from start.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "split-buy-mode",
    "amount-per-tranche",
    "completed-tranches",
    "multi-trade-schedule",
    "average-cost",
    "lump-sum-compatibility",
  ],
}));

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${expected}, received ${actual}.`);
  }
}
