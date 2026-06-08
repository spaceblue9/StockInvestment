import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { buildTenantScopeForUser, filterStateByTenantScope } from "../src/services/tenantScopeService.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-scoped-read-"));

process.chdir(tempRoot);

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const {
    assignAdvisor,
    checkoutSubscription,
    createApprovalRequest,
    createPaymentSession,
    createUser,
    getAuditEvents,
    getBillingHistory,
    getCustomerPortfolioSnapshot,
    getPaymentSessions,
    listApprovalRequests,
    listOrganizations,
    listWorkspaceUsers,
    saveCustomerPortfolioSnapshot,
    tenantAccessSummary,
    updateUserRole,
  } = auth;

  const owner = await createAccount(createUser, "Owner", "owner@example.test");
  const customerA = await createAccount(createUser, "Customer A", "customer-a@example.test");
  const customerB = await createAccount(createUser, "Customer B", "customer-b@example.test");
  const advisor = await createAccount(createUser, "Advisor", "advisor@example.test");

  const advisorUser = await updateUserRole(owner.id, advisor.id, "advisor");
  await checkoutSubscription(advisor.id, "advisor");
  await assignAdvisor(owner.id, customerA.id, advisor.id);
  await checkoutSubscription(customerA.id, "pro");
  await checkoutSubscription(customerB.id, "pro");
  await saveCustomerPortfolioSnapshot(customerA.id, samplePortfolio("AOT", 76));
  await saveCustomerPortfolioSnapshot(customerB.id, samplePortfolio("PTT", 52));
  await createPaymentSession(customerA.id, "advisor");
  await createPaymentSession(customerB.id, "advisor");
  await createApprovalRequest(advisor.id, {
    customerId: customerA.id,
    title: "Review Customer A portfolio",
    summary: "Trim oversized risk and confirm the action plan.",
    actionType: "risk_action",
    amountThb: 12000,
  });

  await expectReject(
    () => createApprovalRequest(advisor.id, {
      customerId: customerB.id,
      title: "Hidden customer request",
      summary: "This should not be allowed.",
    }),
    "Advisor should not create approval requests for unassigned customers.",
  );

  const ownerScope = await tenantAccessSummary(owner.id);
  const advisorScope = await tenantAccessSummary(advisor.id);
  const customerAScope = await tenantAccessSummary(customerA.id);
  const customerBScope = await tenantAccessSummary(customerB.id);

  assertEqual(ownerScope.isolation.scopedRead.mode, "platform", "Owner scoped read should use platform mode.");
  assertEqual(advisorScope.isolation.scopedRead.mode, "restricted", "Advisor scoped read should use restricted mode.");
  assertEqual(customerAScope.isolation.scopedRead.mode, "restricted", "Customer scoped read should use restricted mode.");
  assertEqual(advisorScope.isolation.scopedRead.userCount, 2, "Advisor scope should include advisor and assigned customer only.");
  assertEqual(customerBScope.isolation.scopedRead.userCount, 1, "Customer scope should include only self.");

  assertOnlyUsers(await listWorkspaceUsers(advisor.id), [advisor.id, customerA.id], "Advisor workspace users should be scoped.");
  assertOnlyUsers(await listWorkspaceUsers(customerB.id), [customerB.id], "Customer workspace users should be self-only.");
  assertNoOrganization(await listOrganizations(advisor.id), customerB.organizationId, "Advisor organizations should exclude unassigned customer workspace.");
  assertOnlyPaymentUsers(await getPaymentSessions(advisor.id, { limit: 20 }), [advisor.id, customerA.id], "Advisor payment sessions should be scoped.");
  assertOnlyPaymentUsers(await getPaymentSessions(customerB.id, { limit: 20 }), [customerB.id], "Customer payment sessions should be self-only.");
  assertOnlyBillingUsers(await getBillingHistory(customerA.id), [customerA.id], "Customer A billing should be self-only.");
  assertOnlyBillingUsers(await getBillingHistory(customerB.id), [customerB.id], "Customer B billing should be self-only.");
  assertEqual((await getCustomerPortfolioSnapshot(customerA.id)).summary.holdings, 1, "Customer A portfolio should still load.");
  assertEqual((await getCustomerPortfolioSnapshot(customerB.id)).summary.holdings, 1, "Customer B portfolio should still load.");
  assertNoAuditLeak(await getAuditEvents(advisor.id, { limit: 100 }), [customerB.id], "Advisor audit events should exclude unassigned customer.");
  assertNoApprovalLeak(await listApprovalRequests(advisor.id), [customerB.id], "Advisor approvals should exclude unassigned customer.");

  const directState = {
    users: [
      { id: advisor.id, role: "advisor", organizationId: advisorUser.organizationId },
      { id: customerA.id, role: "customer", organizationId: customerA.organizationId },
      { id: customerB.id, role: "customer", organizationId: customerB.organizationId },
    ],
    organizations: [
      { id: advisorUser.organizationId },
      { id: customerA.organizationId },
      { id: customerB.organizationId },
    ],
    advisorAssignments: [
      { advisorId: advisor.id, customerId: customerA.id },
    ],
    portfolioSnapshots: [
      { userId: customerA.id, organizationId: customerA.organizationId },
      { userId: customerB.id, organizationId: customerB.organizationId },
    ],
    billingEvents: [
      { userId: customerA.id, organizationId: customerA.organizationId },
      { userId: customerB.id, organizationId: customerB.organizationId },
    ],
    auditEvents: [
      { actorUserId: advisor.id, targetUserId: customerA.id, organizationId: customerA.organizationId },
      { actorUserId: customerB.id, targetUserId: customerB.id, organizationId: customerB.organizationId },
    ],
  };
  const tenantScope = buildTenantScopeForUser(directState, directState.users[0], "direct_filter_regression");
  const filteredState = filterStateByTenantScope(directState, tenantScope);
  assertEqual(filteredState.portfolioSnapshots.length, 1, "Direct tenant filter should remove hidden portfolio snapshots.");
  assertEqual(filteredState.billingEvents.length, 1, "Direct tenant filter should remove hidden billing events.");
  assertEqual(filteredState.auditEvents.length, 1, "Direct tenant filter should remove hidden audit events.");

  console.log(JSON.stringify({
    ok: true,
    tempRoot,
    scopedRead: {
      owner: ownerScope.isolation.scopedRead,
      advisor: advisorScope.isolation.scopedRead,
      customer: customerBScope.isolation.scopedRead,
    },
    advisorVisibleUsers: advisorScope.visibleUserCount,
    customerVisibleUsers: customerBScope.visibleUserCount,
  }, null, 2));
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

