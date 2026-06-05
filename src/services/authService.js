import crypto from "crypto";
import { auditTrailReadinessReport } from "./auditTrailRepository.js";
import {
  createGatewayCheckoutSession,
  createStripeWebhookSignature,
  parseProviderPaymentWebhook,
  paymentGatewayAutoCompletesCheckout,
  paymentGatewayInfo,
} from "./paymentGatewayService.js";
import { readAppState, stateRepositoryInfo, writeAppState } from "./stateRepository.js";
import { buildStorageReadinessReport, stateSchemaManifest } from "./stateSchemaService.js";

const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;
const MAX_AUDIT_EVENTS = 1000;
const AUDIT_HASH_VERSION = "sha256-v1";
const ROLES = ["owner", "admin", "advisor", "customer"];
const ORGANIZATION_TYPES = ["platform", "client", "advisor", "customer"];
const PLATFORM_ORGANIZATION_ID = "org_platform";
const PAYMENT_SESSION_HOURS = 1;
const PAYMENT_EVENT_TYPES = ["payment.succeeded", "payment.failed"];
const PAYMENT_WEBHOOK_SIGNATURE_HEADER = "x-stockflix-signature";
const PAYMENT_WEBHOOK_TIMESTAMP_HEADER = "x-stockflix-timestamp";
const PAYMENT_WEBHOOK_SIGNATURE_VERSION = "v1";
const PAYMENT_WEBHOOK_TOLERANCE_SECONDS = 300;
const DEFAULT_PAYMENT_WEBHOOK_SECRET = "stockflix-local-webhook-secret";
const APPROVAL_STATUSES = ["pending", "approved", "rejected"];
const APPROVAL_ACTION_TYPES = ["portfolio_review", "rebalance", "buy_plan", "risk_action", "subscription_support", "other"];
const APPROVAL_RISK_LEVELS = ["low", "medium", "high"];
const ROLE_POLICIES = {
  owner: ["analysis", "business_metrics", "team_management", "role_management", "advisor_assignment", "billing", "audit_log", "organization_management", "approval_workflow"],
  admin: ["analysis", "business_metrics", "team_management", "advisor_assignment", "billing", "audit_log", "organization_management", "approval_workflow"],
  advisor: ["analysis", "client_workspace", "audit_log", "approval_workflow"],
  customer: ["analysis", "billing", "audit_log", "approval_workflow"],
};
const PLAN_TIERS = ["starter", "pro", "advisor"];
const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];
const FEATURE_POLICIES = {
  "analysis.run": {
    label: "Portfolio analysis",
    requiredPlanId: "starter",
    description: "Upload a watchlist or portfolio and generate the core investment report.",
  },
  "portfolio.snapshot": {
    label: "Saved portfolio snapshot",
    requiredPlanId: "starter",
    description: "Save the latest portfolio health snapshot after analysis.",
  },
  "screener.basic": {
    label: "Stock screener",
    requiredPlanId: "starter",
    description: "Filter recommended stocks from the latest analysis output.",
  },
  "billing.history": {
    label: "Billing history",
    requiredPlanId: "starter",
    description: "View invoices and payment sessions for the signed-in account.",
  },
  "audit.timeline": {
    label: "Activity timeline",
    requiredPlanId: "starter",
    description: "View account activity that belongs to the current workspace scope.",
  },
  "approval.decision": {
    label: "Approval decisions",
    requiredPlanId: "starter",
    description: "Approve or reject advisor requests that target the signed-in customer.",
  },
  "sector.analysis": {
    label: "Sector analysis",
    requiredPlanId: "pro",
    description: "Compare sector leaders, median valuation, profitability, and timing.",
  },
  "simulation.run": {
    label: "Strategy simulation",
    requiredPlanId: "pro",
    description: "Run historical buy/hold and strategy simulations.",
  },
  "advanced.action_plan": {
    label: "Advanced action plan",
    requiredPlanId: "pro",
    description: "Read action-level guidance for each holding and sector leader.",
  },
  "client.workspace": {
    label: "Client workspace",
    requiredPlanId: "advisor",
    description: "View assigned clients, workspaces, portfolios, and payment status.",
  },
  "approval.workflow": {
    label: "Advisor approval workflow",
    requiredPlanId: "advisor",
    description: "Create approval requests for assigned customer accounts.",
  },
  "business.metrics": {
    label: "Business dashboard",
    requiredPlanId: "advisor",
    description: "View SaaS operating metrics, plan mix, payment sessions, and revenue.",
  },
  "audit.integrity": {
    label: "Audit integrity",
    requiredPlanId: "advisor",
    description: "Review audit hash chain integrity and external audit trail readiness.",
  },
  "storage.readiness": {
    label: "Storage readiness",
    requiredPlanId: "advisor",
    description: "Review production database migration readiness.",
  },
  "organization.management": {
    label: "Workspace management",
    requiredPlanId: "advisor",
    description: "Create, update, and move members between workspaces.",
  },
  "role.management": {
    label: "Role management",
    requiredPlanId: "advisor",
    description: "Promote or demote users across owner, admin, advisor, and customer roles.",
  },
  "advisor.assignment": {
    label: "Advisor assignment",
    requiredPlanId: "advisor",
    description: "Assign advisors to customer accounts.",
  },
};

export async function createUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const state = await readState();
  if (state.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("This email is already registered.");
  }

  const now = new Date();
  const role = state.users.length === 0 ? "owner" : "customer";
  const userId = crypto.randomUUID();
  const organization = role === "owner"
    ? ensurePlatformOrganization(state, userName(name), now, userId)
    : createCustomerOrganization(state, userName(name), now, userId);
  const user = {
    id: userId,
    name: userName(name),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role,
    organizationId: organization.id,
    subscription: createTrialSubscription(now),
    createdAt: now.toISOString(),
    lastLoginAt: now.toISOString(),
  };

  state.users.push(user);
  appendAuditEvent(state, {
    actorUserId: user.id,
    action: "auth.register",
    targetUserId: user.id,
    details: {
      role: user.role,
      organization: organization.name,
      plan: user.subscription.plan,
      status: user.subscription.status,
    },
  });
  await writeState(state);
  const session = await createSession(user.id);

  return {
    user: publicUser(user),
    session,
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const state = await readState();
  const user = state.users.find((candidate) => candidate.email === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  user.lastLoginAt = new Date().toISOString();
  appendAuditEvent(state, {
    actorUserId: user.id,
    action: "auth.login",
    targetUserId: user.id,
    details: {
      role: normalizeRole(user.role),
    },
  });
  await writeState(state);
  const session = await createSession(user.id);

  return {
    user: publicUser(user),
    session,
  };
}

export async function logoutSession(sessionId) {
  if (!sessionId) {
    return;
  }

  const state = await readState();
  const session = state.sessions.find((candidate) => candidate.id === sessionId);
  if (session) {
    appendAuditEvent(state, {
      actorUserId: session.userId,
      action: "auth.logout",
      targetUserId: session.userId,
    });
  }
  state.sessions = state.sessions.filter((session) => session.id !== sessionId);
  await writeState(state);
}

export async function getUserFromRequest(req) {
  const sessionId = getSessionIdFromRequest(req);
  if (!sessionId) {
    return null;
  }

  const state = await readState();
  const session = state.sessions.find((candidate) => candidate.id === sessionId);
  if (!session || new Date(session.expiresAt) <= new Date()) {
    state.sessions = state.sessions.filter((candidate) => candidate.id !== sessionId);
    await writeState(state);
    return null;
  }

  const user = state.users.find((candidate) => candidate.id === session.userId);
  return user ? publicUser(user) : null;
}

export async function saveCustomerPortfolioSnapshot(userId, snapshot) {
  if (!userId) {
    return null;
  }

  const state = await readState();
  const user = state.users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  requirePlanEntitlement(user, "portfolio.snapshot");

  const now = new Date().toISOString();
  const summary = buildPortfolioSummary(snapshot.portfolioRows || []);
  const existing = state.portfolioSnapshots.find((item) => item.userId === userId);
  const organizationId = organizationIdForUser(state, userId);
  const nextSnapshot = {
    userId,
    organizationId,
    generatedAt: now,
    summary,
    portfolioRows: snapshot.portfolioRows || [],
    recommendations: (snapshot.recommendations || []).slice(0, 25),
    outputs: snapshot.outputs || {},
  };

  if (existing) {
    Object.assign(existing, nextSnapshot);
  } else {
    state.portfolioSnapshots.push(nextSnapshot);
  }

  appendAuditEvent(state, {
    actorUserId: userId,
    action: "analysis.snapshot_saved",
    targetUserId: userId,
    details: {
      holdings: summary.holdings,
      marketValue: Math.round(summary.marketValue),
      gainLossPct: Number(summary.gainLossPct.toFixed(2)),
      urgentActions: summary.urgentActions,
      recommendationCount: (snapshot.recommendations || []).length,
    },
  });
  await writeState(state);
  return nextSnapshot;
}

export async function getCustomerPortfolioSnapshot(userId) {
  if (!userId) {
    return null;
  }

  const state = await readState();
  const user = state.users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }
  requirePlanEntitlement(user, "portfolio.snapshot");

  return state.portfolioSnapshots.find((snapshot) => snapshot.userId === userId) || null;
}

export async function saveInvestorProfile(userId, profile) {
  if (!userId) {
    return null;
  }

  const state = await readState();
  const organizationId = organizationIdForUser(state, userId);
  const nextProfile = {
    userId,
    organizationId,
    goal: cleanChoice(profile.goal, ["wealth", "income", "retirement", "learning"], "wealth"),
    experience: cleanChoice(profile.experience, ["beginner", "intermediate", "advanced"], "beginner"),
    riskLevel: cleanChoice(profile.riskLevel, ["low", "medium", "high"], "medium"),
    monthlyBudget: clampNumber(profile.monthlyBudget, 0, 10000000),
    horizonYears: clampNumber(profile.horizonYears, 1, 50),
    updatedAt: new Date().toISOString(),
  };
  const existing = state.investorProfiles.find((item) => item.userId === userId);

  if (existing) {
    Object.assign(existing, nextProfile);
  } else {
    state.investorProfiles.push(nextProfile);
  }

  appendAuditEvent(state, {
    actorUserId: userId,
    action: "profile.update",
    targetUserId: userId,
    details: {
      goal: nextProfile.goal,
      experience: nextProfile.experience,
      riskLevel: nextProfile.riskLevel,
      horizonYears: nextProfile.horizonYears,
    },
  });
  await writeState(state);
  return nextProfile;
}

export async function getInvestorProfile(userId) {
  if (!userId) {
    return null;
  }

  const state = await readState();
  return state.investorProfiles.find((profile) => profile.userId === userId) || null;
}

