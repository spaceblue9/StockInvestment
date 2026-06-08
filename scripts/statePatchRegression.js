import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-state-patch-"));

process.chdir(tempRoot);

try {
  const patchService = await import(pathToFileURL(path.join(repoRoot, "src", "services", "statePatchService.js")).href);
  const repository = await import(pathToFileURL(path.join(repoRoot, "src", "services", "stateRepository.js")).href);
  const authService = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const { applyStatePatch, statePatchCapabilities } = patchService;
  const { patchAppState, readAppState, stateRepositoryInfo, writeAppState } = repository;
  const {
    createApprovalRequest,
    createPaymentSession,
    createUser,
    getUserFromRequest,
    loginUser,
    logoutSession,
    recordAuditEvent,
    saveCustomerPortfolioSnapshot,
    saveInvestorProfile,
  } = authService;

  const initialState = sampleState();
  const patched = applyStatePatch(initialState, {
    operations: [
      {
        type: "upsert",
        collection: "portfolioSnapshots",
        record: {
          userId: "user_customer",
          organizationId: "org_customer",
          generatedAt: "2026-06-05T14:00:00.000Z",
          summary: {
            marketValue: 150000,
          },
        },
      },
      {
        type: "upsert",
        collection: "investorProfiles",
        record: {
          userId: "user_customer",
          organizationId: "org_customer",
          goal: "wealth",
          experience: "beginner",
          riskLevel: "medium",
          updatedAt: "2026-06-05T14:00:00.000Z",
        },
      },
      {
        type: "append",
        collection: "auditEvents",
        record: {
          id: "audit_2",
          action: "profile.update",
          actorUserId: "user_customer",
          targetUserId: "user_customer",
          organizationId: "org_customer",
          integrityVersion: "sha256-v1",
          previousHash: "hash_1",
          eventHash: "hash_2",
          createdAt: "2026-06-05T14:00:00.000Z",
        },
      },
      {
        type: "delete",
        collection: "billingEvents",
        key: "billing_stale",
      },
    ],
  });

  assertEqual(initialState.portfolioSnapshots[0].summary.marketValue, 100000, "Pure patch must not mutate source state.");
  assertEqual(patched.summary.upserted, 2, "Patch summary should count upserts.");
  assertEqual(patched.summary.appended, 1, "Patch summary should count appends.");
  assertEqual(patched.summary.deleted, 1, "Patch summary should count deletes.");
  assertEqual(patched.state.users.length, 2, "Patch should preserve unrelated user records.");
  assertEqual(patched.state.organizations.length, 2, "Patch should preserve unrelated organizations.");
  assertEqual(patched.state.portfolioSnapshots[0].summary.marketValue, 150000, "Upsert should merge by collection primary key.");
  assertEqual(patched.state.investorProfiles.length, 1, "Upsert should insert missing profile.");
  assertEqual(patched.state.auditEvents.length, 2, "Append should add audit event.");
  assertEqual(patched.state.billingEvents.length, 0, "Delete should remove matching billing record.");

  await expectReject(
    () => applyStatePatch(initialState, {
      operations: [{ type: "delete", collection: "auditEvents", key: "audit_1" }],
    }),
    "Deleting append-only audit events should be rejected by default.",
  );
  await expectReject(
    () => applyStatePatch(initialState, {
      operations: [{ type: "upsert", collection: "portfolioSnapshots", record: { organizationId: "org_customer" } }],
    }),
    "Upsert missing primary key should be rejected.",
  );
  await expectReject(
    () => applyStatePatch(initialState, {
      operations: [{ type: "append", collection: "auditEvents", record: initialState.auditEvents[0] }],
    }),
    "Append duplicate primary key should be rejected.",
  );

  await writeAppState(initialState);
  const repositoryPatch = await patchAppState({
    operations: [
      {
        type: "upsert",
        collection: "paymentSessions",
        record: {
          id: "payment_1",
          userId: "user_customer",
          organizationId: "org_customer",
          planId: "pro",
          amountThb: 1490,
          status: "pending",
          createdAt: "2026-06-05T14:01:00.000Z",
        },
      },
      {
        type: "append",
        collection: "auditEvents",
        record: {
          id: "audit_3",
          action: "payment.session_created",
          actorUserId: "user_customer",
          targetUserId: "user_customer",
          organizationId: "org_customer",
          integrityVersion: "sha256-v1",
          previousHash: "hash_1",
          eventHash: "hash_3",
          createdAt: "2026-06-05T14:01:00.000Z",
        },
      },
    ],
  });
  const stored = await readAppState();
  const info = stateRepositoryInfo();
  const capabilities = statePatchCapabilities();

  assertEqual(repositoryPatch.summary.upserted, 1, "Repository patch should report upsert operation.");
  assertEqual(repositoryPatch.summary.appended, 1, "Repository patch should report append operation.");
  assertEqual(stored.users.length, 2, "Repository patch should preserve existing users.");
  assertEqual(stored.paymentSessions.length, 1, "Repository patch should write upserted payment session.");
  assertEqual(stored.auditEvents.length, 2, "Repository patch should append audit event.");
  assertEqual(info.patchWrites.available, true, "Repository info should expose patch write capability.");
  assert(capabilities.supportedOperations.includes("upsert"), "Patch capabilities should include upsert.");
  assert(capabilities.supportedOperations.includes("append"), "Patch capabilities should include append.");
  assert(capabilities.supportedOperations.includes("delete"), "Patch capabilities should include delete.");

  const savedProfile = await saveInvestorProfile("user_customer", {
    goal: "income",
    experience: "intermediate",
    riskLevel: "low",
    monthlyBudget: 25000,
    horizonYears: 7,
  });
  const sessionResult = await createPaymentSession("user_customer", "pro");
  const approvalResult = await createApprovalRequest("user_owner", {
    customerId: "user_customer",
    title: "Review first patch write approval",
    summary: "Confirm that approval request creation can use repository patch writes.",
    actionType: "portfolio_review",
    amountThb: 5000,
    riskLevel: "low",
  });
  const storedAfterAdoptedFlows = await readAppState();
  const auditActions = storedAfterAdoptedFlows.auditEvents.map((event) => event.action);

  assertEqual(savedProfile.goal, "income", "Investor profile patch flow should return the saved profile.");
  assertEqual(storedAfterAdoptedFlows.investorProfiles.length, 1, "Investor profile patch flow should upsert one profile.");
  assertEqual(storedAfterAdoptedFlows.investorProfiles[0].riskLevel, "low", "Investor profile patch flow should persist normalized profile fields.");
  assert(storedAfterAdoptedFlows.paymentSessions.some((session) => session.id === sessionResult.paymentSession.id), "Payment session patch flow should persist the created session.");
  assert(storedAfterAdoptedFlows.approvalRequests.some((request) => request.id === approvalResult.id), "Approval request patch flow should persist the created approval.");
  assert(auditActions.includes("profile.update"), "Investor profile patch flow should append an audit event.");
  assert(auditActions.includes("payment.session_created"), "Payment session patch flow should append an audit event.");
  assert(auditActions.includes("approval.request_created"), "Approval request patch flow should append an audit event.");
  assertEqual(storedAfterAdoptedFlows.users.length, 2, "Adopted patch flows should preserve existing users.");

  const registeredUser = await createUser({
    name: "Session Patch Customer",
    email: "session-patch@example.test",
    password: "password123",
  });
  const storedAfterSessionCreate = await readAppState();
  assert(storedAfterSessionCreate.sessions.some((session) => session.id === registeredUser.session.id), "Session create patch flow should append the new session.");

  await logoutSession(registeredUser.session.id);
  const storedAfterLogout = await readAppState();
  assert(!storedAfterLogout.sessions.some((session) => session.id === registeredUser.session.id), "Logout patch flow should delete the session.");
  assert(storedAfterLogout.auditEvents.some((event) => event.action === "auth.logout"), "Logout patch flow should append an audit event.");

  const expiredSession = {
    id: "session_expired_patch",
    userId: "user_customer",
    createdAt: "2026-06-01T00:00:00.000Z",
    expiresAt: "2026-06-01T00:01:00.000Z",
  };
  const stateWithExpiredSession = await readAppState();
  stateWithExpiredSession.sessions.push(expiredSession);
  await writeAppState(stateWithExpiredSession);

  const expiredUser = await getUserFromRequest({
    headers: {
      cookie: `sid=${expiredSession.id}`,
    },
  });
  const storedAfterExpiredCleanup = await readAppState();
  assertEqual(expiredUser, null, "Expired session lookup should not return a user.");
  assert(!storedAfterExpiredCleanup.sessions.some((session) => session.id === expiredSession.id), "Expired session cleanup should delete only the stale session.");

  const standaloneAudit = await recordAuditEvent({
    actorUserId: "user_customer",
    action: "test.auth_session_patch",
    targetUserId: "user_customer",
    details: {
      source: "statePatchRegression",
    },
  });
  const storedAfterStandaloneAudit = await readAppState();
  assertEqual(standaloneAudit.action, "test.auth_session_patch", "Standalone audit patch flow should return the public audit event.");
  assert(storedAfterStandaloneAudit.auditEvents.some((event) => event.id === standaloneAudit.id), "Standalone audit patch flow should append the audit event.");

  await writeAppState({});
  const accountOwner = await createUser({
    name: "First Account Owner",
    email: "first-owner@example.test",
    password: "password123",
  });
  const accountCustomer = await createUser({
    name: "Snapshot Customer",
    email: "snapshot-customer@example.test",
    password: "password123",
  });
  const storedAfterRegistrationPatch = await readAppState();
  const platformOrganization = storedAfterRegistrationPatch.organizations.find((organization) => organization.id === "org_platform");
  const customerOrganization = storedAfterRegistrationPatch.organizations.find((organization) => organization.ownerUserId === accountCustomer.user.id);

  assertEqual(accountOwner.user.role, "owner", "First account patch flow should create an owner.");
  assertEqual(accountCustomer.user.role, "customer", "Second account patch flow should create a customer.");
  assertEqual(storedAfterRegistrationPatch.users.length, 2, "Account registration patch flow should append users.");
  assert(platformOrganization, "Owner registration patch flow should preserve the platform organization.");
  assertEqual(platformOrganization.ownerUserId, accountOwner.user.id, "Owner registration patch flow should assign the platform organization owner.");
  assert(customerOrganization, "Customer registration patch flow should create a customer workspace.");
  assertEqual(accountCustomer.user.organizationId, customerOrganization.id, "Customer registration patch flow should link the customer to their workspace.");

  const forcedOldLoginAt = "2026-01-01T00:00:00.000Z";
  const stateBeforeLoginPatch = await readAppState();
  const customerBeforeLogin = stateBeforeLoginPatch.users.find((user) => user.id === accountCustomer.user.id);
  customerBeforeLogin.lastLoginAt = forcedOldLoginAt;
  await writeAppState(stateBeforeLoginPatch);

  const loginResult = await loginUser({
    email: "snapshot-customer@example.test",
    password: "password123",
  });
  const storedAfterLoginPatch = await readAppState();
  const customerAfterLogin = storedAfterLoginPatch.users.find((user) => user.id === accountCustomer.user.id);

  assert(storedAfterLoginPatch.sessions.some((session) => session.id === loginResult.session.id), "Login patch flow should create a session after updating the user.");
  assert(customerAfterLogin.lastLoginAt !== forcedOldLoginAt, "Login patch flow should persist the updated lastLoginAt timestamp.");
  assert(storedAfterLoginPatch.auditEvents.some((event) => event.action === "auth.login"), "Login patch flow should append an auth.login audit event.");

  const firstSnapshot = await saveCustomerPortfolioSnapshot(accountCustomer.user.id, samplePortfolioSnapshot("AOT", 72000, 65000, 7000, 78, "Hold"));
  const secondSnapshot = await saveCustomerPortfolioSnapshot(accountCustomer.user.id, samplePortfolioSnapshot("PTT", 54000, 60000, -6000, 54, "Reduce 50%"));
  const storedAfterAccountPatchFlows = await readAppState();
  const accountAuditActions = storedAfterAccountPatchFlows.auditEvents.map((event) => event.action);

  assertEqual(firstSnapshot.summary.marketValue, 72000, "Portfolio snapshot patch flow should return the first summary.");
  assertEqual(secondSnapshot.summary.marketValue, 54000, "Portfolio snapshot patch flow should return the updated summary.");
  assertEqual(storedAfterAccountPatchFlows.portfolioSnapshots.length, 1, "Portfolio snapshot patch flow should upsert by userId.");
  assertEqual(storedAfterAccountPatchFlows.portfolioSnapshots[0].summary.marketValue, 54000, "Portfolio snapshot patch flow should persist the latest snapshot.");
  assert(accountAuditActions.includes("auth.register"), "Account registration patch flow should append auth.register audit events.");
  assert(accountAuditActions.includes("analysis.snapshot_saved"), "Portfolio snapshot patch flow should append snapshot audit events.");

  console.log(JSON.stringify({
    ok: true,
    tempRoot,
    purePatch: patched.summary,
    repositoryPatch: repositoryPatch.summary,
    patchMode: info.patchWrites.mode,
    supportedOperations: capabilities.supportedOperations,
    storedCounts: {
      users: storedAfterAccountPatchFlows.users.length,
      sessions: storedAfterAccountPatchFlows.sessions.length,
      portfolioSnapshots: storedAfterAccountPatchFlows.portfolioSnapshots.length,
      investorProfiles: storedAfterAccountPatchFlows.investorProfiles.length,
      paymentSessions: storedAfterAccountPatchFlows.paymentSessions.length,
      approvalRequests: storedAfterAccountPatchFlows.approvalRequests.length,
      auditEvents: storedAfterAccountPatchFlows.auditEvents.length,
    },
    adoptedPatchFlows: {
      investorProfile: savedProfile.userId,
      paymentSession: sessionResult.paymentSession.id,
      approvalRequest: approvalResult.id,
      createdSession: registeredUser.session.id,
      standaloneAudit: standaloneAudit.id,
      accountOwner: accountOwner.user.id,
      accountCustomer: accountCustomer.user.id,
      portfolioSnapshot: storedAfterAccountPatchFlows.portfolioSnapshots[0].userId,
    },
  }, null, 2));
} finally {
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function sampleState() {
  return {
    organizations: [
      {
        id: "org_platform",
        name: "Platform",
        type: "platform",
        createdAt: "2026-06-05T13:00:00.000Z",
        updatedAt: "2026-06-05T13:00:00.000Z",
      },
      {
        id: "org_customer",
        name: "Customer Workspace",
        type: "customer",
        ownerUserId: "user_customer",
        createdAt: "2026-06-05T13:00:00.000Z",
        updatedAt: "2026-06-05T13:00:00.000Z",
      },
    ],
    users: [
      {
        id: "user_owner",
        email: "owner@example.test",
        role: "owner",
        organizationId: "org_platform",
        createdAt: "2026-06-05T13:00:00.000Z",
      },
      {
        id: "user_customer",
        email: "customer@example.test",
        role: "customer",
        organizationId: "org_customer",
        createdAt: "2026-06-05T13:00:00.000Z",
      },
    ],
    sessions: [],
    portfolioSnapshots: [
      {
        userId: "user_customer",
        organizationId: "org_customer",
        generatedAt: "2026-06-05T13:00:00.000Z",
        summary: {
          marketValue: 100000,
        },
      },
    ],
    investorProfiles: [],
    billingEvents: [
      {
        id: "billing_stale",
        userId: "user_customer",
        organizationId: "org_customer",
        invoiceNumber: "INV-OLD",
        planId: "starter",
        amountThb: 790,
        status: "failed",
        createdAt: "2026-06-05T13:00:00.000Z",
      },
    ],
    paymentSessions: [],
    paymentWebhookEvents: [],
    advisorAssignments: [],
    approvalRequests: [],
    auditEvents: [
      {
        id: "audit_1",
        action: "auth.register",
        actorUserId: "user_customer",
        targetUserId: "user_customer",
        organizationId: "org_customer",
        integrityVersion: "sha256-v1",
        previousHash: "",
        eventHash: "hash_1",
        createdAt: "2026-06-05T13:00:00.000Z",
      },
    ],
  };
}

function samplePortfolioSnapshot(symbol, marketValue, costValue, gainLossValue, totalScore, action) {
  return {
    portfolioRows: [
      {
        Symbol: symbol,
        Sector: "Transport",
        Quantity: 1000,
        Avg_Price: costValue / 1000,
        Price: marketValue / 1000,
        Market_Value: marketValue,
        Cost_Value: costValue,
        Gain_Loss_Value: gainLossValue,
        Total_Score: totalScore,
        Advice: action,
        Target_Action: action,
      },
    ],
    recommendations: [
      {
        Symbol: symbol,
        Total_Score: totalScore,
      },
    ],
    outputs: {
      reportPath: `data/outputs/${symbol.toLowerCase()}_analysis_report.xlsx`,
    },
  };
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
