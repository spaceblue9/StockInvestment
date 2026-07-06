const DEFAULT_MODE = "shadow";
const VALID_MODES = new Set(["off", "shadow", "enabled"]);

export function getDecisionEngineConfig(options = {}) {
  const rawMode = String(options.mode ?? options.env?.THINK2_DECISION_ENGINE ?? process.env.THINK2_DECISION_ENGINE ?? DEFAULT_MODE)
    .trim()
    .toLowerCase();
  const mode = VALID_MODES.has(rawMode) ? rawMode : DEFAULT_MODE;

  return {
    mode,
    think2ShadowVisible: mode === "shadow" || mode === "enabled",
    think2DecisionEnabled: mode === "enabled",
    effectiveActionSource: mode === "enabled" ? "think2_shadow" : "legacy",
    rollbackMode: "off",
    envVar: "THINK2_DECISION_ENGINE",
    allowedValues: [...VALID_MODES],
    warning: mode === "enabled"
      ? "Think2 decision engine is enabled. Roll back immediately by setting THINK2_DECISION_ENGINE=off or shadow."
      : "Think2 decision engine is not replacing legacy Target_Action.",
  };
}

export function applyDecisionEngineAction(row = {}, options = {}) {
  const config = getDecisionEngineConfig(options);
  const legacyAction = String(row.Target_Action || row.Advice || "No Data");
  const shadowAction = String(row.Action_v2_Shadow || "");
  const effectiveAction = config.think2DecisionEnabled && shadowAction
    ? shadowAction
    : legacyAction;

  return {
    Decision_Engine_Mode: config.mode,
    Effective_Target_Action: effectiveAction,
    Effective_Action_Source: config.effectiveActionSource,
    Decision_Engine_Warning: config.warning,
  };
}