export async function checkoutSubscription(userId, planId) {
  if (!userId) {
    return null;
  }

  const sessionResult = await createPaymentSession(userId, planId);
  if (!paymentGatewayAutoCompletesCheckout()) {
    return {
      ...sessionResult,
      billingEvent: null,
      webhookEvent: null,
      duplicate: false,
      redirectRequired: true,
      message: "Payment session created. Redirect the customer to the provider checkout URL.",
    };
  }

  return processPaymentWebhook(userId, {
    sessionId: sessionResult.paymentSession.id,
    eventType: "payment.succeeded",
    providerEventId: `evt_${sessionResult.paymentSession.id}_success`,
  });
}

export async function createPaymentSession(userId, planId) {
  if (!userId) {
    return null;
  }

  const plan = subscriptionPlans().find((candidate) => candidate.id === String(planId || "").toLowerCase());
  if (!plan) {
    throw new Error("Unknown subscription plan.");
  }

  const state = await readState();
  const user = state.users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const now = new Date();
  const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + PAYMENT_SESSION_HOURS);
  const paymentSession = {
    id: crypto.randomUUID(),
    userId: user.id,
    organizationId: user.organizationId || "",
    planId: plan.id,
    planName: plan.name,
    amountThb: plan.priceThb,
    currency: "THB",
    status: "pending",
    provider: "local_gateway",
    checkoutUrl: "",
    externalPaymentId: "",
    requiresRedirect: false,
    providerStatus: "",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    completedAt: "",
    failureReason: "",
    billingEventId: "",
    webhookEventIds: [],
  };
  const providerSession = await createGatewayCheckoutSession({
    paymentSession,
    plan,
    user,
  });
  Object.assign(paymentSession, providerSession);

  state.paymentSessions.push(paymentSession);
  appendAuditEvent(state, {
    actorUserId: user.id,
    action: "payment.session_created",
    targetUserId: user.id,
    details: {
      paymentSessionId: paymentSession.id,
      planId: plan.id,
      planName: plan.name,
      amountThb: plan.priceThb,
      status: paymentSession.status,
      provider: paymentSession.provider,
      externalPaymentId: paymentSession.externalPaymentId,
    },
  });
  await writeState(state);

  return {
    user: publicUser(user),
    paymentSession: publicPaymentSession(paymentSession),
  };
}

export async function processPaymentWebhook(actorUserId, input = {}) {
  const state = await readState();
  const actor = state.users.find((user) => user.id === actorUserId);
  if (!actor) {
    throw new Error("User not found.");
  }

  return processPaymentWebhookInState(state, input, {
    actor,
    requireAccessCheck: true,
    source: "authenticated_simulation",
    verification: {
      ok: true,
      status: "not_required",
      message: "Authenticated simulation webhook.",
      signatureVerified: false,
    },
  });
}

export async function processSignedPaymentWebhook(input = {}, options = {}) {
  const state = await readState();
  const verification = verifyPaymentWebhookSignature(input, options);

  if (!verification.ok) {
    const rejectedEvent = recordRejectedPaymentWebhook(state, input, verification);
    await writeState(state);
    const error = new Error(verification.message);
    error.webhookEvent = publicPaymentWebhookEvent(rejectedEvent);
    throw error;
  }

  if (!state.paymentSessions.some((session) => session.id === input.sessionId)) {
    const rejectedEvent = recordRejectedPaymentWebhook(state, input, {
      ...verification,
      ok: false,
      status: "invalid_session",
      message: "Payment session not found.",
      signatureVerified: true,
    });
    await writeState(state);
    const error = new Error("Payment session not found.");
    error.webhookEvent = publicPaymentWebhookEvent(rejectedEvent);
    throw error;
  }

  return processPaymentWebhookInState(state, input, {
    requireAccessCheck: false,
    source: "signed_gateway",
    verification,
  });
}

export async function processProviderPaymentWebhook(provider, options = {}) {
  const state = await readState();
  const parsed = parseProviderPaymentWebhook(provider, options);

  if (!parsed.verification.ok) {
    const rejectedEvent = recordRejectedPaymentWebhook(state, parsed.input, parsed.verification, {
      provider: parsed.provider,
      source: parsed.source,
    });
    await writeState(state);
    const error = new Error(parsed.verification.message);
    error.webhookEvent = publicPaymentWebhookEvent(rejectedEvent);
    throw error;
  }

  if (!state.paymentSessions.some((session) => session.id === parsed.input.sessionId)) {
    const rejectedEvent = recordRejectedPaymentWebhook(state, parsed.input, {
      ...parsed.verification,
      ok: false,
      status: "invalid_session",
      message: "Payment session not found.",
      signatureVerified: true,
    }, {
      provider: parsed.provider,
      source: parsed.source,
    });
    await writeState(state);
    const error = new Error("Payment session not found.");
    error.webhookEvent = publicPaymentWebhookEvent(rejectedEvent);
    throw error;
  }

  return processPaymentWebhookInState(state, parsed.input, {
    requireAccessCheck: false,
    source: parsed.source,
    verification: parsed.verification,
  });
}

export function createPaymentWebhookSignature(input = {}, timestamp = currentEpochSeconds()) {
  const normalizedTimestamp = normalizeWebhookTimestamp(timestamp);
  const signature = signPaymentWebhookPayload(input, normalizedTimestamp);

  return {
    algorithm: "hmac-sha256",
    signature,
    timestamp: String(normalizedTimestamp),
    signatureHeader: PAYMENT_WEBHOOK_SIGNATURE_HEADER,
    timestampHeader: PAYMENT_WEBHOOK_TIMESTAMP_HEADER,
    toleranceSeconds: PAYMENT_WEBHOOK_TOLERANCE_SECONDS,
  };
}

export { createStripeWebhookSignature };

async function processPaymentWebhookInState(state, input = {}, options = {}) {
  const actor = options.actor || null;
  const paymentSession = state.paymentSessions.find((session) => session.id === input.sessionId);
  if (!paymentSession) {
    throw new Error("Payment session not found.");
  }

  if (options.requireAccessCheck && !canAccessPaymentSession(state, actor, paymentSession)) {
    throw new Error("You do not have access to this payment session.");
  }

  const eventType = normalizePaymentEventType(input.eventType);
  const providerEventId = String(input.providerEventId || `${eventType}_${paymentSession.id}`).slice(0, 120);
  const existingEvent = state.paymentWebhookEvents.find((event) => event.providerEventId === providerEventId);
  if (existingEvent) {
    return {
      user: publicUser(state.users.find((user) => user.id === paymentSession.userId)),
      billingEvent: paymentSession.billingEventId
        ? state.billingEvents.find((event) => event.id === paymentSession.billingEventId) || null
        : null,
      paymentSession: publicPaymentSession(paymentSession),
      webhookEvent: publicPaymentWebhookEvent(existingEvent),
      duplicate: true,
    };
  }

  const now = new Date();
  const targetUser = state.users.find((user) => user.id === paymentSession.userId);
  const plan = subscriptionPlans().find((candidate) => candidate.id === paymentSession.planId);
  if (!targetUser || !plan) {
    throw new Error("Payment session target is invalid.");
  }

  const webhookEvent = {
    id: crypto.randomUUID(),
    providerEventId,
    sessionId: paymentSession.id,
    userId: targetUser.id,
    organizationId: paymentSession.organizationId || targetUser.organizationId || "",
    eventType,
    status: "processed",
    provider: paymentSession.provider,
    source: options.source || "authenticated_simulation",
    externalPaymentId: input.externalPaymentId || paymentSession.externalPaymentId || "",
    signatureVerified: Boolean(options.verification?.signatureVerified),
    verificationStatus: options.verification?.status || "not_required",
    signedAt: options.verification?.signedAt || "",
    signatureAgeSeconds: options.verification?.ageSeconds ?? null,
    createdAt: now.toISOString(),
    processedAt: now.toISOString(),
    message: "",
  };

  let billingEvent = paymentSession.billingEventId
    ? state.billingEvents.find((event) => event.id === paymentSession.billingEventId) || null
    : null;

  if (eventType === "payment.succeeded") {
    if (paymentSession.status !== "paid") {
      billingEvent = applyPaidSubscriptionFromSession(state, targetUser, paymentSession, plan, now);
      webhookEvent.message = "Payment succeeded and subscription activated.";
    } else {
      webhookEvent.message = "Payment session was already paid.";
    }
  } else {
    if (paymentSession.status !== "paid") {
      paymentSession.status = "failed";
      paymentSession.failureReason = String(input.failureReason || "Simulated payment failure.").slice(0, 160);
      paymentSession.completedAt = now.toISOString();
      webhookEvent.message = paymentSession.failureReason;
    } else {
      webhookEvent.message = "Paid payment session ignored failed event.";
    }
  }

  paymentSession.webhookEventIds ||= [];
  paymentSession.webhookEventIds.push(webhookEvent.id);
  state.paymentWebhookEvents.push(webhookEvent);
  appendAuditEvent(state, {
    actorUserId: actor?.id || "",
    action: eventType === "payment.succeeded" ? "payment.webhook_succeeded" : "payment.webhook_failed",
    targetUserId: targetUser.id,
    organizationId: paymentSession.organizationId || targetUser.organizationId || "",
    details: {
      paymentSessionId: paymentSession.id,
      providerEventId,
      planName: paymentSession.planName,
      amountThb: paymentSession.amountThb,
      status: paymentSession.status,
      provider: paymentSession.provider,
      externalPaymentId: webhookEvent.externalPaymentId,
      source: webhookEvent.source,
      verificationStatus: webhookEvent.verificationStatus,
      signatureVerified: webhookEvent.signatureVerified,
    },
  });
  await writeState(state);

  return {
    user: publicUser(targetUser),
    billingEvent,
    paymentSession: publicPaymentSession(paymentSession),
    webhookEvent: publicPaymentWebhookEvent(webhookEvent),
    duplicate: false,
  };
}

export async function getPaymentSessions(viewerUserId, options = {}) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  const visibleUserIds = usersVisibleToUser(state, viewer);
  const visibleOrganizationIds = organizationsVisibleToUser(state, viewer);
  const limit = clampNumber(options.limit || 30, 1, 100);
  return state.paymentSessions
    .filter((session) => visibleUserIds.has(session.userId) || visibleOrganizationIds.has(session.organizationId))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit)
    .map(publicPaymentSession);
}

