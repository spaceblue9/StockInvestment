import express from "express";
import {
  assignAdvisor,
  auditIntegritySummary,
  auditTrailSummary,
  businessMetrics,
  checkoutSubscription,
  clearSessionCookie,
  createApprovalRequest,
  createOrganization,
  createPaymentSession,
  createUser,
  decideApprovalRequest,
  getAuditEvents,
  getBillingHistory,
  getInvestorProfile,
  getCustomerPortfolioSnapshot,
  getPaymentSessions,
  getSessionIdFromRequest,
  getUserFromRequest,
  listOrganizations,
  listApprovalRequests,
  listWorkspaceUsers,
  loginUser,
  logoutSession,
  moveUserToOrganization,
  processPaymentWebhook,
  processProviderPaymentWebhook,
  processSignedPaymentWebhook,
  requirePlanEntitlement,
  rolePolicy,
  saveInvestorProfile,
  setSessionCookie,
  storageReadinessSummary,
  subscriptionPlans,
  tenantAccessSummary,
  updateOrganization,
  updateUserRole,
} from "../services/authService.js";
import {
  buildLaunchEvidenceCenter,
  buildLaunchEvidenceSignoffPack,
  renderLaunchEvidenceSignoffText,
} from "../services/launchEvidenceService.js";
import { operationalReadinessReport } from "../services/observabilityService.js";

const router = express.Router();

router.get("/auth/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  res.json({
    ok: true,
    user,
  });
});

router.post("/auth/register", async (req, res) => {
  try {
    const result = await createUser(req.body || {});
    setSessionCookie(res, result.session);
    res.json({
      ok: true,
      user: result.user,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const result = await loginUser(req.body || {});
    setSessionCookie(res, result.session);
    res.json({
      ok: true,
      user: result.user,
    });
  } catch (error) {
    res.status(401).json({
      ok: false,
      message: error.message,
    });
  }
});

router.post("/auth/logout", async (req, res) => {
  await logoutSession(getSessionIdFromRequest(req));
  clearSessionCookie(res);
  res.json({
    ok: true,
  });
});

router.get("/subscription/plans", (_req, res) => {
  res.json({
    ok: true,
    plans: subscriptionPlans(),
  });
});

router.get("/admin/policy", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view policy.",
    });
    return;
  }

  res.json({
    ok: true,
    policy: rolePolicy(user.role),
    entitlements: user.entitlements,
  });
});

router.get("/tenant/scope", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view tenant scope.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      scope: await tenantAccessSummary(user.id),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.post("/subscription/checkout", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in before subscribing.",
    });
    return;
  }

  try {
    const result = await checkoutSubscription(user.id, req.body?.planId);
    res.json({
      ok: true,
      user: result.user,
      billingEvent: result.billingEvent,
      paymentSession: result.paymentSession,
      webhookEvent: result.webhookEvent,
      duplicate: result.duplicate,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

router.post("/subscription/payment-session", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in before creating a payment session.",
    });
    return;
  }

  try {
    const result = await createPaymentSession(user.id, req.body?.planId);
    res.json({
      ok: true,
      user: result.user,
      paymentSession: result.paymentSession,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

router.post("/payment/webhook/simulate", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in before simulating a payment webhook.",
    });
    return;
  }

  try {
    const result = await processPaymentWebhook(user.id, req.body || {});
    res.json({
      ok: true,
      user: result.user,
      billingEvent: result.billingEvent,
      paymentSession: result.paymentSession,
      webhookEvent: result.webhookEvent,
      duplicate: result.duplicate,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

router.post("/payment/webhook/local-gateway", async (req, res) => {
  try {
    const result = await processSignedPaymentWebhook(req.body || {}, {
      signature: req.get("x-stockflix-signature"),
      timestamp: req.get("x-stockflix-timestamp"),
    });
    res.json({
      ok: true,
      user: result.user,
      billingEvent: result.billingEvent,
      paymentSession: result.paymentSession,
      webhookEvent: result.webhookEvent,
      duplicate: result.duplicate,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
      webhookEvent: error.webhookEvent || null,
    });
  }
});

router.post("/payment/webhook/provider/:provider", async (req, res) => {
  try {
    const result = await processProviderPaymentWebhook(req.params.provider, {
      rawBody: req.rawBody,
      body: req.body || {},
      headers: req.headers || {},
    });
    res.json({
      ok: true,
      user: result.user,
      billingEvent: result.billingEvent,
      paymentSession: result.paymentSession,
      webhookEvent: result.webhookEvent,
      duplicate: result.duplicate,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
      webhookEvent: error.webhookEvent || null,
    });
  }
});

router.get("/customer/portfolio", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view saved portfolio data.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      snapshot: await getCustomerPortfolioSnapshot(user.id),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/customer/billing", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view billing history.",
    });
    return;
  }

  res.json({
    ok: true,
    events: await getBillingHistory(user.id),
  });
});

router.get("/customer/payments", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view payment sessions.",
    });
    return;
  }

  res.json({
    ok: true,
    sessions: await getPaymentSessions(user.id, {
      limit: Number(req.query.limit) || 30,
    }),
  });
});

