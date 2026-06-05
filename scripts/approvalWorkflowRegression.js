import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-approval-workflow-"));

process.chdir(tempRoot);

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const {
    assignAdvisor,
    auditIntegritySummary,
    businessMetrics,
    checkoutSubscription,
    createApprovalRequest,
    createUser,
    decideApprovalRequest,
    getAuditEvents,
    listApprovalRequests,
    storageReadinessSummary,
    tenantAccessSummary,
    updateUserRole,
  } = auth;

  const owner = await createAccount(createUser, "Owner", "owner@example.test");
  const customerA = await createAccount(createUser, "Customer A", "customer-a@example.test");
  const customerB = await createAccount(createUser, "Customer B", "customer-b@example.test");
  const advisor = await createAccount(createUser, "Advisor", "advisor@example.test");

  await updateUserRole(owner.id, advisor.id, "advisor");
  await checkoutSubscription(advisor.id, "advisor");
  await assignAdvisor(owner.id, customerA.id, advisor.id);

  const advisorRequest = await createApprovalRequest(advisor.id, {
    customerId: customerA.id,
    title: "Approve AOT rebalance",
    summary: "Reduce concentration and keep risk aligned with the beginner profile.",
    actionType: "rebalance",
    riskLevel: "medium",
    amountThb: 25000,
  });

  assertEqual(advisorRequest.status, "pending", "New advisor request should be pending.");
  assertEqual(advisorRequest.customerId, customerA.id, "Approval request should target Customer A.");

  await expectReject(
    () => createApprovalRequest(advisor.id, {
      customerId: customerB.id,
      title: "Cross-client approval",
    }),
    "Advisor must not create approvals for unassigned customers.",
  );

  assertIncludes((await listApprovalRequests(owner.id)).map((request) => request.id), [advisorRequest.id], "Owner should see advisor approval request.");
  assertIncludes((await listApprovalRequests(advisor.id)).map((request) => request.id), [advisorRequest.id], "Advisor should see assigned customer approval request.");
  assertIncludes((await listApprovalRequests(customerA.id)).map((request) => request.id), [advisorRequest.id], "Customer A should see own approval request.");
  assertNoIds((await listApprovalRequests(customerB.id)).map((request) => request.id), [advisorRequest.id], "Customer B should not see Customer A approval request.");

  await expectReject(
    () => decideApprovalRequest(customerB.id, advisorRequest.id, { decision: "approved" }),
    "Customer B must not decide Customer A approval request.",
  );

  const approved = await decideApprovalRequest(customerA.id, advisorRequest.id, {
    decision: "approved",
    note: "Approved after reviewing risk.",
  });
  assertEqual(approved.status, "approved", "Customer A should approve own request.");
  assertEqual(approved.decidedByUserId, customerA.id, "Approval decision should record deciding customer.");

  await expectReject(
    () => decideApprovalRequest(customerA.id, advisorRequest.id, { decision: "rejected" }),
    "Decided approval request must not be decided twice.",
  );

  const ownerRequest = await createApprovalRequest(owner.id, {
    customerId: customerB.id,
    title: "Confirm high risk action",
    summary: "Customer should confirm before any high risk portfolio action.",
    actionType: "risk_action",
    riskLevel: "high",
    amountThb: 10000,
  });
  const rejected = await decideApprovalRequest(customerB.id, ownerRequest.id, {
    decision: "rejected",
    note: "Not comfortable with this risk.",
  });
  assertEqual(rejected.status, "rejected", "Customer B should reject own request.");

  const ownerScope = await tenantAccessSummary(owner.id);
  const advisorScope = await tenantAccessSummary(advisor.id);
  const customerAScope = await tenantAccessSummary(customerA.id);
  const customerBScope = await tenantAccessSummary(customerB.id);
  assertEqual(ownerScope.dataScope.approvalRequests, 2, "Owner should see all approval requests.");
  assertEqual(advisorScope.dataScope.approvalRequests, 1, "Advisor should see assigned customer approval only.");
  assertEqual(customerAScope.dataScope.approvalRequests, 1, "Customer A should see own approval only.");
  assertEqual(customerBScope.dataScope.approvalRequests, 1, "Customer B should see own approval only.");

  const customerAAudit = await getAuditEvents(customerA.id, { limit: 50 });
  assert(
    customerAAudit.some((event) => event.action === "approval.request_created"),
    "Customer A audit timeline should include approval request creation.",
  );
  assert(
    customerAAudit.some((event) => event.action === "approval.request_approved"),
    "Customer A audit timeline should include approval decision.",
  );
  assertNoIds(customerAAudit.map((event) => event.targetUserId), [customerB.id], "Customer A audit timeline should not leak Customer B.");

  const metrics = await businessMetrics();
  assertEqual(metrics.approvalRequests, 2, "Business metrics should count approval requests.");
  assertEqual(metrics.pendingApprovalRequests, 0, "All approval requests should be decided.");
  assertEqual(metrics.approvedApprovalRequests, 1, "Business metrics should count approved requests.");
  assertEqual(metrics.rejectedApprovalRequests, 1, "Business metrics should count rejected requests.");

  const integrity = await auditIntegritySummary(owner.id);
  assertEqual(integrity.status, "verified", "Approval audit events should keep integrity verified.");
  const storage = await storageReadinessSummary(owner.id);
  assertEqual(storage.readiness.status, "ready", "Approval requests should be storage-ready.");
  assert(storage.schema.collections.some((collection) => collection.name === "approvalRequests"), "Schema should include approvalRequests.");

  const report = {
    ok: true,
    tempRoot,
    approvals: {
      total: metrics.approvalRequests,
      pending: metrics.pendingApprovalRequests,
      approved: metrics.approvedApprovalRequests,
      rejected: metrics.rejectedApprovalRequests,
    },
    scope: {
      owner: ownerScope.dataScope.approvalRequests,
      advisor: advisorScope.dataScope.approvalRequests,
      customerA: customerAScope.dataScope.approvalRequests,
      customerB: customerBScope.dataScope.approvalRequests,
    },
    auditIntegrity: integrity.status,
    storageReadiness: storage.readiness.status,
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

async function expectReject(action, message) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(message);
}

function assertIncludes(actual, expected, message) {
  const actualSet = new Set(actual);
  const missing = expected.filter((value) => !actualSet.has(value));
  assert(missing.length === 0, message, { actual, expected, missing });
}

function assertNoIds(actual, forbidden, message) {
  const actualSet = new Set(actual);
  const leaked = forbidden.filter((value) => actualSet.has(value));
  assert(leaked.length === 0, message, { leaked });
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
