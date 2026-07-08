import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-subscription-lifecycle-"));

process.chdir(tempRoot);

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const {
    auditIntegritySummary,
    approvePlanRequest,
    businessMetrics,
    createPaymentSession,
    createPlanRequest,
    createPaymentWebhookSignature,
    createUser,
    getAuditEvents,
    getBillingHistory,
    getPaymentSessions,
    getPlanRequestStatus,
    listPlanRequests,
    processPaymentWebhook,
    processSignedPaymentWebhook,
    subscriptionPlans,
    updateUserSubscription,
  } = auth;

  const owner = await createAccount(createUser, "Owner", "owner@example.test");
  const customer = await createAccount(createUser, "Customer", "customer@example.test");
  const requestCustomer = await createAccount(createUser, "Request Customer", "request-customer@example.test");
  const plans = subscriptionPlans();
  const starterPlan = plans.find((plan) => plan.id === "starter");
  const proPlan = plans.find((plan) => plan.id === "pro");

  assert(starterPlan && proPlan, "Starter and Pro plans should exist.");
  assertEqual(customer.subscription.status, "inactive", "New customers should wait for manual admin package assignment.");
  assertEqual(customer.subscription.provider, "manual_admin_pending", "New customers should be marked as pending manual admin review.");

  const proRequest = await createPlanRequest(requestCustomer.id, { planId: "pro" });
  assertEqual(proRequest.request.status, "pending", "Customer plan request should start pending.");
  assertEqual(proRequest.request.planId, "pro", "Customer should be able to request Pro from Monthly Plans.");
  const duplicateRequest = await createPlanRequest(requestCustomer.id, { planId: "pro" });
  assertEqual(duplicateRequest.duplicate, true, "Duplicate pending request for the same plan should be reconciled.");
  const customerRequestStatus = await getPlanRequestStatus(requestCustomer.id);
  assertEqual(customerRequestStatus.pendingRequest.planId, "pro", "Customer status should expose the pending plan request.");
  const ownerPlanRequests = await listPlanRequests(owner.id, { limit: 10 });
  assert(ownerPlanRequests.some((request) => request.id === proRequest.request.id), "Owner should see customer plan requests.");
  const approvedRequest = await approvePlanRequest(owner.id, proRequest.request.id, {
    status: "active",
    expiresAt: "2099-12-31",
  });
  assertEqual(approvedRequest.request.status, "approved", "Owner approval should mark plan request approved.");
  assertEqual(approvedRequest.user.subscription.planId, "pro", "Plan request approval should activate requested Pro plan.");
  assertEqual(approvedRequest.user.subscription.provider, "manual_admin", "Plan request approval should use manual admin provider.");

  const failedSession = await createPaymentSession(customer.id, "starter");
  const failedWebhook = await processPaymentWebhook(customer.id, {
    sessionId: failedSession.paymentSession.id,
    eventType: "payment.failed",
    providerEventId: "evt_lifecycle_failed",
    failureReason: "Card declined by issuer.",
  });
  assertEqual(failedWebhook.paymentSession.status, "failed", "Failed webhook should mark session failed.");
  assertEqual(failedWebhook.billingEvent, null, "Failed webhook should not create a billing event.");
  assertEqual(failedWebhook.user.subscription.status, "inactive", "Failed payment should not activate subscription.");
  assertEqual((await getBillingHistory(customer.id)).length, 0, "No invoice should exist after failed payment only.");

  const signedSession = await createPaymentSession(customer.id, "pro");
  const successPayload = {
    sessionId: signedSession.paymentSession.id,
    eventType: "payment.succeeded",
    providerEventId: "evt_lifecycle_signed_success",
  };
  const successSignature = createPaymentWebhookSignature(successPayload);
  const signedSuccess = await processSignedPaymentWebhook(successPayload, successSignature);

  assertEqual(signedSuccess.paymentSession.status, "paid", "Signed success should mark session paid.");
  assertEqual(signedSuccess.webhookEvent.signatureVerified, true, "Signed success should be signature verified.");
  assertEqual(signedSuccess.webhookEvent.verificationStatus, "verified", "Signed success verification status should be verified.");
  assertEqual(signedSuccess.user.subscription.status, "active", "Signed success should activate subscription.");
  assertEqual(signedSuccess.user.subscription.planId, "pro", "Signed success should activate Pro plan.");
  assertEqual(signedSuccess.billingEvent.amountThb, proPlan.priceThb, "Billing amount should match Pro plan.");

  const billingAfterSuccess = await getBillingHistory(customer.id);
  assertEqual(billingAfterSuccess.length, 1, "Successful payment should create one billing event.");

  const duplicateSuccess = await processSignedPaymentWebhook(successPayload, successSignature);
  assertEqual(duplicateSuccess.duplicate, true, "Duplicate provider event should be reconciled.");
  assertEqual((await getBillingHistory(customer.id)).length, 1, "Duplicate webhook should not create another invoice.");

  const alreadyPaidPayload = {
    sessionId: signedSession.paymentSession.id,
    eventType: "payment.succeeded",
    providerEventId: "evt_lifecycle_paid_again",
  };
  const alreadyPaidSignature = createPaymentWebhookSignature(alreadyPaidPayload);
  const alreadyPaidWebhook = await processSignedPaymentWebhook(alreadyPaidPayload, alreadyPaidSignature);
  assertEqual(alreadyPaidWebhook.duplicate, false, "New provider event on a paid session should be recorded.");
  assertEqual(alreadyPaidWebhook.paymentSession.status, "paid", "Already-paid success should keep session paid.");
  assertEqual((await getBillingHistory(customer.id)).length, 1, "Already-paid success should not create another invoice.");

  const invalidSession = await createPaymentSession(customer.id, "starter");
  const invalidPayload = {
    sessionId: invalidSession.paymentSession.id,
    eventType: "payment.succeeded",
    providerEventId: "evt_lifecycle_invalid_signature",
  };
  const invalidRejected = await expectWebhookReject(
    () => processSignedPaymentWebhook(invalidPayload, {
      signature: "v1=invalid",
      timestamp: String(Math.floor(Date.now() / 1000)),
    }),
    "Invalid signature should be rejected.",
  );
  assertEqual(invalidRejected.status, "rejected", "Invalid signature should create rejected webhook event.");
  assertEqual(invalidRejected.verificationStatus, "invalid_signature", "Invalid signature status should be recorded.");
  assertEqual(invalidRejected.signatureVerified, false, "Invalid signature should not be marked verified.");

  const staleSession = await createPaymentSession(customer.id, "starter");
  const stalePayload = {
    sessionId: staleSession.paymentSession.id,
    eventType: "payment.succeeded",
    providerEventId: "evt_lifecycle_stale_signature",
  };
  const staleSignature = createPaymentWebhookSignature(stalePayload, Math.floor(Date.now() / 1000) - 1000);
  const staleRejected = await expectWebhookReject(
    () => processSignedPaymentWebhook(stalePayload, staleSignature),
    "Stale timestamp should be rejected.",
  );
  assertEqual(staleRejected.verificationStatus, "stale_timestamp", "Stale timestamp status should be recorded.");

  const missingSession = await createPaymentSession(customer.id, "starter");
  const missingPayload = {
    sessionId: missingSession.paymentSession.id,
    eventType: "payment.succeeded",
    providerEventId: "evt_lifecycle_missing_signature",
  };
  const missingRejected = await expectWebhookReject(
    () => processSignedPaymentWebhook(missingPayload, {
      timestamp: String(Math.floor(Date.now() / 1000)),
    }),
    "Missing signature should be rejected.",
  );
  assertEqual(missingRejected.verificationStatus, "missing_signature", "Missing signature status should be recorded.");

  const invalidSessionPayload = {
    sessionId: "missing_payment_session",
    eventType: "payment.succeeded",
    providerEventId: "evt_lifecycle_invalid_session",
  };
  const invalidSessionSignature = createPaymentWebhookSignature(invalidSessionPayload);
  const invalidSessionRejected = await expectWebhookReject(
    () => processSignedPaymentWebhook(invalidSessionPayload, invalidSessionSignature),
    "Signed webhook for missing session should be rejected.",
  );
  assertEqual(invalidSessionRejected.verificationStatus, "invalid_session", "Invalid session status should be recorded.");
  assertEqual(invalidSessionRejected.signatureVerified, true, "Invalid session should still record that signature matched payload.");

  const customerSessions = await getPaymentSessions(customer.id, { limit: 20 });
  const sessionById = new Map(customerSessions.map((session) => [session.id, session]));
  assertEqual(sessionById.get(failedSession.paymentSession.id).status, "failed", "Failed session should stay failed.");
  assertEqual(sessionById.get(signedSession.paymentSession.id).status, "paid", "Signed success session should stay paid.");
  assertEqual(sessionById.get(invalidSession.paymentSession.id).status, "pending", "Invalid signature should leave session pending.");
  assertEqual(sessionById.get(staleSession.paymentSession.id).status, "pending", "Stale signature should leave session pending.");
  assertEqual(sessionById.get(missingSession.paymentSession.id).status, "pending", "Missing signature should leave session pending.");

  const manualSubscription = await updateUserSubscription(owner.id, customer.id, {
    planId: "starter",
    status: "active",
    expiresAt: "2099-12-31",
  });
  assertEqual(manualSubscription.subscription.planId, "starter", "Owner should manually update customer to Starter during launch.");
  assertEqual(manualSubscription.subscription.status, "active", "Manual package update should keep active status before expiry.");
  assertEqual(manualSubscription.subscription.provider, "manual_admin", "Manual package update should record manual provider.");

  const metrics = await businessMetrics();
  assertEqual(metrics.paidUsers, 2, "Metrics should count one paid webhook customer and one manually approved plan request customer.");
  assertEqual(metrics.pendingPlanRequests, 0, "Approved plan requests should not remain pending.");
  assertEqual(metrics.planRequestsByStatus.approved, 1, "Metrics should count the approved plan request.");
  assertEqual(metrics.failedPaymentSessions, 1, "Metrics should count one failed payment session.");
  assertEqual(metrics.pendingPaymentSessions, 3, "Metrics should count pending sessions after rejected webhook attempts.");
  assertEqual(metrics.verifiedWebhookEvents, 3, "Metrics should count signed webhooks with valid signatures, including already-paid and invalid-session events.");
  assertEqual(metrics.rejectedWebhookEvents, 4, "Metrics should count four rejected webhook events.");
  assertEqual(metrics.revenueCollected, proPlan.priceThb, "Metrics revenue should equal one Pro payment.");
  assertEqual(metrics.auditIntegrity.status, "verified", "Audit integrity in metrics should be verified.");
  assertEqual(metrics.tenantMetadata.totalMissingOrganizationId, 0, "Tenant metadata should have no gaps.");

  const auditEvents = await getAuditEvents(owner.id, { limit: 100 });
  const rejectedAuditEvents = auditEvents.filter((event) => event.action === "payment.webhook_rejected");
  assertEqual(rejectedAuditEvents.length, 4, "Rejected webhook attempts should be audited.");
  assert(auditEvents.some((event) => event.action === "payment.webhook_succeeded"), "Payment success should be audited.");
  assert(auditEvents.some((event) => event.action === "payment.webhook_failed"), "Payment failure should be audited.");
  assert(auditEvents.some((event) => event.action === "subscription.plan_request_created"), "Plan request creation should be audited.");
  assert(auditEvents.some((event) => event.action === "subscription.plan_request_approved"), "Plan request approval should be audited.");
  assert(auditEvents.some((event) => event.action === "team.subscription_update"), "Manual subscription update should be audited.");

  const integrity = await auditIntegritySummary(owner.id);
  assertEqual(integrity.status, "verified", "Owner audit integrity summary should be verified.");

  const report = {
    ok: true,
    tempRoot,
    users: {
      owner: owner.id,
      customer: customer.id,
    },
    checks: {
      failedSession: failedWebhook.paymentSession.status,
      paidSession: signedSuccess.paymentSession.status,
      duplicateReconciled: duplicateSuccess.duplicate,
      billingEvents: (await getBillingHistory(customer.id)).length,
      paidUsers: metrics.paidUsers,
      planRequests: metrics.planRequests,
      approvedPlanRequests: metrics.planRequestsByStatus.approved,
      pendingPaymentSessions: metrics.pendingPaymentSessions,
      failedPaymentSessions: metrics.failedPaymentSessions,
      verifiedWebhookEvents: metrics.verifiedWebhookEvents,
      rejectedWebhookEvents: metrics.rejectedWebhookEvents,
      revenueCollected: metrics.revenueCollected,
      manualPlan: manualSubscription.subscription.planId,
      auditIntegrity: integrity.status,
    },
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

async function createAccount(createUser, name, email) {
  const result = await createUser({
    name,
    email,
    password: "strong-password-123",
  });
  return result.user;
}

async function expectWebhookReject(action, message) {
  try {
    await action();
  } catch (error) {
    assert(error.webhookEvent, `${message} Rejected webhook event should be attached.`);
    return error.webhookEvent;
  }

  throw new Error(message);
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, message, { actual, expected });
}

function assert(condition, message, details = {}) {
  if (condition) {
    return;
  }

  throw new Error(`${message}\n${JSON.stringify(details, null, 2)}`);
}