router.get("/audit/events", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view activity timeline.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      events: await getAuditEvents(user.id, {
        limit: Number(req.query.limit) || 50,
      }),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/approvals", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view approval requests.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      requests: await listApprovalRequests(user.id, {
        limit: Number(req.query.limit) || 50,
      }),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.post("/approvals", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to create approval requests.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      request: await createApprovalRequest(user.id, req.body || {}),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.post("/approvals/:approvalId/decision", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to decide approval requests.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      request: await decideApprovalRequest(user.id, req.params.approvalId, req.body || {}),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/audit/integrity", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view audit integrity.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      integrity: await auditIntegritySummary(user.id),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/audit/trail", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view external audit trail status.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      trail: await auditTrailSummary(user.id),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/storage/readiness", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view storage readiness.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      storage: await storageReadinessSummary(user.id),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/customer/profile", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view onboarding profile.",
    });
    return;
  }

  res.json({
    ok: true,
    profile: await getInvestorProfile(user.id),
  });
});

router.post("/customer/profile", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to save onboarding profile.",
    });
    return;
  }

  res.json({
    ok: true,
    profile: await saveInvestorProfile(user.id, req.body || {}),
  });
});

router.get("/admin/metrics", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view business metrics.",
    });
    return;
  }

  if (!["owner", "admin"].includes(user.role)) {
    res.status(403).json({
      ok: false,
      message: "Business metrics are available to the owner account only.",
    });
    return;
  }

  try {
    requirePlanEntitlement(user, "business.metrics");
    res.json({
      ok: true,
      metrics: await businessMetrics(),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/admin/launch-evidence", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view launch evidence.",
    });
    return;
  }

  if (!["owner", "admin"].includes(user.role)) {
    res.status(403).json({
      ok: false,
      message: "Launch evidence is available to owner and admin accounts only.",
    });
    return;
  }

  try {
    requirePlanEntitlement(user, "business.metrics");
    res.json({
      ok: true,
      evidence: buildLaunchEvidenceCenter(),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/admin/launch-evidence/export", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to export launch evidence.",
    });
    return;
  }

  if (!["owner", "admin"].includes(user.role)) {
    res.status(403).json({
      ok: false,
      message: "Launch evidence export is available to owner and admin accounts only.",
    });
    return;
  }

  try {
    requirePlanEntitlement(user, "business.metrics");
    const format = String(req.query.format || "json").trim().toLowerCase();
    const pack = buildLaunchEvidenceSignoffPack();
    const dateStamp = String(pack.generatedAt || new Date().toISOString()).slice(0, 10);

    if (format === "text" || format === "txt") {
      res.type("text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="stockflix-launch-evidence-${dateStamp}.txt"`);
      res.send(renderLaunchEvidenceSignoffText(pack));
      return;
    }

    if (format !== "json") {
      res.status(400).json({
        ok: false,
        message: "Unsupported launch evidence export format.",
      });
      return;
    }

    res.type("application/json");
    res.setHeader("Content-Disposition", `attachment; filename="stockflix-launch-evidence-${dateStamp}.json"`);
    res.send(JSON.stringify(pack, null, 2));
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/ops/readiness", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view operational readiness.",
    });
    return;
  }

  if (!["owner", "admin"].includes(user.role)) {
    res.status(403).json({
      ok: false,
      message: "Operational readiness is available to owner and admin accounts only.",
    });
    return;
  }

  try {
    requirePlanEntitlement(user, "business.metrics");
    res.json({
      ok: true,
      readiness: await operationalReadinessReport(),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/admin/users", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view team workspace.",
    });
    return;
  }

  if (!["owner", "admin", "advisor"].includes(user.role)) {
    res.status(403).json({
      ok: false,
      message: "Team workspace is available to owner, admin, and advisor accounts.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      users: await listWorkspaceUsers(user.id),
      policy: rolePolicy(user.role),
      entitlements: user.entitlements,
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.get("/admin/organizations", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to view workspaces.",
    });
    return;
  }

  if (!["owner", "admin", "advisor", "customer"].includes(user.role)) {
    res.status(403).json({
      ok: false,
      message: "Workspaces are not available for this account.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      organizations: await listOrganizations(user.id),
      policy: rolePolicy(user.role),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.post("/admin/organizations", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to create workspaces.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      organization: await createOrganization(user.id, req.body || {}),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.post("/admin/organizations/:organizationId", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to update workspaces.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      organization: await updateOrganization(user.id, req.params.organizationId, req.body || {}),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.post("/admin/users/:userId/role", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to update roles.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      user: await updateUserRole(user.id, req.params.userId, req.body?.role),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.post("/admin/users/:userId/organization", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to move workspace members.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      user: await moveUserToOrganization(user.id, req.params.userId, req.body?.organizationId || ""),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

router.post("/admin/users/:userId/advisor", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      ok: false,
      message: "Please sign in to assign advisors.",
    });
    return;
  }

  try {
    res.json({
      ok: true,
      user: await assignAdvisor(user.id, req.params.userId, req.body?.advisorId || ""),
    });
  } catch (error) {
    sendAuthError(res, error, 403);
  }
});

function sendAuthError(res, error, fallbackStatus = 400) {
  res.status(error.statusCode || fallbackStatus).json({
    ok: false,
    message: error.message,
    entitlement: error.code === "PLAN_UPGRADE_REQUIRED"
      ? {
        feature: error.feature,
        requiredPlanId: error.requiredPlanId,
        currentPlanId: error.currentPlanId,
      }
      : null,
  });
}

export default router;
