import { applyDecisionEngineAction, getDecisionEngineConfig } from "../src/services/decisionEngineConfigService.js";
import { analyzeHolding } from "../src/services/portfolioService.js";

const baseRow = {
  Target_Action: "Buy Now (Good RRR)",
  Action_v2_Shadow: "WAIT_FOR_ENTRY_SHADOW",
};

const defaultConfig = getDecisionEngineConfig({ env: {} });
assertEqual(defaultConfig.mode, "shadow", "Default mode should expose shadow data without replacing legacy action.");
assertEqual(defaultConfig.think2DecisionEnabled, false, "Default mode must not enable Think2 decision engine.");

const defaultAction = applyDecisionEngineAction(baseRow, { env: {} });
assertEqual(defaultAction.Effective_Target_Action, "Buy Now (Good RRR)", "Default effective action should remain legacy Target_Action.");
assertEqual(defaultAction.Effective_Action_Source, "legacy", "Default source should be legacy.");

const offAction = applyDecisionEngineAction(baseRow, { env: { THINK2_DECISION_ENGINE: "off" } });
assertEqual(offAction.Decision_Engine_Mode, "off", "Explicit off mode should be accepted.");
assertEqual(offAction.Effective_Target_Action, "Buy Now (Good RRR)", "Off mode should use legacy Target_Action.");

const enabledAction = applyDecisionEngineAction(baseRow, { env: { THINK2_DECISION_ENGINE: "enabled" } });
assertEqual(enabledAction.Decision_Engine_Mode, "enabled", "Enabled mode should be accepted.");
assertEqual(enabledAction.Effective_Target_Action, "WAIT_FOR_ENTRY_SHADOW", "Enabled mode should use Think2 shadow action as effective action.");
assertEqual(enabledAction.Effective_Action_Source, "think2_shadow", "Enabled mode should identify Think2 source.");

const invalidConfig = getDecisionEngineConfig({ env: { THINK2_DECISION_ENGINE: "maybe" } });
assertEqual(invalidConfig.mode, "shadow", "Invalid mode should fall back to safe shadow mode.");
assertEqual(invalidConfig.think2DecisionEnabled, false, "Invalid mode must not enable Think2.");

const previousEnv = process.env.THINK2_DECISION_ENGINE;
delete process.env.THINK2_DECISION_ENGINE;
const legacyHolding = analyzeHolding(
  { Symbol: "SAFE", Quantity: 10, Avg_Price: 12 },
  {
    Symbol: "SAFE",
    Sector: "Healthcare",
    Price: 10,
    Total_Score: 80,
    Price_Position: 30,
    RRR: 2.4,
    Technical_RRR: 2.4,
    Entry_Zone_High: 11,
    Entry_Zone_Low: 8,
    Stop_Loss: 7.6,
    Exit_Zone_Low: 19.4,
    Exit_Zone_High: 20,
    Quality_Score: 80,
    Valuation_Score: 70,
    Setup_Score: 70,
    Balance_Risk_Score: 40,
    Liquidity_Score: 70,
    Composite_Score_v2: 70,
    Data_Status: "VALID",
    Conflict_Severity: "GREEN",
    Conflict_Alerts: "",
    Fundamental_RRR_Status: "INSUFFICIENT_DATA",
  },
);
assertEqual(legacyHolding.Target_Action, "Buy Now (Good RRR)", "Legacy Target_Action should remain unchanged.");
assertEqual(legacyHolding.Decision_Engine_Mode, "shadow", "Portfolio rows should record default decision mode.");
assertEqual(legacyHolding.Effective_Target_Action, legacyHolding.Target_Action, "Default portfolio effective action should equal legacy Target_Action.");
assertEqual(legacyHolding.Effective_Action_Source, "legacy", "Default portfolio effective source should remain legacy.");

process.env.THINK2_DECISION_ENGINE = "enabled";
const enabledHolding = analyzeHolding(
  { Symbol: "LIVE", Quantity: 10, Avg_Price: 12 },
  {
    ...legacyHolding,
    Symbol: "LIVE",
    Target_Action: undefined,
    Advice: undefined,
  },
);
assertEqual(enabledHolding.Target_Action, "Buy Now (Good RRR)", "Enabled flag must not mutate legacy Target_Action field.");
assertEqual(enabledHolding.Decision_Engine_Mode, "enabled", "Enabled portfolio rows should record enabled mode.");
assertEqual(enabledHolding.Effective_Target_Action, enabledHolding.Action_v2_Shadow, "Enabled portfolio effective action should come from Action_v2_Shadow.");
assertEqual(enabledHolding.Effective_Action_Source, "think2_shadow", "Enabled portfolio effective source should be Think2.");

restoreEnv(previousEnv);

console.log(JSON.stringify({
  ok: true,
  checked: [
    "default-shadow-mode-safe",
    "explicit-off-mode",
    "explicit-enabled-mode",
    "invalid-mode-fallback",
    "portfolio-target-action-unchanged",
    "portfolio-effective-action-flagged",
  ],
}, null, 2));

function restoreEnv(value) {
  if (value === undefined) {
    delete process.env.THINK2_DECISION_ENGINE;
  } else {
    process.env.THINK2_DECISION_ENGINE = value;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    restoreEnv(previousEnv);
    throw new Error(`${message} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
  }
}