export async function listApprovalRequests(viewerUserId, options = {}) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  const viewerRole = normalizeRole(viewer.role);
  requirePlanEntitlement(
    viewer,
    ["owner", "admin", "advisor"].includes(viewerRole) ? "approval.workflow" : "approval.decision",
  );

  const visibleUserIds = usersVisibleToUser(state, viewer);
  const visibleOrganizationIds = organizationsVisibleToUser(state, viewer);
  const limit = clampNumber(options.limit || 50, 1, 100);
  return state.approvalRequests
    .filter((request) => (
      visibleUserIds.has(request.customerId)
      || visibleUserIds.has(request.requestedByUserId)
      || visibleOrganizationIds.has(request.organizationId)
    ))
    .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
    .slice(0, limit)
    .map((request) => publicApprovalRequest(request, state));
}

export async function createApprovalRequest(actorUserId, input = {}) {
  const state = await readState();
  const actor = state.users.find((user) => user.id === actorUserId);
  if (!actor) {
    throw new Error("User not found.");
  }

  const actorRole = normalizeRole(actor.role);
  if (!["owner", "admin", "advisor"].includes(actorRole)) {
    throw new Error("Only owner, admin, or advisor accounts can request customer approval.");
  }
  requirePlanEntitlement(actor, "approval.workflow");

  const customer = state.users.find((user) => user.id === input.customerId);
  if (!customer || normalizeRole(customer.role) !== "customer") {
    throw new Error("Approval requests must target a customer account.");
  }

  if (actorRole === "advisor" && !canAdvisorAccessCustomer(state, actor.id, customer.id)) {
    throw new Error("Advisor can request approval only for assigned customers.");
  }

  const now = new Date().toISOString();
  const approvalRequest = {
    id: crypto.randomUUID(),
    customerId: customer.id,
    organizationId: customer.organizationId || organizationIdForUser(state, customer.id),
    requestedByUserId: actor.id,
    title: cleanApprovalTitle(input.title),
    summary: cleanApprovalSummary(input.summary),
    actionType: normalizeApprovalActionType(input.actionType),
    amountThb: clampNumber(input.amountThb, 0, 1000000000),
    riskLevel: normalizeApprovalRiskLevel(input.riskLevel),
    status: "pending",
    decisionNote: "",
    decidedByUserId: "",
    decidedAt: "",
    createdAt: now,
    updatedAt: now,
  };

  state.approvalRequests.push(approvalRequest);
  appendAuditEvent(state, {
    actorUserId: actor.id,
    action: "approval.request_created",
    targetUserId: customer.id,
    organizationId: approvalRequest.organizationId,
    details: approvalAuditDetails(approvalRequest),
  });
  await writeState(state);
  return publicApprovalRequest(approvalRequest, state);
}

export async function decideApprovalRequest(actorUserId, approvalId, input = {}) {
  const state = await readState();
  const actor = state.users.find((user) => user.id === actorUserId);
  if (!actor) {
    throw new Error("User not found.");
  }

  const approvalRequest = state.approvalRequests.find((request) => request.id === approvalId);
  if (!approvalRequest) {
    throw new Error("Approval request not found.");
  }

  if (approvalRequest.customerId !== actor.id) {
    throw new Error("Only the customer can approve or reject this request.");
  }
  requirePlanEntitlement(actor, "approval.decision");

  if (approvalRequest.status !== "pending") {
    throw new Error("This approval request has already been decided.");
  }

  const decision = normalizeApprovalStatus(input.decision || input.status);
  if (!["approved", "rejected"].includes(decision)) {
    throw new Error("Decision must be approved or rejected.");
  }

  const now = new Date().toISOString();
  approvalRequest.status = decision;
  approvalRequest.decisionNote = cleanApprovalSummary(input.note || input.decisionNote);
  approvalRequest.decidedByUserId = actor.id;
  approvalRequest.decidedAt = now;
  approvalRequest.updatedAt = now;

  appendAuditEvent(state, {
    actorUserId: actor.id,
    action: decision === "approved" ? "approval.request_approved" : "approval.request_rejected",
    targetUserId: approvalRequest.requestedByUserId || actor.id,
    organizationId: approvalRequest.organizationId,
    details: approvalAuditDetails(approvalRequest),
  });
  await writeState(state);
  return publicApprovalRequest(approvalRequest, state);
}

export async function tenantAccessSummary(viewerUserId) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  const visibleUserIds = usersVisibleToUser(state, viewer);
  const visibleOrganizationIds = organizationsVisibleToUser(state, viewer);
  const visibleUsers = state.users.filter((user) => visibleUserIds.has(user.id));
  const visibleOrganizations = state.organizations.filter((organization) => visibleOrganizationIds.has(organization.id));
  const recordVisible = (record) => visibleUserIds.has(record.userId) || visibleOrganizationIds.has(record.organizationId);
  const auditVisible = (event) => (
    visibleUserIds.has(event.actorUserId)
    || visibleUserIds.has(event.targetUserId)
    || visibleOrganizationIds.has(event.organizationId)
  );
  const tenantMetadata = tenantMetadataReport(state);

  return {
    viewer: publicUser(viewer),
    role: normalizeRole(viewer.role),
    ownOrganizationId: viewer.organizationId || "",
    visibleUserCount: visibleUserIds.size,
    visibleOrganizationCount: visibleOrganizationIds.size,
    dataScope: {
      portfolioSnapshots: state.portfolioSnapshots.filter(recordVisible).length,
      investorProfiles: state.investorProfiles.filter(recordVisible).length,
      billingEvents: state.billingEvents.filter(recordVisible).length,
      paymentSessions: state.paymentSessions.filter(recordVisible).length,
      paymentWebhookEvents: state.paymentWebhookEvents.filter(recordVisible).length,
      approvalRequests: state.approvalRequests.filter((record) => (
        visibleUserIds.has(record.customerId)
        || visibleUserIds.has(record.requestedByUserId)
        || visibleOrganizationIds.has(record.organizationId)
      )).length,
      auditEvents: state.auditEvents.filter(auditVisible).length,
    },
    visibleOrganizations: visibleOrganizations
      .map((organization) => publicOrganization(organization, state))
      .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
      .slice(0, 20),
    visibleUsers: buildWorkspaceUsers(visibleUsers, state).slice(0, 50),
    isolation: {
      status: tenantMetadata.totalMissingOrganizationId === 0 ? "ready" : "needs_attention",
      store: "local_file",
      productionDatabaseRequired: true,
      missingOrganizationId: tenantMetadata,
    },
  };
}

export async function getBillingHistory(userId) {
  if (!userId) {
    return [];
  }

  const state = await readState();
  return state.billingEvents
    .filter((event) => event.userId === userId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 20);
}

export async function getAuditEvents(viewerUserId, options = {}) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  const viewerRole = normalizeRole(viewer.role);
  requirePlanEntitlement(viewer, "audit.timeline");
  const limit = clampNumber(options.limit || 50, 1, 100);
  let events = state.auditEvents || [];

  if (!["owner", "admin"].includes(viewerRole)) {
    const visibleUserIds = usersVisibleToUser(state, viewer);
    const visibleOrganizationIds = organizationsVisibleToUser(state, viewer);

    events = events.filter((event) => (
      visibleUserIds.has(event.actorUserId)
      || visibleUserIds.has(event.targetUserId)
      || visibleOrganizationIds.has(event.organizationId)
    ));
  }

  return events
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit)
    .map(publicAuditEvent);
}

export async function auditIntegritySummary(viewerUserId) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  if (!["owner", "admin"].includes(normalizeRole(viewer.role))) {
    throw new Error("Audit integrity is available to owner and admin accounts only.");
  }
  requirePlanEntitlement(viewer, "audit.integrity");

  return auditIntegrityReport(state.auditEvents);
}

export async function auditTrailSummary(viewerUserId) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  if (!["owner", "admin"].includes(normalizeRole(viewer.role))) {
    throw new Error("External audit trail status is available to owner and admin accounts only.");
  }
  requirePlanEntitlement(viewer, "audit.integrity");

  return auditTrailReadinessReport(state.auditEvents);
}

export async function storageReadinessSummary(viewerUserId) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  if (!["owner", "admin"].includes(normalizeRole(viewer.role))) {
    throw new Error("Storage readiness is available to owner and admin accounts only.");
  }
  requirePlanEntitlement(viewer, "storage.readiness");

  return {
    currentStore: stateRepositoryInfo(),
    schema: stateSchemaManifest(),
    readiness: buildStorageReadinessReport(state),
  };
}

export async function recordAuditEvent(event) {
  if (!event?.action) {
    return null;
  }

  const state = await readState();
  const auditEvent = appendAuditEvent(state, event);
  await writeState(state);
  return publicAuditEvent(auditEvent);
}

export async function listOrganizations(viewerUserId) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  if (normalizeRole(viewer.role) === "advisor") {
    requirePlanEntitlement(viewer, "client.workspace");
  }

  const visibleOrganizationIds = organizationsVisibleToUser(state, viewer);
  return state.organizations
    .filter((organization) => visibleOrganizationIds.has(organization.id))
    .map((organization) => publicOrganization(organization, state))
    .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt));
}

