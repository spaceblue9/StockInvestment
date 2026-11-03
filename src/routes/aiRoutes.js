import express from "express";
import {
  countUserAuditEventsSince,
  getCustomerPortfolioSnapshot,
  getUserFromRequest,
  recordAuditEvent,
  requirePlanEntitlement,
} from "../services/authService.js";
import {
  aiMonthlyRequestLimit,
  generateAiInvestmentExplanation,
  openRouterAiInfo,
} from "../services/aiInvestmentService.js";

const router = express.Router();
const AI_AUDIT_ACTION = "ai.investment_explanation";

router.get("/ai/status", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ ok: false, message: "Please sign in to use AI Assistant." });
    return;
  }

  let entitled = true;
  try {
    requirePlanEntitlement(user, "ai.investment_explainer");
  } catch {
    entitled = false;
  }

  const limit = aiMonthlyRequestLimit();
  const used = await countUserAuditEventsSince(user.id, AI_AUDIT_ACTION, monthStartIso());
  res.json({
    ok: true,
    entitled,
    ...openRouterAiInfo(),
    quota: { used, limit, remaining: Math.max(0, limit - used) },
  });
});

router.post("/ai/explain", async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ ok: false, message: "Please sign in to use AI Assistant." });
      return;
    }
    requirePlanEntitlement(user, "ai.investment_explainer");

    const limit = aiMonthlyRequestLimit();
    const used = await countUserAuditEventsSince(user.id, AI_AUDIT_ACTION, monthStartIso());
    if (used >= limit) {
      res.status(429).json({
        ok: false,
        message: `Monthly AI limit reached (${limit} explanations). Please try again next month.`,
      });
      return;
    }

    const snapshot = await getCustomerPortfolioSnapshot(user.id);
    if (!snapshot || (!(snapshot.portfolioRows || []).length && !(snapshot.recommendations || []).length)) {
      res.status(409).json({
        ok: false,
        message: "Run portfolio analysis first so AI Assistant has verified Think2 data to explain.",
      });
      return;
    }

    const explanation = await generateAiInvestmentExplanation(snapshot, req.body || {});
    await recordAuditEvent({
      actorUserId: user.id,
      targetUserId: user.id,
      action: AI_AUDIT_ACTION,
      details: {
        mode: explanation.context.mode,
        symbol: explanation.context.symbol,
        model: explanation.model,
        totalTokens: explanation.usage.totalTokens,
        costUsd: explanation.usage.costUsd,
      },
    });

    res.json({
      ok: true,
      ...explanation,
      generatedAt: new Date().toISOString(),
      quota: { used: used + 1, limit, remaining: Math.max(0, limit - used - 1) },
    });
  } catch (error) {
    next(error);
  }
});

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export default router;
