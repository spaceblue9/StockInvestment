const USER_REFERENCE_FIELDS = [
  "userId",
  "customerId",
  "advisorId",
  "actorUserId",
  "targetUserId",
  "requestedByUserId",
  "decidedByUserId",
  "assignedBy",
];

const STATE_ARRAY_KEYS = [
  "users",
  "sessions",
  "organizations",
  "portfolioSnapshots",
  "investorProfiles",
  "billingEvents",
  "paymentSessions",
  "paymentWebhookEvents",
  "planRequests",
  "advisorAssignments",
  "approvalRequests",
  "auditEvents",
];

export function buildTenantScopeForUser(state = {}, viewer = {}, reason = "service_read") {
  const role = normalizeRole(viewer.role);
  if (["owner", "admin"].includes(role)) {
    return {
      mode: "platform",
      reason,
      userIds: uniqueTextValues((state.users || []).map((user) => user.id)),
      organizationIds: uniqueTextValues((state.organizations || []).map((organization) => organization.id)),
    };
  }

  const userIds = new Set([viewer.id].filter(Boolean));
  const organizationIds = new Set([viewer.organizationId].filter(Boolean));

  if (role === "advisor") {
    (state.advisorAssignments || [])
      .filter((assignment) => assignment.advisorId === viewer.id)
      .forEach((assignment) => {
        if (assignment.customerId) {
          userIds.add(assignment.customerId);
        }
      });

    (state.users || [])
      .filter((user) => userIds.has(user.id))
      .forEach((user) => {
        if (user.organizationId) {
          organizationIds.add(user.organizationId);
        }
      });
  }

  return {
    mode: "restricted",
    reason,
    userIds: [...userIds],
    organizationIds: [...organizationIds],
  };
}

export function filterStateByTenantScope(state = {}, rawTenantScope = {}) {
  const tenantScope = normalizeTenantScope(rawTenantScope);
  const scopedState = {
    ...state,
  };

  for (const key of STATE_ARRAY_KEYS) {
    scopedState[key] = Array.isArray(state[key]) ? [...state[key]] : [];
  }

  if (tenantScope.mode === "platform") {
    return scopedState;
  }

  const userIds = new Set(tenantScope.userIds);
  const organizationIds = new Set(tenantScope.organizationIds);
  scopedState.users = scopedState.users.filter((user) => (
    userIds.has(user.id) || organizationIds.has(user.organizationId)
  ));
  scopedState.organizations = scopedState.organizations.filter((organization) => organizationIds.has(organization.id));
  scopedState.sessions = scopedState.sessions.filter((session) => userIds.has(session.userId));
  scopedState.portfolioSnapshots = scopedState.portfolioSnapshots.filter((record) => recordVisible(record, userIds, organizationIds));
  scopedState.investorProfiles = scopedState.investorProfiles.filter((record) => recordVisible(record, userIds, organizationIds));
  scopedState.billingEvents = scopedState.billingEvents.filter((record) => recordVisible(record, userIds, organizationIds));
  scopedState.paymentSessions = scopedState.paymentSessions.filter((record) => recordVisible(record, userIds, organizationIds));
  scopedState.paymentWebhookEvents = scopedState.paymentWebhookEvents.filter((record) => recordVisible(record, userIds, organizationIds));
  scopedState.planRequests = scopedState.planRequests.filter((record) => recordVisible(record, userIds, organizationIds));
  scopedState.advisorAssignments = scopedState.advisorAssignments.filter((record) => (
    userIds.has(record.customerId) || userIds.has(record.advisorId)
  ));
  scopedState.approvalRequests = scopedState.approvalRequests.filter((record) => recordVisible(record, userIds, organizationIds));
  scopedState.auditEvents = scopedState.auditEvents.filter((record) => recordVisible(record, userIds, organizationIds));

  return scopedState;
}

export function tenantScopeSummary(tenantScope = {}) {
  const normalized = normalizeTenantScope(tenantScope);
  return {
    mode: normalized.mode,
    reason: normalized.reason,
    userCount: normalized.userIds.length,
    organizationCount: normalized.organizationIds.length,
  };
}

function recordVisible(record = {}, userIds, organizationIds) {
  if (record.organizationId && organizationIds.has(record.organizationId)) {
    return true;
  }

  return USER_REFERENCE_FIELDS.some((field) => record[field] && userIds.has(record[field]));
}

function normalizeTenantScope(rawTenantScope = {}) {
  const mode = String(rawTenantScope.mode || "restricted").trim().toLowerCase();
  if (["platform", "owner", "admin", "all"].includes(mode)) {
    return {
      mode: "platform",
      reason: cleanText(rawTenantScope.reason) || "platform_operator",
      userIds: uniqueTextValues(rawTenantScope.userIds),
      organizationIds: uniqueTextValues(rawTenantScope.organizationIds),
    };
  }

  return {
    mode: "restricted",
    reason: cleanText(rawTenantScope.reason) || "tenant_scope",
    userIds: uniqueTextValues(rawTenantScope.userIds),
    organizationIds: uniqueTextValues(rawTenantScope.organizationIds),
  };
}

function normalizeRole(role) {
  const normalized = String(role || "customer").trim().toLowerCase();
  return ["owner", "admin", "advisor", "customer"].includes(normalized) ? normalized : "customer";
}

function uniqueTextValues(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => cleanText(value))
    .filter(Boolean))];
}

function cleanText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}