export async function createOrganization(actorUserId, input = {}) {
  const state = await readState();
  const actor = requireOrganizationManager(state, actorUserId);
  const now = new Date();
  const organization = {
    id: crypto.randomUUID(),
    name: cleanOrganizationName(input.name),
    type: normalizeOrganizationType(input.type || "client"),
    ownerUserId: state.users.some((user) => user.id === input.ownerUserId) ? input.ownerUserId : "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  state.organizations.push(organization);
  appendAuditEvent(state, {
    actorUserId: actor.id,
    action: "organization.create",
    targetUserId: organization.ownerUserId || actor.id,
    details: {
      organizationId: organization.id,
      organizationName: organization.name,
      organizationType: organization.type,
    },
  });
  await writeState(state);
  return publicOrganization(organization, state);
}

export async function updateOrganization(actorUserId, organizationId, input = {}) {
  const state = await readState();
  const actor = requireOrganizationManager(state, actorUserId);
  const organization = state.organizations.find((candidate) => candidate.id === organizationId);
  if (!organization) {
    throw new Error("Workspace not found.");
  }

  const previous = {
    name: organization.name,
    type: organization.type,
  };
  organization.name = cleanOrganizationName(input.name || organization.name);
  organization.type = organization.id === PLATFORM_ORGANIZATION_ID
    ? "platform"
    : normalizeOrganizationType(input.type || organization.type);
  organization.updatedAt = new Date().toISOString();

  appendAuditEvent(state, {
    actorUserId: actor.id,
    action: "organization.update",
    targetUserId: organization.ownerUserId || actor.id,
    details: {
      organizationId: organization.id,
      previousName: previous.name,
      nextName: organization.name,
      previousType: previous.type,
      nextType: organization.type,
    },
  });
  await writeState(state);
  return publicOrganization(organization, state);
}

export async function moveUserToOrganization(actorUserId, targetUserId, organizationId) {
  const state = await readState();
  const actor = requireOrganizationManager(state, actorUserId);
  const target = state.users.find((user) => user.id === targetUserId);
  const organization = state.organizations.find((candidate) => candidate.id === organizationId);
  if (!target) {
    throw new Error("Target user not found.");
  }
  if (!organization) {
    throw new Error("Workspace not found.");
  }

  const previousOrganization = state.organizations.find((candidate) => candidate.id === target.organizationId);
  target.organizationId = organization.id;
  organization.updatedAt = new Date().toISOString();

  appendAuditEvent(state, {
    actorUserId: actor.id,
    action: "organization.member_move",
    targetUserId: target.id,
    details: {
      previousOrganization: previousOrganization?.name || "",
      nextOrganization: organization.name,
      organizationId: organization.id,
    },
  });
  await writeState(state);
  return buildWorkspaceUsers([target], state)[0];
}

export async function listWorkspaceUsers(viewerUserId) {
  const state = await readState();
  const viewer = state.users.find((user) => user.id === viewerUserId);
  if (!viewer) {
    throw new Error("User not found.");
  }

  const viewerRole = normalizeRole(viewer.role);
  if (viewerRole === "advisor") {
    requirePlanEntitlement(viewer, "client.workspace");
  }

  if (["owner", "admin"].includes(viewerRole)) {
    return buildWorkspaceUsers(state.users, state);
  }

  if (viewerRole === "advisor") {
    const assignedCustomerIds = new Set(state.advisorAssignments
      .filter((assignment) => assignment.advisorId === viewer.id)
      .map((assignment) => assignment.customerId));
    const users = state.users.filter((user) => user.id === viewer.id || assignedCustomerIds.has(user.id));
    return buildWorkspaceUsers(users, state);
  }

  return buildWorkspaceUsers([viewer], state);
}

export async function updateUserRole(actorUserId, targetUserId, nextRole) {
  const state = await readState();
  const actor = state.users.find((user) => user.id === actorUserId);
  const target = state.users.find((user) => user.id === targetUserId);
  const role = normalizeRole(nextRole);

  if (!actor || normalizeRole(actor.role) !== "owner") {
    throw new Error("Only owner can change user roles.");
  }
  requirePlanEntitlement(actor, "role.management");

  if (!target) {
    throw new Error("Target user not found.");
  }

  const ownerCount = state.users.filter((user) => normalizeRole(user.role) === "owner").length;
  if (normalizeRole(target.role) === "owner" && role !== "owner" && ownerCount <= 1) {
    throw new Error("At least one owner is required.");
  }

  const previousRole = normalizeRole(target.role);
  target.role = role;
  if (role !== "advisor") {
    state.advisorAssignments = state.advisorAssignments.filter((assignment) => assignment.advisorId !== target.id);
  }

  appendAuditEvent(state, {
    actorUserId: actor.id,
    action: "team.role_update",
    targetUserId: target.id,
    details: {
      previousRole,
      nextRole: role,
    },
  });
  await writeState(state);
  return buildWorkspaceUsers([target], state)[0];
}

export async function assignAdvisor(actorUserId, customerId, advisorId) {
  const state = await readState();
  const actor = state.users.find((user) => user.id === actorUserId);
  const customer = state.users.find((user) => user.id === customerId);
  const advisor = advisorId ? state.users.find((user) => user.id === advisorId) : null;

  if (!actor || !["owner", "admin"].includes(normalizeRole(actor.role))) {
    throw new Error("Only owner or admin can assign advisors.");
  }
  requirePlanEntitlement(actor, "advisor.assignment");

  if (!customer || normalizeRole(customer.role) !== "customer") {
    throw new Error("Advisor can only be assigned to customer accounts.");
  }

  const previousAssignment = state.advisorAssignments.find((assignment) => assignment.customerId === customer.id);
  const previousAdvisor = previousAssignment
    ? state.users.find((user) => user.id === previousAssignment.advisorId)
    : null;

  if (!advisorId) {
    state.advisorAssignments = state.advisorAssignments.filter((assignment) => assignment.customerId !== customer.id);
    appendAuditEvent(state, {
      actorUserId: actor.id,
      action: "team.advisor_unassigned",
      targetUserId: customer.id,
      details: {
        previousAdvisorEmail: previousAdvisor?.email || "",
      },
    });
    await writeState(state);
    return buildWorkspaceUsers([customer], state)[0];
  }

  if (!advisor || !["advisor", "admin", "owner"].includes(normalizeRole(advisor.role))) {
    throw new Error("Advisor must be an advisor, admin, or owner account.");
  }

  const now = new Date().toISOString();
  const existing = state.advisorAssignments.find((assignment) => assignment.customerId === customer.id);
  const assignment = {
    customerId: customer.id,
    advisorId: advisor.id,
    assignedBy: actor.id,
    assignedAt: now,
  };

  if (existing) {
    Object.assign(existing, assignment);
  } else {
    state.advisorAssignments.push(assignment);
  }

  appendAuditEvent(state, {
    actorUserId: actor.id,
    action: existing ? "team.advisor_reassigned" : "team.advisor_assigned",
    targetUserId: customer.id,
    details: {
      advisorEmail: advisor.email,
      previousAdvisorEmail: previousAdvisor?.email || "",
    },
  });
  await writeState(state);
  return buildWorkspaceUsers([customer], state)[0];
}

export async function businessMetrics() {
  const state = await readState();
  const activeSessions = state.sessions.filter((session) => new Date(session.expiresAt) > new Date()).length;
  const plans = subscriptionPlans();
  const usersByPlan = state.users.reduce((counts, user) => {
    const plan = user.subscription?.plan || "Unknown";
    counts[plan] = (counts[plan] || 0) + 1;
    return counts;
  }, {});
  const usersByRole = state.users.reduce((counts, user) => {
    const role = normalizeRole(user.role);
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {});
  const paidUsers = state.users.filter((user) => user.subscription?.status === "active").length;
  const trialUsers = state.users.filter((user) => user.subscription?.status === "trialing").length;
  const mrrEstimate = state.users
    .filter((user) => user.subscription?.status === "active")
    .reduce((total, user) => total + numberValue(user.subscription?.priceThb), 0);
  const trialMrrPotential = state.users
    .filter((user) => user.subscription?.status === "trialing")
    .reduce((total, user) => total + numberValue(user.subscription?.priceThb), 0);
  const revenueCollected = state.billingEvents
    .filter((event) => event.status === "paid")
    .reduce((total, event) => total + numberValue(event.amountThb), 0);
  const pendingPaymentSessions = state.paymentSessions.filter((session) => session.status === "pending").length;
  const failedPaymentSessions = state.paymentSessions.filter((session) => session.status === "failed").length;
  const approvalRequestsByStatus = state.approvalRequests.reduce((counts, request) => {
    const status = normalizeApprovalStatus(request.status);
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  const tenantMetadata = tenantMetadataReport(state);
  const auditIntegrity = auditIntegrityReport(state.auditEvents);
  const auditTrail = await auditTrailReadinessReport(state.auditEvents);
  const storageReadiness = buildStorageReadinessReport(state);
  const paymentGateway = paymentGatewayInfo();
  const rejectedWebhookEvents = state.paymentWebhookEvents.filter((event) => event.status === "rejected").length;
  const verifiedWebhookEvents = state.paymentWebhookEvents.filter((event) => event.signatureVerified).length;
  const organizationSummaries = state.organizations
    .map((organization) => publicOrganization(organization, state))
    .sort((left, right) => numberValue(right.revenueCollected) - numberValue(left.revenueCollected));
  const organizationsByType = organizationSummaries.reduce((counts, organization) => {
    counts[organization.type] = (counts[organization.type] || 0) + 1;
    return counts;
  }, {});

  return {
    users: state.users.length,
    activeSessions,
    paidUsers,
    trials: trialUsers,
    savedPortfolios: state.portfolioSnapshots.length,
    completedProfiles: state.investorProfiles.length,
    mrrEstimate,
    trialMrrPotential,
    revenueCollected,
    pendingPaymentSessions,
    failedPaymentSessions,
    approvalRequests: state.approvalRequests.length,
    pendingApprovalRequests: approvalRequestsByStatus.pending || 0,
    approvedApprovalRequests: approvalRequestsByStatus.approved || 0,
    rejectedApprovalRequests: approvalRequestsByStatus.rejected || 0,
    approvalRequestsByStatus,
    webhookEvents: state.paymentWebhookEvents.length,
    rejectedWebhookEvents,
    verifiedWebhookEvents,
    webhookSecurity: {
      signedEndpoint: "/api/payment/webhook/local-gateway",
      providerEndpoint: paymentGateway.providerWebhookEndpoint,
      signatureHeader: PAYMENT_WEBHOOK_SIGNATURE_HEADER,
      timestampHeader: PAYMENT_WEBHOOK_TIMESTAMP_HEADER,
      toleranceSeconds: PAYMENT_WEBHOOK_TOLERANCE_SECONDS,
      secretConfigured: Boolean(process.env.PAYMENT_WEBHOOK_SECRET),
    },
    paymentGateway,
    tenantMetadata,
    auditIntegrity,
    auditTrail: {
      status: auditTrail.status,
      adapter: auditTrail.adapter,
      version: auditTrail.version,
      stateEvents: auditTrail.stateEvents,
      trailEvents: auditTrail.trailEvents,
      invalidLineCount: auditTrail.invalidLineCount,
      missingFromTrailCount: auditTrail.missingFromTrailCount,
      extraInTrailCount: auditTrail.extraInTrailCount,
      duplicateTrailIdCount: auditTrail.duplicateTrailIdCount,
      external: auditTrail.external,
    },
    storageReadiness: {
      schemaVersion: storageReadiness.schemaVersion,
      status: storageReadiness.status,
      totalRecords: storageReadiness.totalRecords,
      collectionCount: storageReadiness.collectionCount,
      blockerCount: storageReadiness.blockerCount,
      warningCount: storageReadiness.warningCount,
      issues: storageReadiness.issues.slice(0, 10),
    },
    arpu: paidUsers ? mrrEstimate / paidUsers : 0,
    usersByPlan,
    usersByRole,
    organizations: state.organizations.length,
    organizationsByType,
    customerWorkspaces: organizationSummaries.filter((organization) => ["customer", "client"].includes(organization.type)).length,
    platformMembers: state.users.filter((user) => user.organizationId === PLATFORM_ORGANIZATION_ID).length,
    recentOrganizations: organizationSummaries.slice(0, 10),
    advisorAssignments: state.advisorAssignments.length,
    auditEvents: state.auditEvents.length,
    plans,
    recentAuditEvents: state.auditEvents
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 10)
      .map(publicAuditEvent),
    recentBillingEvents: state.billingEvents
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 10),
    recentPaymentSessions: state.paymentSessions
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 10)
      .map(publicPaymentSession),
    recentPaymentWebhookEvents: state.paymentWebhookEvents
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 10)
      .map(publicPaymentWebhookEvent),
    recentApprovalRequests: state.approvalRequests
      .slice()
      .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
      .slice(0, 10)
      .map((request) => publicApprovalRequest(request, state)),
  };
}