function samplePortfolio(symbol, totalScore) {
  return {
    portfolioRows: [{
      Symbol: symbol,
      Market_Value: 50000,
      Cost_Value: 45000,
      Gain_Loss_Value: 5000,
      Gain_Loss_Pct: 11.11,
      Total_Score: totalScore,
      Advice: totalScore >= 70 ? "Hold" : "Review",
      Target_Action: totalScore >= 70 ? "Keep Holding" : "Reduce 50%",
    }],
    recommendations: [{
      Symbol: symbol,
      Total_Score: totalScore,
    }],
  };
}

function assertOnlyUsers(users, allowedUserIds, message) {
  const allowed = new Set(allowedUserIds);
  const leaked = users.filter((user) => !allowed.has(user.id));
  assert(leaked.length === 0, message, { leaked, allowedUserIds });
}

function assertNoOrganization(organizations, forbiddenOrganizationId, message) {
  assert(!organizations.some((organization) => organization.id === forbiddenOrganizationId), message, {
    organizations,
    forbiddenOrganizationId,
  });
}

function assertOnlyPaymentUsers(sessions, allowedUserIds, message) {
  const allowed = new Set(allowedUserIds);
  const leaked = sessions.filter((session) => !allowed.has(session.userId));
  assert(leaked.length === 0, message, { leaked, allowedUserIds });
}

function assertOnlyBillingUsers(events, allowedUserIds, message) {
  const allowed = new Set(allowedUserIds);
  const leaked = events.filter((event) => !allowed.has(event.userId));
  assert(leaked.length === 0, message, { leaked, allowedUserIds });
}

function assertNoAuditLeak(events, forbiddenUserIds, message) {
  const forbidden = new Set(forbiddenUserIds);
  const leaked = events.filter((event) => forbidden.has(event.actorUserId) || forbidden.has(event.targetUserId));
  assert(leaked.length === 0, message, { leaked, forbiddenUserIds });
}

function assertNoApprovalLeak(requests, forbiddenUserIds, message) {
  const forbidden = new Set(forbiddenUserIds);
  const leaked = requests.filter((request) => forbidden.has(request.customerId) || forbidden.has(request.requestedByUserId));
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
