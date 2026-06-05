import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-tenant-access-"));

process.chdir(tempRoot);

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const {
    assignAdvisor,
    auditIntegritySummary,
    businessMetrics,
    checkoutSubscription,
    createPaymentSession,
    createUser,
    getAuditEvents,
    getBillingHistory,
    getCustomerPortfolioSnapshot,
    getPaymentSessions,
    listOrganizations,
    listWorkspaceUsers,
    moveUserToOrganization,
    processPaymentWebhook,
    saveCustomerPortfolioSnapshot,
    saveInvestorProfile,
    tenantAccessSummary,
    updateUserRole,
  } = auth;

  const owner = await createAccount(createUser, "Owner", "owner@example.test");
  const customerA = await createAccount(createUser, "Customer A", "customer-a@example.test");
  const customerB = await createAccount(createUser, "Customer B", "customer-b@example.test");
  const advisor = await createAccount(createUser, "Advisor", "advisor@example.test");
  const admin = await createAccount(createUser, "Admin", "admin@example.test");

  const advisorUser = await updateUserRole(owner.id, advisor.id, "advisor");
  const adminUser = await updateUserRole(owner.id, admin.id, "admin");
  await moveUserToOrganization(owner.id, advisor.id, owner.organizationId);
  await moveUserToOrganization(owner.id, admin.id, owner.organizationId);
  await checkoutSubscription(advisor.id, "advisor");
  await assignAdvisor(owner.id, customerA.id, advisor.id);

  await saveInvestorProfile(customerA.id, {
    goal: "wealth",
    experience: "beginner",
    riskLevel: "medium",
    monthlyBudget: 10000,
    horizonYears: 5,
  });
  await saveInvestorProfile(customerB.id, {
    goal: "income",
    experience: "beginner",
    riskLevel: "low",
    monthlyBudget: 5000,
    horizonYears: 3,
  });
  await saveCustomerPortfolioSnapshot(customerA.id, samplePortfolio("AOT", 72000, 65000, 7000, 78));
  await saveCustomerPortfolioSnapshot(customerB.id, samplePortfolio("PTT", 54000, 60000, -6000, 54));

  await checkoutSubscription(customerA.id, "starter");
  await checkoutSubscription(customerB.id, "pro");
  const pendingA = await createPaymentSession(customerA.id, "pro");
  const pendingB = await createPaymentSession(customerB.id, "starter");

  await expectReject(
    () => processPaymentWebhook(customerB.id, {
      sessionId: pendingA.paymentSession.id,
      eventType: "payment.succeeded",
      providerEventId: "evt_customer_b_cross_access",
    }),
    "Customer B must not process Customer A payment sessions.",
  );
  await expectReject(
    () => processPaymentWebhook(advisor.id, {
      sessionId: pendingB.paymentSession.id,
      eventType: "payment.succeeded",
      providerEventId: "evt_advisor_cross_access",
    }),
    "Advisor must not process unassigned customer payment sessions.",
  );

  const ownerScope = await tenantAccessSummary(owner.id);
  const adminScope = await tenantAccessSummary(admin.id);
  const advisorScope = await tenantAccessSummary(advisor.id);
  const customerAScope = await tenantAccessSummary(customerA.id);
  const customerBScope = await tenantAccessSummary(customerB.id);

  assertIncludes(usersFrom(ownerScope), [owner.id, admin.id, advisor.id, customerA.id, customerB.id], "Owner should see every user.");
  assertIncludes(usersFrom(adminScope), [owner.id, admin.id, advisor.id, customerA.id, customerB.id], "Admin should see every user.");
  assertExactUsers(usersFrom(advisorScope), [advisor.id, customerA.id], "Advisor should see only self and assigned Customer A.");
  assertExactUsers(usersFrom(customerAScope), [customerA.id], "Customer A should see only self.");
  assertExactUsers(usersFrom(customerBScope), [customerB.id], "Customer B should see only self.");

  assertEqual(ownerScope.dataScope.portfolioSnapshots, 2, "Owner should see all portfolio snapshots.");
  assertEqual(adminScope.dataScope.billingEvents, 3, "Admin should see all billing events.");
  assertEqual(advisorScope.dataScope.portfolioSnapshots, 1, "Advisor should see assigned customer portfolio only.");
  assertEqual(advisorScope.dataScope.billingEvents, 2, "Advisor should see own and assigned customer billing only.");
  assertEqual(advisorScope.dataScope.paymentSessions, 3, "Advisor should see own and assigned customer payment sessions only.");
  assertEqual(advisorScope.dataScope.paymentWebhookEvents, 2, "Advisor should see own and assigned customer webhook events only.");
  assertEqual(customerAScope.dataScope.portfolioSnapshots, 1, "Customer A should see one own portfolio snapshot.");
  assertEqual(customerBScope.dataScope.portfolioSnapshots, 1, "Customer B should see one own portfolio snapshot.");
  assertEqual(customerAScope.dataScope.billingEvents, 1, "Customer A should see one own paid billing event.");
  assertEqual(customerBScope.dataScope.billingEvents, 1, "Customer B should see one own paid billing event.");
  assertEqual(customerAScope.isolation.missingOrganizationId.totalMissingOrganizationId, 0, "Tenant metadata should have no gaps.");

  assertExactUsers((await listWorkspaceUsers(advisor.id)).map((user) => user.id), [advisor.id, customerA.id], "Advisor workspace users should exclude unassigned customers.");
  assertExactUsers((await listWorkspaceUsers(customerB.id)).map((user) => user.id), [customerB.id], "Customer workspace users should include only self.");

  const advisorOrganizations = await listOrganizations(advisor.id);
  assert(
    advisorOrganizations.some((organization) => organization.id === advisorUser.organizationId || organization.id === owner.organizationId),
    "Advisor should see own workspace.",
  );
  assert(
    advisorOrganizations.some((organization) => organization.id === customerA.organizationId),
    "Advisor should see assigned customer workspace.",
  );
  assert(
    !advisorOrganizations.some((organization) => organization.id === customerB.organizationId),
    "Advisor should not see unassigned customer workspace.",
  );

  assertOnlyUserSessions(await getPaymentSessions(customerA.id, { limit: 10 }), customerA.id, "Customer A payment sessions should be own only.");
  assertOnlyUserSessions(await getPaymentSessions(customerB.id, { limit: 10 }), customerB.id, "Customer B payment sessions should be own only.");
  assertOnlyAllowedSessions(await getPaymentSessions(advisor.id, { limit: 10 }), [advisor.id, customerA.id], "Advisor payment sessions should be own and assigned customer only.");

  assertOnlyBilling(await getBillingHistory(customerA.id), customerA.id, "Customer A billing history should be own only.");
  assertOnlyBilling(await getBillingHistory(customerB.id), customerB.id, "Customer B billing history should be own only.");
  assert((await getCustomerPortfolioSnapshot(customerA.id)).summary.holdings === 1, "Customer A portfolio snapshot should be available.");
  assert((await getCustomerPortfolioSnapshot(customerB.id)).summary.holdings === 1, "Customer B portfolio snapshot should be available.");

  const customerBAudit = await getAuditEvents(customerB.id, { limit: 100 });
  assertNoUserLeak(customerBAudit, [customerA.id], "Customer B audit timeline should not include Customer A events.");
  const advisorAudit = await getAuditEvents(advisor.id, { limit: 100 });
  assert(
    advisorAudit.some((event) => event.targetUserId === customerA.id || event.actorUserId === customerA.id),
    "Advisor audit timeline should include assigned Customer A events.",
  );
  assertNoUserLeak(advisorAudit, [customerB.id], "Advisor audit timeline should not include unassigned Customer B events.");

  const integrity = await auditIntegritySummary(owner.id);
  assertEqual(integrity.status, "verified", "Owner audit integrity should be verified.");
  await expectReject(
    () => auditIntegritySummary(customerA.id),
    "Customer should not access audit integrity summary.",
  );

  const metrics = await businessMetrics();
  assertEqual(metrics.tenantMetadata.totalMissingOrganizationId, 0, "Business metrics tenant metadata should be complete.");
  assertEqual(metrics.auditIntegrity.status, "verified", "Business metrics audit integrity should be verified.");
  assertEqual(metrics.usersByRole.advisor, 1, "Business metrics should count advisor role.");
  assertEqual(metrics.usersByRole.admin, 1, "Business metrics should count admin role.");

  const report = {
    ok: true,
    tempRoot,
    users: {
      owner: owner.id,
      admin: adminUser.id,
      advisor: advisorUser.id,
      customerA: customerA.id,
      customerB: customerB.id,
    },
    checks: {
      ownerVisibleUsers: ownerScope.visibleUserCount,
      advisorVisibleUsers: advisorScope.visibleUserCount,
      customerADataScope: customerAScope.dataScope,
      customerBDataScope: customerBScope.dataScope,
      auditIntegrity: integrity.status,
      tenantMetadataGaps: metrics.tenantMetadata.totalMissingOrganizationId,
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

function samplePortfolio(symbol, marketValue, costValue, gainLossValue, totalScore) {
  return {
    portfolioRows: [{
      Symbol: symbol,
      Market_Value: marketValue,
      Cost_Value: costValue,
      Gain_Loss_Value: gainLossValue,
      Gain_Loss_Pct: costValue ? (gainLossValue / costValue) * 100 : 0,
      Total_Score: totalScore,
      Advice: totalScore >= 70 ? "Hold / Add" : "Watch",
      Target_Action: totalScore >= 70 ? "Hold" : "Review",
    }],
    recommendations: [{
      Symbol: symbol,
      Total_Score: totalScore,
    }],
    outputs: {
      report: `${symbol.toLowerCase()}_analysis_report.xlsx`,
    },
  };
}

function usersFrom(scope) {
  return (scope.visibleUsers || []).map((user) => user.id);
}

function assertIncludes(actual, expected, message) {
  const actualSet = new Set(actual);
  const missing = expected.filter((value) => !actualSet.has(value));
  assert(missing.length === 0, message, { actual, expected, missing });
}

function assertExactUsers(actual, expected, message) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  assert(
    JSON.stringify(actualSorted) === JSON.stringify(expectedSorted),
    message,
    { actual: actualSorted, expected: expectedSorted },
  );
}

function assertOnlyUserSessions(sessions, userId, message) {
  assert(sessions.length > 0, `${message} Expected at least one session.`);
  assert(sessions.every((session) => session.userId === userId), message, { sessions, userId });
}

function assertOnlyAllowedSessions(sessions, allowedUserIds, message) {
  const allowed = new Set(allowedUserIds);
  assert(sessions.length > 0, `${message} Expected at least one session.`);
  assert(sessions.every((session) => allowed.has(session.userId)), message, { sessions, allowedUserIds });
}

function assertOnlyBilling(events, userId, message) {
  assert(events.length > 0, `${message} Expected at least one billing event.`);
  assert(events.every((event) => event.userId === userId), message, { events, userId });
}

function assertNoUserLeak(events, forbiddenUserIds, message) {
  const forbidden = new Set(forbiddenUserIds);
  const leaked = events.filter((event) => forbidden.has(event.actorUserId) || forbidden.has(event.targetUserId));
  assert(leaked.length === 0, message, { leaked, forbiddenUserIds });
}

async function expectReject(action, message) {
  try {
    await action();
  } catch {
    return;
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