export function getSessionIdFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[SESSION_COOKIE] || "";
}

export function setSessionCookie(res, session) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${session.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`);
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function subscriptionPlans() {
  return [
    {
      id: "starter",
      name: "Starter",
      priceThb: 790,
      billing: "monthly",
      bestFor: "New investors who need a simple portfolio health check.",
      features: ["Portfolio health check", "Stock screener", "Excel report", "Activity timeline"],
      entitlements: planFeatureIds("starter"),
      limits: {
        clientWorkspaces: 0,
        advisorSeats: 0,
      },
    },
    {
      id: "pro",
      name: "Pro",
      priceThb: 1490,
      billing: "monthly",
      highlighted: true,
      bestFor: "Active investors who want simulation and sector intelligence.",
      features: ["Everything in Starter", "Strategy simulation", "Sector leaders", "Action plan per holding"],
      entitlements: planFeatureIds("pro"),
      limits: {
        clientWorkspaces: 0,
        advisorSeats: 0,
      },
    },
    {
      id: "advisor",
      name: "Advisor",
      priceThb: 3990,
      billing: "monthly",
      bestFor: "Advisors and teams who manage client portfolios.",
      features: ["Everything in Pro", "Client portfolio workspace", "Approval workflow", "Business dashboard", "Production readiness"],
      entitlements: planFeatureIds("advisor"),
      limits: {
        clientWorkspaces: 50,
        advisorSeats: 5,
      },
    },
  ];
}

export function rolePolicy(role) {
  const normalizedRole = normalizeRole(role);
  return {
    role: normalizedRole,
    permissions: ROLE_POLICIES[normalizedRole] || ROLE_POLICIES.customer,
    roles: ROLES,
    entitlementCatalog: entitlementPolicy(),
  };
}

export function entitlementPolicy() {
  return Object.keys(FEATURE_POLICIES).map(publicFeaturePolicy);
}

export function subscriptionEntitlementSummary(user) {
  const role = normalizeRole(user?.role);
  const subscription = normalizeSubscription(user?.subscription || {}, user?.createdAt);
  const plan = planById(subscription.planId);
  const subscriptionActive = ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);
  const packageFeatureIds = planFeatureIds(plan.id);
  const operationalOverride = ["owner", "admin"].includes(role);
  const effectiveFeatureIds = operationalOverride
    ? Object.keys(FEATURE_POLICIES)
    : subscriptionActive
      ? packageFeatureIds
      : [];
  const effectiveFeatureSet = new Set(effectiveFeatureIds);
  const lockedFeatures = Object.keys(FEATURE_POLICIES)
    .filter((featureId) => !effectiveFeatureSet.has(featureId))
    .map(publicFeaturePolicy);

  return {
    planId: plan.id,
    planName: plan.name,
    status: subscription.status,
    active: subscriptionActive,
    operationalOverride,
    packageFeatures: packageFeatureIds,
    effectiveFeatures: effectiveFeatureIds,
    lockedFeatures,
    upgradeTargets: subscriptionPlans()
      .filter((candidate) => planRank(candidate.id) > planRank(plan.id))
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        priceThb: candidate.priceThb,
      })),
  };
}

export function hasPlanEntitlement(user, featureId) {
  return evaluatePlanEntitlement(user, featureId).allowed;
}

export function requirePlanEntitlement(user, featureId) {
  const check = evaluatePlanEntitlement(user, featureId);
  if (check.allowed) {
    return check;
  }

  const error = new Error(check.message);
  error.code = "PLAN_UPGRADE_REQUIRED";
  error.statusCode = 402;
  error.feature = check.feature;
  error.requiredPlanId = check.requiredPlanId;
  error.currentPlanId = check.currentPlanId;
  throw error;
}

function evaluatePlanEntitlement(user, featureId) {
  const feature = FEATURE_POLICIES[featureId];
  if (!feature) {
    return {
      allowed: false,
      feature: {
        id: featureId,
        label: featureId,
        requiredPlanId: "advisor",
      },
      requiredPlanId: "advisor",
      currentPlanId: currentSubscriptionPlanId(user?.subscription),
      message: `Unknown entitlement: ${featureId}`,
    };
  }

  const role = normalizeRole(user?.role);
  const subscription = normalizeSubscription(user?.subscription || {}, user?.createdAt);
  const plan = planById(subscription.planId);
  const subscriptionActive = ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);
  const operationalOverride = ["owner", "admin"].includes(role);
  const packageAllowed = subscriptionActive && planRank(plan.id) >= planRank(feature.requiredPlanId);
  const allowed = operationalOverride || packageAllowed;
  const requiredPlan = planById(feature.requiredPlanId);

  return {
    allowed,
    operationalOverride,
    subscriptionActive,
    currentPlanId: plan.id,
    requiredPlanId: requiredPlan.id,
    feature: publicFeaturePolicy(featureId),
    message: allowed
      ? ""
      : `${feature.label} requires the ${requiredPlan.name} plan or higher.`,
  };
}

function publicFeaturePolicy(featureId) {
  const feature = FEATURE_POLICIES[featureId] || {};
  const requiredPlan = planById(feature.requiredPlanId || "advisor");
  return {
    id: featureId,
    label: feature.label || featureId,
    description: feature.description || "",
    requiredPlanId: requiredPlan.id,
    requiredPlanName: requiredPlan.name,
  };
}

function planFeatureIds(planId) {
  const normalizedPlanId = normalizePlanId(planId);
  const tier = planRank(normalizedPlanId);
  return Object.keys(FEATURE_POLICIES).filter((featureId) => (
    planRank(FEATURE_POLICIES[featureId].requiredPlanId) <= tier
  ));
}

function planById(planId) {
  const normalizedPlanId = normalizePlanId(planId);
  return subscriptionPlans().find((plan) => plan.id === normalizedPlanId)
    || subscriptionPlans().find((plan) => plan.id === "pro");
}

function planRank(planId) {
  const index = PLAN_TIERS.indexOf(normalizePlanId(planId));
  return index >= 0 ? index : PLAN_TIERS.indexOf("pro");
}

function currentSubscriptionPlanId(subscription = {}) {
  return normalizePlanId(subscription.planId || subscription.plan || "pro");
}

function normalizePlanId(planId) {
  const normalized = String(planId || "").trim().toLowerCase();
  if (PLAN_TIERS.includes(normalized)) {
    return normalized;
  }

  if (normalized.includes("starter")) return "starter";
  if (normalized.includes("advisor")) return "advisor";
  if (normalized.includes("pro")) return "pro";
  return "pro";
}

function normalizeSubscriptionStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["active", "trialing", "past_due", "canceled", "failed", "inactive"].includes(normalized)) {
    return normalized;
  }

  return "trialing";
}

function normalizeSubscription(subscription = {}, fallbackDate = new Date().toISOString()) {
  const plan = planById(currentSubscriptionPlanId(subscription));
  const baseDate = new Date(fallbackDate || Date.now());
  const trialEndsAt = new Date(baseDate);
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  const renewsAt = new Date(baseDate);
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  return {
    ...subscription,
    plan: plan.name,
    planId: plan.id,
    status: normalizeSubscriptionStatus(subscription.status),
    priceThb: numberValue(subscription.priceThb || plan.priceThb),
    billing: subscription.billing || plan.billing,
    trialEndsAt: subscription.trialEndsAt || trialEndsAt.toISOString(),
    renewsAt: subscription.renewsAt || renewsAt.toISOString(),
  };
}

async function createSession(userId) {
  const state = await readState();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  const session = {
    id: crypto.randomBytes(32).toString("hex"),
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  state.sessions = state.sessions.filter((candidate) => new Date(candidate.expiresAt) > new Date());
  state.sessions.push(session);
  await writeState(state);
  return session;
}

async function readState() {
  return readAppState({ normalize: normalizeState });
}

async function writeState(state) {
  await writeAppState(state);
}

function publicUser(user) {
  const role = normalizeRole(user.role);
  const subscription = normalizeSubscription(user.subscription || {}, user.createdAt);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    organizationId: user.organizationId || "",
    permissions: ROLE_POLICIES[role] || ROLE_POLICIES.customer,
    subscription,
    entitlements: subscriptionEntitlementSummary({
      ...user,
      role,
      subscription,
    }),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function publicOrganization(organization, state) {
  const members = state.users.filter((user) => user.organizationId === organization.id);
  const memberIds = new Set(members.map((user) => user.id));
  const paidMembers = members.filter((user) => user.subscription?.status === "active");
  const owner = state.users.find((user) => user.id === organization.ownerUserId);
  const revenueCollected = state.billingEvents
    .filter((event) => recordBelongsToOrganization(event, organization.id, memberIds) && event.status === "paid")
    .reduce((total, event) => total + numberValue(event.amountThb), 0);
  const savedPortfolios = state.portfolioSnapshots.filter((snapshot) => recordBelongsToOrganization(snapshot, organization.id, memberIds)).length;

  return {
    id: organization.id,
    name: organization.name,
    type: normalizeOrganizationType(organization.type),
    ownerUserId: organization.ownerUserId || "",
    ownerName: owner?.name || "",
    ownerEmail: owner?.email || "",
    memberCount: members.length,
    customerCount: members.filter((user) => normalizeRole(user.role) === "customer").length,
    advisorCount: members.filter((user) => normalizeRole(user.role) === "advisor").length,
    paidMembers: paidMembers.length,
    revenueCollected,
    savedPortfolios,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt || organization.createdAt,
  };
}

function publicPaymentSession(session) {
  return {
    id: session.id,
    userId: session.userId || "",
    organizationId: session.organizationId || "",
    planId: session.planId || "",
    planName: session.planName || "",
    amountThb: numberValue(session.amountThb),
    currency: session.currency || "THB",
    status: normalizePaymentSessionStatus(session.status),
    provider: session.provider || "local_gateway",
    checkoutUrl: session.checkoutUrl || "",
    externalPaymentId: session.externalPaymentId || "",
    requiresRedirect: Boolean(session.requiresRedirect),
    providerStatus: session.providerStatus || "",
    createdAt: session.createdAt,
    expiresAt: session.expiresAt || "",
    completedAt: session.completedAt || "",
    failureReason: session.failureReason || "",
    billingEventId: session.billingEventId || "",
    webhookEventCount: (session.webhookEventIds || []).length,
  };
}

function publicApprovalRequest(request, state) {
  const customer = state.users.find((user) => user.id === request.customerId);
  const requester = state.users.find((user) => user.id === request.requestedByUserId);
  const decider = state.users.find((user) => user.id === request.decidedByUserId);

  return {
    id: request.id,
    customerId: request.customerId || "",
    customerName: customer?.name || "",
    customerEmail: customer?.email || "",
    organizationId: request.organizationId || customer?.organizationId || "",
    requestedByUserId: request.requestedByUserId || "",
    requestedByName: requester?.name || "",
    requestedByEmail: requester?.email || "",
    title: cleanApprovalTitle(request.title),
    summary: cleanApprovalSummary(request.summary),
    actionType: normalizeApprovalActionType(request.actionType),
    amountThb: numberValue(request.amountThb),
    riskLevel: normalizeApprovalRiskLevel(request.riskLevel),
    status: normalizeApprovalStatus(request.status),
    decisionNote: cleanApprovalSummary(request.decisionNote),
    decidedByUserId: request.decidedByUserId || "",
    decidedByName: decider?.name || "",
    decidedByEmail: decider?.email || "",
    decidedAt: request.decidedAt || "",
    createdAt: request.createdAt,
    updatedAt: request.updatedAt || request.createdAt,
  };
}

function publicPaymentWebhookEvent(event) {
  return {
    id: event.id,
    providerEventId: event.providerEventId || "",
    sessionId: event.sessionId || "",
    userId: event.userId || "",
    organizationId: event.organizationId || "",
    eventType: normalizePaymentEventType(event.eventType),
    status: event.status || "processed",
    provider: event.provider || "local_gateway",
    source: event.source || "authenticated_simulation",
    externalPaymentId: event.externalPaymentId || "",
    signatureVerified: Boolean(event.signatureVerified),
    verificationStatus: event.verificationStatus || "not_required",
    signedAt: event.signedAt || "",
    signatureAgeSeconds: event.signatureAgeSeconds ?? null,
    createdAt: event.createdAt,
    processedAt: event.processedAt || "",
    message: event.message || "",
  };
}

function publicAuditEvent(event) {
  const eventHash = event.eventHash || "";
  return {
    id: event.id,
    action: normalizeAuditAction(event.action),
    actorUserId: event.actorUserId || "",
    actorName: event.actorName || "",
    actorEmail: event.actorEmail || "",
    targetUserId: event.targetUserId || "",
    targetName: event.targetName || "",
    targetEmail: event.targetEmail || "",
    organizationId: event.organizationId || "",
    integrityVersion: event.integrityVersion || AUDIT_HASH_VERSION,
    previousHash: event.previousHash || "",
    eventHash,
    hashPreview: eventHash ? eventHash.slice(0, 12) : "",
    details: sanitizeAuditDetails(event.details || {}),
    createdAt: event.createdAt,
  };
}

function appendAuditEvent(state, event) {
  state.auditEvents ||= [];
  const actor = state.users.find((user) => user.id === event.actorUserId);
  const target = state.users.find((user) => user.id === (event.targetUserId || event.actorUserId));
  const explicitOrganizationId = resolveAuditOrganizationId(state, event);
  const previousHash = state.auditEvents.at(-1)?.eventHash || "";
  const auditEvent = {
    id: crypto.randomUUID(),
    action: normalizeAuditAction(event.action),
    actorUserId: actor?.id || event.actorUserId || "",
    actorName: actor?.name || "",
    actorEmail: actor?.email || "",
    targetUserId: target?.id || event.targetUserId || event.actorUserId || "",
    targetName: target?.name || "",
    targetEmail: target?.email || "",
    organizationId: explicitOrganizationId || target?.organizationId || actor?.organizationId || "",
    integrityVersion: AUDIT_HASH_VERSION,
    previousHash,
    details: sanitizeAuditDetails(event.details || {}),
    createdAt: new Date().toISOString(),
  };
  auditEvent.eventHash = hashAuditEvent(auditEvent);

  state.auditEvents.push(auditEvent);
  if (state.auditEvents.length > MAX_AUDIT_EVENTS) {
    state.auditEvents = state.auditEvents.slice(-MAX_AUDIT_EVENTS);
  }

  return auditEvent;
}

function createTrialSubscription(now) {
  const plan = planById("pro");
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  const renewsAt = new Date(now);
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  return {
    plan: plan.name,
    planId: plan.id,
    status: "trialing",
    priceThb: plan.priceThb,
    billing: plan.billing,
    trialEndsAt: trialEndsAt.toISOString(),
    renewsAt: renewsAt.toISOString(),
  };
}

function buildPortfolioSummary(rows) {
  const marketValue = sum(rows, "Market_Value");
  const costValue = sum(rows, "Cost_Value");
  const gainLoss = sum(rows, "Gain_Loss_Value");
  const gainLossPct = costValue ? (gainLoss / costValue) * 100 : 0;
  const avgScore = rows.length ? sum(rows, "Total_Score") / rows.length : 0;
  const urgentActions = rows.filter((row) => /Exit|Reduce|Sell/i.test(String(row.Target_Action || row.Advice || ""))).length;

  return {
    holdings: rows.length,
    marketValue,
    costValue,
    gainLoss,
    gainLossPct,
    avgScore,
    urgentActions,
  };
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + numberValue(row[key]), 0);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) {
    return false;
  }

  const candidate = crypto.pbkdf2Sync(password || "", salt, 120000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function parseCookies(header) {
  return Object.fromEntries(header
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex === -1) {
        return [cookie, ""];
      }

      return [
        decodeURIComponent(cookie.slice(0, separatorIndex)),
        decodeURIComponent(cookie.slice(separatorIndex + 1)),
      ];
    }));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanChoice(value, allowedValues, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function clampNumber(value, min, max) {
  const number = numberValue(value);
  return Math.max(min, Math.min(max, number));
}

function verifyPaymentWebhookSignature(input = {}, options = {}) {
  const signature = normalizeWebhookSignature(options.signature || input.signature);
  const timestamp = normalizeWebhookTimestamp(options.timestamp || input.timestamp);
  const ageSeconds = Math.abs(currentEpochSeconds() - timestamp);

  if (!signature) {
    return webhookVerificationResult("missing_signature", "Webhook signature is required.", timestamp, ageSeconds, false);
  }

  if (!timestamp) {
    return webhookVerificationResult("missing_timestamp", "Webhook timestamp is required.", timestamp, ageSeconds, false);
  }

  if (ageSeconds > PAYMENT_WEBHOOK_TOLERANCE_SECONDS) {
    return webhookVerificationResult("stale_timestamp", "Webhook timestamp is outside the allowed tolerance.", timestamp, ageSeconds, false);
  }

  const expected = signPaymentWebhookPayload(input, timestamp);
  if (!secureCompare(signature, expected)) {
    return webhookVerificationResult("invalid_signature", "Webhook signature is invalid.", timestamp, ageSeconds, false);
  }

  return webhookVerificationResult("verified", "Webhook signature verified.", timestamp, ageSeconds, true);
}

function webhookVerificationResult(status, message, timestamp, ageSeconds, signatureVerified) {
  return {
    ok: signatureVerified,
    status,
    message,
    signatureVerified,
    timestamp,
    signedAt: timestamp ? new Date(timestamp * 1000).toISOString() : "",
    ageSeconds: Number.isFinite(ageSeconds) ? Math.round(ageSeconds) : null,
    toleranceSeconds: PAYMENT_WEBHOOK_TOLERANCE_SECONDS,
  };
}

function signPaymentWebhookPayload(input = {}, timestamp = currentEpochSeconds()) {
  const payload = canonicalPaymentWebhookPayload(input);
  const digest = crypto
    .createHmac("sha256", paymentWebhookSecret())
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return `${PAYMENT_WEBHOOK_SIGNATURE_VERSION}=${digest}`;
}

function canonicalPaymentWebhookPayload(input = {}) {
  const sessionId = String(input.sessionId || "").trim();
  const eventType = normalizePaymentEventType(input.eventType);
  const providerEventId = String(input.providerEventId || `${eventType}_${sessionId}`).slice(0, 120);
  const failureReason = String(input.failureReason || "").slice(0, 160);

  return JSON.stringify({
    eventType,
    failureReason,
    providerEventId,
    sessionId,
  });
}

function normalizeWebhookSignature(signature) {
  const trimmed = String(signature || "").trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith(`${PAYMENT_WEBHOOK_SIGNATURE_VERSION}=`)
    ? trimmed
    : `${PAYMENT_WEBHOOK_SIGNATURE_VERSION}=${trimmed}`;
}

function normalizeWebhookTimestamp(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return value > 9999999999 ? Math.floor(value / 1000) : Math.floor(value);
}

function currentEpochSeconds() {
  return Math.floor(Date.now() / 1000);
}

function paymentWebhookSecret() {
  return process.env.PAYMENT_WEBHOOK_SECRET || DEFAULT_PAYMENT_WEBHOOK_SECRET;
}

function secureCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function recordRejectedPaymentWebhook(state, input = {}, verification = {}, options = {}) {
  const paymentSession = state.paymentSessions.find((session) => session.id === input.sessionId);
  const targetUser = state.users.find((user) => user.id === paymentSession?.userId);
  const eventType = normalizePaymentEventType(input.eventType);
  const providerEventId = String(input.providerEventId || `rejected_${eventType}_${crypto.randomUUID()}`).slice(0, 120);
  const now = new Date().toISOString();
  const organizationId = paymentSession?.organizationId || targetUser?.organizationId || PLATFORM_ORGANIZATION_ID;
  const webhookEvent = {
    id: crypto.randomUUID(),
    providerEventId,
    sessionId: String(input.sessionId || ""),
    userId: targetUser?.id || "",
    organizationId,
    eventType,
    status: "rejected",
    provider: options.provider || paymentSession?.provider || "local_gateway",
    source: options.source || "signed_gateway",
    externalPaymentId: input.externalPaymentId || paymentSession?.externalPaymentId || "",
    signatureVerified: Boolean(verification.signatureVerified),
    verificationStatus: verification.status || "invalid_signature",
    signedAt: verification.signedAt || "",
    signatureAgeSeconds: verification.ageSeconds ?? null,
    createdAt: now,
    processedAt: now,
    message: verification.message || "Webhook signature verification failed.",
  };

  state.paymentWebhookEvents.push(webhookEvent);
  appendAuditEvent(state, {
    actorUserId: "",
    action: "payment.webhook_rejected",
    targetUserId: targetUser?.id || "",
    organizationId,
    details: {
      paymentSessionId: webhookEvent.sessionId,
      providerEventId,
      eventType,
      source: webhookEvent.source,
      provider: webhookEvent.provider,
      externalPaymentId: webhookEvent.externalPaymentId,
      verificationStatus: webhookEvent.verificationStatus,
      signatureVerified: webhookEvent.signatureVerified,
      reason: webhookEvent.message,
    },
  });

  return webhookEvent;
}

function organizationIdForUser(state, userId) {
  const user = state.users.find((candidate) => candidate.id === userId);
  return user?.organizationId || "";
}

function organizationIdForPaymentSession(state, sessionId) {
  const session = state.paymentSessions.find((candidate) => candidate.id === sessionId);
  return session?.organizationId || organizationIdForUser(state, session?.userId);
}

function recordBelongsToOrganization(record, organizationId, memberIds) {
  if (record.organizationId) {
    return record.organizationId === organizationId;
  }

  return memberIds.has(record.userId);
}

function tenantMetadataReport(state) {
  const missingOrganizationId = {
    portfolioSnapshots: countMissingOrganizationId(state.portfolioSnapshots),
    investorProfiles: countMissingOrganizationId(state.investorProfiles),
    billingEvents: countMissingOrganizationId(state.billingEvents),
    paymentSessions: countMissingOrganizationId(state.paymentSessions),
    paymentWebhookEvents: countMissingOrganizationId(state.paymentWebhookEvents),
    approvalRequests: countMissingOrganizationId(state.approvalRequests),
    auditEvents: countMissingOrganizationId(state.auditEvents),
  };
  const totalMissingOrganizationId = Object.values(missingOrganizationId)
    .reduce((total, count) => total + count, 0);

  return {
    totalMissingOrganizationId,
    ...missingOrganizationId,
  };
}

function countMissingOrganizationId(records) {
  return records.filter((record) => !record.organizationId).length;
}

function auditIntegrityReport(events = []) {
  let previousHash = "";
  let verifiedEvents = 0;
  let missingHashEvents = 0;
  let invalidHashEvents = 0;
  let previousHashMismatches = 0;
  const invalidSamples = [];

  events.forEach((event, index) => {
    const expectedPreviousHash = previousHash;
    const expectedHash = hashAuditEvent({
      ...event,
      previousHash: event.previousHash ?? expectedPreviousHash,
    });
    const hasHash = Boolean(event.eventHash);
    const previousHashMatches = (event.previousHash || "") === expectedPreviousHash;
    const eventHashMatches = event.eventHash === expectedHash;

    if (!hasHash) {
      missingHashEvents += 1;
    }
    if (!previousHashMatches) {
      previousHashMismatches += 1;
    }
    if (hasHash && !eventHashMatches) {
      invalidHashEvents += 1;
    }
    if (hasHash && previousHashMatches && eventHashMatches) {
      verifiedEvents += 1;
    }
    if ((!hasHash || !previousHashMatches || (hasHash && !eventHashMatches)) && invalidSamples.length < 8) {
      invalidSamples.push({
        index,
        id: event.id || "",
        action: event.action || "",
        createdAt: event.createdAt || "",
        issue: !hasHash ? "missing_hash" : !previousHashMatches ? "previous_hash_mismatch" : "hash_mismatch",
      });
    }

    previousHash = event.eventHash || expectedHash;
  });

  const invalidEvents = events.length - verifiedEvents;
  return {
    algorithm: AUDIT_HASH_VERSION,
    status: invalidEvents === 0 ? "verified" : "needs_review",
    totalEvents: events.length,
    verifiedEvents,
    missingHashEvents,
    invalidHashEvents,
    previousHashMismatches,
    invalidEvents,
    lastEventHash: previousHash,
    lastHashPreview: previousHash ? previousHash.slice(0, 12) : "",
    invalidSamples,
  };
}

function hashAuditEvent(event) {
  const payload = {
    id: event.id || "",
    action: normalizeAuditAction(event.action),
    actorUserId: event.actorUserId || "",
    actorEmail: event.actorEmail || "",
    targetUserId: event.targetUserId || "",
    targetEmail: event.targetEmail || "",
    organizationId: event.organizationId || "",
    integrityVersion: event.integrityVersion || AUDIT_HASH_VERSION,
    previousHash: event.previousHash || "",
    details: sanitizeAuditDetails(event.details || {}),
    createdAt: event.createdAt || "",
  };

  return crypto
    .createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex");
}

function stableStringify(value) {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function resolveAuditOrganizationId(state, event) {
  const candidates = [
    event.organizationId,
    event.details?.organizationId,
  ].filter(Boolean).map(String);

  return candidates.find((organizationId) => state.organizations.some((organization) => organization.id === organizationId)) || "";
}

function buildWorkspaceUsers(users, state) {
  return users.map((user) => {
    const assignment = state.advisorAssignments.find((item) => item.customerId === user.id);
    const advisor = assignment ? state.users.find((candidate) => candidate.id === assignment.advisorId) : null;
    const organization = state.organizations.find((candidate) => candidate.id === user.organizationId);
    const portfolioSnapshot = state.portfolioSnapshots.find((snapshot) => snapshot.userId === user.id);
    const profile = state.investorProfiles.find((item) => item.userId === user.id);
    const billingEvents = state.billingEvents.filter((event) => event.userId === user.id);
    const latestBillingEvent = billingEvents
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0];

    return {
      ...publicUser(user),
      profileCompleted: Boolean(profile),
      portfolioSummary: portfolioSnapshot?.summary || null,
      organizationId: organization?.id || user.organizationId || "",
      organizationName: organization?.name || "Unassigned",
      organizationType: organization?.type || "client",
      advisorId: advisor?.id || "",
      advisorName: advisor?.name || "",
      billingSummary: {
        invoiceCount: billingEvents.length,
        revenueCollected: billingEvents.reduce((total, event) => total + numberValue(event.amountThb), 0),
        latestInvoice: latestBillingEvent?.invoiceNumber || "",
        latestInvoiceAt: latestBillingEvent?.createdAt || "",
      },
    };
  });
}

function applyPaidSubscriptionFromSession(state, user, paymentSession, plan, now) {
  const renewsAt = new Date(now);
  renewsAt.setMonth(renewsAt.getMonth() + 1);
  user.subscription = {
    plan: plan.name,
    planId: plan.id,
    status: "active",
    priceThb: plan.priceThb,
    billing: plan.billing,
    provider: paymentSession.provider || "local_gateway",
    externalPaymentId: paymentSession.externalPaymentId || "",
    currentPeriodStartedAt: now.toISOString(),
    renewsAt: renewsAt.toISOString(),
    updatedAt: now.toISOString(),
  };

  const billingEvent = {
    id: crypto.randomUUID(),
    userId: user.id,
    organizationId: paymentSession.organizationId || user.organizationId || "",
    paymentSessionId: paymentSession.id,
    invoiceNumber: `SF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${state.billingEvents.length + 1}`,
    planId: plan.id,
    planName: plan.name,
    amountThb: plan.priceThb,
    currency: "THB",
    status: "paid",
    provider: paymentSession.provider || "local_gateway",
    externalPaymentId: paymentSession.externalPaymentId || "",
    createdAt: now.toISOString(),
  };

  state.billingEvents.push(billingEvent);
  paymentSession.status = "paid";
  paymentSession.completedAt = now.toISOString();
  paymentSession.failureReason = "";
  paymentSession.billingEventId = billingEvent.id;
  appendAuditEvent(state, {
    actorUserId: user.id,
    action: "billing.checkout",
    targetUserId: user.id,
    details: {
      invoiceNumber: billingEvent.invoiceNumber,
      paymentSessionId: paymentSession.id,
      planId: plan.id,
      planName: plan.name,
      amountThb: plan.priceThb,
      status: billingEvent.status,
    },
  });

  return billingEvent;
}

function canAccessPaymentSession(state, actor, paymentSession) {
  if (["owner", "admin"].includes(normalizeRole(actor.role))) {
    return true;
  }

  if (paymentSession.userId === actor.id) {
    return true;
  }

  if (normalizeRole(actor.role) !== "advisor") {
    return false;
  }

  return state.advisorAssignments.some((assignment) => (
    assignment.advisorId === actor.id && assignment.customerId === paymentSession.userId
  ));
}

function canAdvisorAccessCustomer(state, advisorId, customerId) {
  return state.advisorAssignments.some((assignment) => (
    assignment.advisorId === advisorId && assignment.customerId === customerId
  ));
}

function usersVisibleToUser(state, viewer) {
  const viewerRole = normalizeRole(viewer.role);
  if (["owner", "admin"].includes(viewerRole)) {
    return new Set(state.users.map((user) => user.id));
  }

  const visibleUserIds = new Set([viewer.id]);
  if (viewerRole === "advisor") {
    state.advisorAssignments
      .filter((assignment) => assignment.advisorId === viewer.id)
      .forEach((assignment) => visibleUserIds.add(assignment.customerId));
  }

  return visibleUserIds;
}

function requireOrganizationManager(state, actorUserId) {
  const actor = state.users.find((user) => user.id === actorUserId);
  if (!actor || !["owner", "admin"].includes(normalizeRole(actor.role))) {
    throw new Error("Only owner or admin can manage workspaces.");
  }
  requirePlanEntitlement(actor, "organization.management");

  return actor;
}

function organizationsVisibleToUser(state, viewer) {
  const viewerRole = normalizeRole(viewer.role);
  if (["owner", "admin"].includes(viewerRole)) {
    return new Set(state.organizations.map((organization) => organization.id));
  }

  const visibleOrganizationIds = new Set([viewer.organizationId].filter(Boolean));
  if (viewerRole === "advisor") {
    const assignedCustomerIds = new Set(state.advisorAssignments
      .filter((assignment) => assignment.advisorId === viewer.id)
      .map((assignment) => assignment.customerId));
    state.users
      .filter((user) => assignedCustomerIds.has(user.id))
      .forEach((user) => {
        if (user.organizationId) {
          visibleOrganizationIds.add(user.organizationId);
        }
      });
  }

  return visibleOrganizationIds;
}

function ensurePlatformOrganization(state, ownerName, now = new Date(), ownerUserId = "") {
  state.organizations ||= [];
  let organization = state.organizations.find((candidate) => candidate.id === PLATFORM_ORGANIZATION_ID);
  if (!organization) {
    organization = {
      id: PLATFORM_ORGANIZATION_ID,
      name: "StockFlix Platform",
      type: "platform",
      ownerUserId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    state.organizations.push(organization);
  }

  if (!organization.ownerUserId && ownerUserId) {
    organization.ownerUserId = ownerUserId;
  }
  if (ownerName && organization.name === "Platform Workspace") {
    organization.name = "StockFlix Platform";
  }
  organization.type = "platform";
  organization.updatedAt ||= organization.createdAt;
  return organization;
}

function createCustomerOrganization(state, ownerName, now = new Date(), ownerUserId = "") {
  state.organizations ||= [];
  const organization = {
    id: crypto.randomUUID(),
    name: `${ownerName || "Investor"} Workspace`,
    type: "customer",
    ownerUserId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  state.organizations.push(organization);
  return organization;
}

function cleanOrganizationName(name) {
  const normalized = String(name || "").trim();
  return normalized ? normalized.slice(0, 80) : "Client Workspace";
}

function cleanApprovalTitle(title) {
  const normalized = String(title || "").trim();
  return normalized ? normalized.slice(0, 100) : "Portfolio action approval";
}

function cleanApprovalSummary(summary) {
  return String(summary || "").trim().replace(/\s+/g, " ").slice(0, 600);
}

function normalizeApprovalStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return APPROVAL_STATUSES.includes(normalized) ? normalized : "pending";
}

function normalizeApprovalActionType(actionType) {
  const normalized = String(actionType || "").trim().toLowerCase();
  return APPROVAL_ACTION_TYPES.includes(normalized) ? normalized : "portfolio_review";
}

function normalizeApprovalRiskLevel(riskLevel) {
  const normalized = String(riskLevel || "").trim().toLowerCase();
  return APPROVAL_RISK_LEVELS.includes(normalized) ? normalized : "medium";
}

function approvalAuditDetails(request) {
  return {
    approvalId: request.id,
    title: request.title,
    actionType: request.actionType,
    amountThb: Math.round(numberValue(request.amountThb)),
    riskLevel: request.riskLevel,
    status: request.status,
    decisionNote: request.decisionNote || "",
  };
}

function userName(name) {
  return String(name || "Investor").trim() || "Investor";
}

function legacyOrganizationIdForUser(userId) {
  return `org_user_${String(userId || "unknown").replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 64)}`;
}

function normalizeAuditEvents(state, events = []) {
  let previousHash = "";
  return events
    .filter((event) => event && event.action && event.createdAt)
    .map((event) => {
      const normalizedEvent = publicAuditEvent({
        ...event,
        organizationId: event.organizationId || resolveAuditOrganizationId(state, event) || organizationIdForUser(state, event.targetUserId || event.actorUserId),
        integrityVersion: event.integrityVersion || AUDIT_HASH_VERSION,
        previousHash: event.previousHash ?? previousHash,
      });
      const calculatedHash = hashAuditEvent(normalizedEvent);
      const eventHash = event.eventHash || calculatedHash;
      previousHash = eventHash;

      return {
        ...normalizedEvent,
        eventHash,
        hashPreview: eventHash.slice(0, 12),
      };
    });
}

export function normalizeAppStateForImport(parsed = {}) {
  return normalizeState(parsed);
}

function normalizeState(parsed) {
  const state = {
    users: parsed.users || [],
    sessions: parsed.sessions || [],
    portfolioSnapshots: parsed.portfolioSnapshots || [],
    investorProfiles: parsed.investorProfiles || [],
    billingEvents: parsed.billingEvents || [],
    paymentSessions: parsed.paymentSessions || [],
    paymentWebhookEvents: parsed.paymentWebhookEvents || [],
    advisorAssignments: parsed.advisorAssignments || [],
    approvalRequests: parsed.approvalRequests || [],
    auditEvents: parsed.auditEvents || [],
    organizations: parsed.organizations || [],
  };
  const hasOwner = state.users.some((user) => ["owner", "admin"].includes(user.role));

  state.users = state.users.map((user, index) => ({
    ...user,
    role: normalizeRole(user.role || (!hasOwner && index === 0 ? "owner" : "customer")),
    subscription: normalizeSubscription(user.subscription || {}, user.createdAt),
  }));
  state.organizations = state.organizations
    .filter((organization) => organization && organization.id)
    .map((organization) => ({
      id: String(organization.id),
      name: cleanOrganizationName(organization.name),
      type: normalizeOrganizationType(organization.type),
      ownerUserId: organization.ownerUserId || "",
      createdAt: organization.createdAt || new Date(0).toISOString(),
      updatedAt: organization.updatedAt || organization.createdAt || new Date(0).toISOString(),
    }));
  ensurePlatformOrganization(
    state,
    state.users.find((user) => normalizeRole(user.role) === "owner")?.name || "Owner",
    new Date(state.users[0]?.createdAt || 0),
    state.users.find((user) => normalizeRole(user.role) === "owner")?.id || "",
  );

  const organizationsById = new Map(state.organizations.map((organization) => [organization.id, organization]));
  state.users = state.users.map((user) => {
    if (user.organizationId && organizationsById.has(user.organizationId)) {
      return user;
    }

    if (["owner", "admin", "advisor"].includes(normalizeRole(user.role))) {
      return {
        ...user,
        organizationId: PLATFORM_ORGANIZATION_ID,
      };
    }

    const organizationId = legacyOrganizationIdForUser(user.id);
    if (!organizationsById.has(organizationId)) {
      const organization = {
        id: organizationId,
        name: `${user.name || "Investor"} Workspace`,
        type: "customer",
        ownerUserId: user.id,
        createdAt: user.createdAt || new Date(0).toISOString(),
        updatedAt: user.createdAt || new Date(0).toISOString(),
      };
      state.organizations.push(organization);
      organizationsById.set(organization.id, organization);
    }

    return {
      ...user,
      organizationId,
    };
  });
  state.advisorAssignments = state.advisorAssignments.filter((assignment) => {
    const customer = state.users.find((user) => user.id === assignment.customerId);
    const advisor = state.users.find((user) => user.id === assignment.advisorId);
    return customer && advisor;
  });
  state.portfolioSnapshots = state.portfolioSnapshots
    .filter((snapshot) => snapshot && snapshot.userId)
    .map((snapshot) => ({
      ...snapshot,
      organizationId: snapshot.organizationId || organizationIdForUser(state, snapshot.userId),
    }));
  state.investorProfiles = state.investorProfiles
    .filter((profile) => profile && profile.userId)
    .map((profile) => ({
      ...profile,
      organizationId: profile.organizationId || organizationIdForUser(state, profile.userId),
    }));
  state.billingEvents = state.billingEvents
    .filter((event) => event && event.userId)
    .map((event) => ({
      ...event,
      organizationId: event.organizationId || organizationIdForUser(state, event.userId),
      amountThb: numberValue(event.amountThb),
      currency: event.currency || "THB",
      status: event.status || "paid",
    }));
  state.paymentSessions = state.paymentSessions
    .filter((session) => session && session.id && session.userId)
    .map((session) => ({
      ...session,
      organizationId: session.organizationId || organizationIdForUser(state, session.userId),
      status: normalizePaymentSessionStatus(session.status),
      amountThb: numberValue(session.amountThb),
      currency: session.currency || "THB",
      provider: session.provider || "local_gateway",
      checkoutUrl: session.checkoutUrl || "",
      externalPaymentId: session.externalPaymentId || "",
      requiresRedirect: Boolean(session.requiresRedirect),
      providerStatus: session.providerStatus || "",
      webhookEventIds: Array.isArray(session.webhookEventIds) ? session.webhookEventIds : [],
    }));
  state.paymentWebhookEvents = state.paymentWebhookEvents
    .filter((event) => event && event.id && event.sessionId)
    .map((event) => ({
      ...event,
      organizationId: event.organizationId || organizationIdForPaymentSession(state, event.sessionId) || organizationIdForUser(state, event.userId) || PLATFORM_ORGANIZATION_ID,
      eventType: normalizePaymentEventType(event.eventType),
      status: event.status || "processed",
      provider: event.provider || "local_gateway",
      source: event.source || "authenticated_simulation",
      externalPaymentId: event.externalPaymentId || "",
      signatureVerified: Boolean(event.signatureVerified),
      verificationStatus: event.verificationStatus || "not_required",
      signedAt: event.signedAt || "",
      signatureAgeSeconds: event.signatureAgeSeconds ?? null,
    }));
  state.approvalRequests = state.approvalRequests
    .filter((request) => request && request.id && request.customerId)
    .map((request) => {
      const customer = state.users.find((user) => user.id === request.customerId);
      const requester = state.users.find((user) => user.id === request.requestedByUserId);
      const fallbackRequester = requester || customer;
      const createdAt = request.createdAt || new Date(0).toISOString();
      const status = normalizeApprovalStatus(request.status);

      return {
        id: String(request.id),
        customerId: customer?.id || request.customerId,
        organizationId: request.organizationId || customer?.organizationId || organizationIdForUser(state, request.customerId),
        requestedByUserId: fallbackRequester?.id || request.requestedByUserId || request.customerId,
        title: cleanApprovalTitle(request.title),
        summary: cleanApprovalSummary(request.summary),
        actionType: normalizeApprovalActionType(request.actionType),
        amountThb: clampNumber(request.amountThb, 0, 1000000000),
        riskLevel: normalizeApprovalRiskLevel(request.riskLevel),
        status,
        decisionNote: cleanApprovalSummary(request.decisionNote),
        decidedByUserId: status === "pending" ? "" : (request.decidedByUserId || request.customerId || ""),
        decidedAt: status === "pending" ? "" : (request.decidedAt || request.updatedAt || createdAt),
        createdAt,
        updatedAt: request.updatedAt || request.decidedAt || createdAt,
      };
    });
  state.auditEvents = normalizeAuditEvents(state, state.auditEvents).slice(-MAX_AUDIT_EVENTS);

  return state;
}

function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return ROLES.includes(normalized) ? normalized : "customer";
}

function normalizeOrganizationType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  return ORGANIZATION_TYPES.includes(normalized) ? normalized : "client";
}

function normalizePaymentSessionStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return ["pending", "paid", "failed", "expired"].includes(normalized) ? normalized : "pending";
}

function normalizePaymentEventType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  return PAYMENT_EVENT_TYPES.includes(normalized) ? normalized : "payment.succeeded";
}

function normalizeAuditAction(action) {
  return String(action || "system.event").trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "_").slice(0, 80);
}

function sanitizeAuditDetails(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }

  return Object.fromEntries(Object.entries(details)
    .filter(([key]) => !/password|secret|token|cookie|hash/i.test(key))
    .slice(0, 20)
    .map(([key, value]) => [
      String(key).replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 60),
      sanitizeAuditValue(value),
    ]));
}

function sanitizeAuditValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 8).map(sanitizeAuditValue);
  }

  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/password|secret|token|cookie|hash/i.test(key))
      .slice(0, 8)
      .map(([key, nestedValue]) => [
        String(key).replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 60),
        sanitizeAuditValue(nestedValue),
      ]));
  }

  return String(value).slice(0, 160);
}
