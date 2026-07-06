import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-entitlement-policy-"));

process.chdir(tempRoot);

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const {
    assignAdvisor,
    checkoutSubscription,
    createApprovalRequest,
    createUser,
    hasPlanEntitlement,
    listApprovalRequests,
    listWorkspaceUsers,
    requirePlanEntitlement,
    subscriptionPlans,
    updateUserRole,
  } = auth;

  const plans = subscriptionPlans();
  const starterPlan = plans.find((plan) => plan.id === "starter");
  const proPlan = plans.find((plan) => plan.id === "pro");
  const advisorPlan = plans.find((plan) => plan.id === "advisor");
  assert(starterPlan && proPlan && advisorPlan, "Starter, Pro, and Advisor plans should exist.");
  assert(starterPlan.entitlements.includes("analysis.run"), "Starter should include portfolio analysis.");
  assert(!starterPlan.entitlements.includes("simulation.run"), "Starter should not include simulation.");
  assert(proPlan.entitlements.includes("simulation.run"), "Pro should include simulation.");
  assert(proPlan.entitlements.includes("sector.analysis"), "Pro should include sector analysis.");
  assert(!proPlan.entitlements.includes("client.workspace"), "Pro should not include client workspace.");
  assert(advisorPlan.entitlements.includes("client.workspace"), "Advisor should include client workspace.");
  assert(advisorPlan.entitlements.includes("approval.workflow"), "Advisor should include approval workflow.");

  const owner = await createAccount(createUser, "Owner", "owner@example.test");
  const customer = await createAccount(createUser, "Customer", "customer@example.test");
  const advisorAccount = await createAccount(createUser, "Advisor", "advisor@example.test");

  assertEqual(owner.entitlements.operationalOverride, true, "Owner should receive platform operator override.");
  assertEqual(hasPlanEntitlement(owner, "business.metrics"), true, "Owner should access business metrics through operator override.");
  assertEqual(hasPlanEntitlement(customer, "simulation.run"), false, "New customer should not receive Pro entitlements before package approval.");
  assertEqual(hasPlanEntitlement(customer, "client.workspace"), false, "New customer should not receive Advisor workspace entitlements.");

  const starterCheckout = await checkoutSubscription(customer.id, "starter");
  assertEqual(starterCheckout.user.subscription.planId, "starter", "Starter checkout should activate Starter plan.");
  assertEqual(hasPlanEntitlement(starterCheckout.user, "analysis.run"), true, "Starter should keep analysis access.");
  const simulationReject = await expectEntitlementReject(
    () => requirePlanEntitlement(starterCheckout.user, "simulation.run"),
    "Starter should not pass simulation entitlement.",
  );
  assertEqual(simulationReject.requiredPlanId, "pro", "Simulation should require Pro or higher.");
  assertEqual(simulationReject.statusCode, 402, "Entitlement failures should use payment-required semantics.");

  const proCheckout = await checkoutSubscription(customer.id, "pro");
  assertEqual(hasPlanEntitlement(proCheckout.user, "simulation.run"), true, "Pro should unlock simulation.");
  assertEqual(hasPlanEntitlement(proCheckout.user, "sector.analysis"), true, "Pro should unlock sector analysis.");
  assertEqual(hasPlanEntitlement(proCheckout.user, "client.workspace"), false, "Pro should still lock client workspace.");

  await updateUserRole(owner.id, advisorAccount.id, "advisor");
  await assignAdvisor(owner.id, customer.id, advisorAccount.id);
  await expectEntitlementReject(
    () => listWorkspaceUsers(advisorAccount.id),
    "Advisor role without Advisor plan should not view client workspace.",
  );
  await expectEntitlementReject(
    () => createApprovalRequest(advisorAccount.id, {
      customerId: customer.id,
      title: "Starter approval gate",
    }),
    "Advisor role without Advisor plan should not create approval requests.",
  );

  const advisorCheckout = await checkoutSubscription(advisorAccount.id, "advisor");
  assertEqual(hasPlanEntitlement(advisorCheckout.user, "client.workspace"), true, "Advisor plan should unlock client workspace.");
  assertEqual(hasPlanEntitlement(advisorCheckout.user, "approval.workflow"), true, "Advisor plan should unlock approval workflow.");
  const workspaceUsers = await listWorkspaceUsers(advisorAccount.id);
  assertIncludes(workspaceUsers.map((user) => user.id), [advisorAccount.id, customer.id], "Advisor should see self and assigned customer after upgrade.");
  const approvalRequest = await createApprovalRequest(advisorAccount.id, {
    customerId: customer.id,
    title: "Approve rebalance",
    summary: "Advisor plan should allow approval workflow.",
    actionType: "rebalance",
  });
  assertEqual(approvalRequest.status, "pending", "Advisor approval request should be created after upgrade.");
  assertIncludes((await listApprovalRequests(customer.id)).map((request) => request.id), [approvalRequest.id], "Customer should see own approval request.");

  console.log(JSON.stringify({
    ok: true,
    plans: {
      starterFeatures: starterPlan.entitlements.length,
      proFeatures: proPlan.entitlements.length,
      advisorFeatures: advisorPlan.entitlements.length,
    },
    checks: {
      ownerOverride: owner.entitlements.operationalOverride,
      starterSimulationReject: simulationReject.requiredPlanId,
      proSimulation: hasPlanEntitlement(proCheckout.user, "simulation.run"),
      advisorWorkspaceUsers: workspaceUsers.length,
      approvalStatus: approvalRequest.status,
    },
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

async function expectEntitlementReject(action, message) {
  try {
    await action();
  } catch (error) {
    assertEqual(error.code, "PLAN_UPGRADE_REQUIRED", `${message} Expected plan upgrade error.`);
    return error;
  }

  throw new Error(message);
}

function assertIncludes(actual, expected, message) {
  const actualSet = new Set(actual);
  const missing = expected.filter((value) => !actualSet.has(value));
  assert(missing.length === 0, message, { actual, expected, missing });
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
