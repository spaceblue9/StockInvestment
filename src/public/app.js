const healthStatus = document.querySelector("#healthStatus");
const authPanel = document.querySelector("#authPanel");
const accountPanel = document.querySelector("#accountPanel");
const accountName = document.querySelector("#accountName");
const subscriptionBadge = document.querySelector("#subscriptionBadge");
const subscriptionDetails = document.querySelector("#subscriptionDetails");
const authForm = document.querySelector("#authForm");
const authSubmit = document.querySelector("#authSubmit");
const authModeButton = document.querySelector("#authModeButton");
const authMessage = document.querySelector("#authMessage");
const nameField = document.querySelector("#nameField");
const logoutButton = document.querySelector("#logoutButton");
const analysisForm = document.querySelector("#analysisForm");
const runMessage = document.querySelector("#runMessage");
const viewOutput = document.querySelector("#viewOutput");
const customerSnapshot = document.querySelector("#customerSnapshot");
const plansList = document.querySelector("#plansList");
const businessViewButton = document.querySelector("[data-view='business']");

const state = {
  user: null,
  authMode: "register",
  recommendations: [],
  portfolioRows: [],
  activeView: "portfolio",
  savedSnapshot: null,
  plans: [],
  profile: null,
  businessMetrics: null,
  billingEvents: [],
  paymentSessions: [],
  teamUsers: [],
  policy: null,
  auditEvents: [],
  approvalRequests: [],
  organizations: [],
  tenantScope: null,
  operationalReadiness: null,
  entitlementErrors: {},
};

authForm.addEventListener("submit", submitAuth);
authModeButton.addEventListener("click", toggleAuthMode);
logoutButton.addEventListener("click", logout);
analysisForm.addEventListener("submit", runAnalysis);
document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeView = button.dataset.view;
    renderActiveView();
  });
});
document.addEventListener("click", (event) => {
  const upgradeButton = event.target.closest("[data-upgrade-plan]");
  if (upgradeButton) {
    checkoutPlan(upgradeButton.dataset.upgradePlan);
  }
});

await initialize();

async function initialize() {
  await Promise.all([checkHealth(), loadPlans(), loadCurrentUser()]);
  renderAuthState();
  renderPlans();
  if (state.user) {
    await Promise.all([loadSavedPortfolio(), loadInvestorProfile(), loadBillingHistory(), loadPaymentSessions(), loadBusinessMetrics(), loadTeamUsers(), loadOrganizations(), loadAuditEvents(), loadApprovalRequests(), loadTenantScope()]);
    renderAuthState();
  }
  renderActiveView();
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    healthStatus.textContent = data.ok ? "Ready" : "Unavailable";
    healthStatus.classList.toggle("ready", Boolean(data.ok));
  } catch {
    healthStatus.textContent = "Unavailable";
  }
}

async function loadPlans() {
  const response = await fetch("/api/subscription/plans");
  const data = await response.json();
  state.plans = data.plans || [];
}

async function loadCurrentUser() {
  const response = await fetch("/api/auth/me");
  const data = await response.json();
  state.user = data.user || null;
}

async function loadSavedPortfolio() {
  const response = await fetch("/api/customer/portfolio");
  const data = await response.json();
  if (data.ok && data.snapshot) {
    state.savedSnapshot = data.snapshot;
    state.portfolioRows = data.snapshot.portfolioRows || [];
    state.recommendations = data.snapshot.recommendations || [];
  }
  renderSnapshot();
}

async function loadInvestorProfile() {
  const response = await fetch("/api/customer/profile");
  const data = await response.json();
  if (data.ok) {
    state.profile = data.profile;
  }
}

async function loadBusinessMetrics() {
  if (!canViewBusinessMetrics()) {
    state.businessMetrics = null;
    state.operationalReadiness = null;
    return;
  }

  const response = await fetch("/api/admin/metrics");
  const data = await response.json();
  if (data.ok) {
    state.businessMetrics = data.metrics;
    await loadOperationalReadiness();
    return;
  }

  state.businessMetrics = null;
  state.operationalReadiness = null;
}

async function loadOperationalReadiness() {
  if (!canViewBusinessMetrics()) {
    state.operationalReadiness = null;
    return;
  }

  const response = await fetch("/api/ops/readiness");
  const data = await response.json();
  if (data.ok) {
    state.operationalReadiness = data.readiness;
    return;
  }

  state.operationalReadiness = null;
}

async function loadBillingHistory() {
  const response = await fetch("/api/customer/billing");
  const data = await response.json();
  if (data.ok) {
    state.billingEvents = data.events || [];
  }
}

async function loadPaymentSessions() {
  if (!state.user) {
    state.paymentSessions = [];
    return;
  }

  const response = await fetch("/api/customer/payments?limit=20");
  const data = await response.json();
  if (data.ok) {
    state.paymentSessions = data.sessions || [];
  }
}

async function loadAuditEvents() {
  if (!state.user) {
    state.auditEvents = [];
    return;
  }

  const response = await fetch("/api/audit/events?limit=40");
  const data = await response.json();
  if (data.ok) {
    state.auditEvents = data.events || [];
  }
}

async function loadApprovalRequests() {
  if (!state.user) {
    state.approvalRequests = [];
    return;
  }

  const response = await fetch("/api/approvals?limit=60");
  const data = await response.json();
  if (data.ok) {
    state.approvalRequests = data.requests || [];
  }
}

async function loadTeamUsers() {
  if (!canViewWorkspace()) {
    state.teamUsers = [];
    return;
  }

  const response = await fetch("/api/admin/users");
  const data = await response.json();
  if (data.ok) {
    state.teamUsers = data.users || [];
    state.policy = data.policy || state.policy;
  }
}

async function loadOrganizations() {
  if (!state.user) {
    state.organizations = [];
    return;
  }

  const response = await fetch("/api/admin/organizations");
  const data = await response.json();
  if (data.ok) {
    state.organizations = data.organizations || [];
    state.policy = data.policy || state.policy;
  }
}

async function loadTenantScope() {
  if (!state.user) {
    state.tenantScope = null;
    return;
  }

  const response = await fetch("/api/tenant/scope");
  const data = await response.json();
  if (data.ok) {
    state.tenantScope = data.scope || null;
  }
}

async function submitAuth(event) {
  event.preventDefault();
  authMessage.textContent = state.authMode === "register" ? "Creating account..." : "Signing in...";
  const formData = new FormData(authForm);
  const endpoint = state.authMode === "register" ? "/api/auth/register" : "/api/auth/login";
  const payload = Object.fromEntries(formData.entries());

  if (state.authMode === "login") {
    delete payload.name;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!data.ok) {
    authMessage.textContent = data.message || "Authentication failed.";
    return;
  }

  state.user = data.user;
  authForm.reset();
  authMessage.textContent = "";
  renderAuthState();
  renderPlans();
  await Promise.all([loadSavedPortfolio(), loadInvestorProfile(), loadBillingHistory(), loadPaymentSessions(), loadBusinessMetrics(), loadTeamUsers(), loadOrganizations(), loadAuditEvents(), loadApprovalRequests(), loadTenantScope()]);
  renderAuthState();
  renderActiveView();
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  state.user = null;
  state.savedSnapshot = null;
  state.profile = null;
  state.businessMetrics = null;
  state.billingEvents = [];
  state.paymentSessions = [];
  state.teamUsers = [];
  state.policy = null;
  state.auditEvents = [];
  state.approvalRequests = [];
  state.organizations = [];
  state.tenantScope = null;
  state.entitlementErrors = {};
  state.portfolioRows = [];
  state.recommendations = [];
  renderAuthState();
  renderPlans();
  renderSnapshot();
  renderActiveView();
}

function toggleAuthMode() {
  state.authMode = state.authMode === "register" ? "login" : "register";
  renderAuthState();
}

function renderAuthState() {
  const signedIn = Boolean(state.user);
  authPanel.hidden = signedIn;
  accountPanel.hidden = !signedIn;
  logoutButton.hidden = !signedIn;
  businessViewButton.hidden = !canSeeWorkspaceNav();
  nameField.hidden = state.authMode === "login";
  authSubmit.textContent = state.authMode === "register" ? "Create account" : "Sign in";
  authModeButton.textContent = state.authMode === "register"
    ? "I already have an account"
    : "Create a new account";

  if (!signedIn) {
    return;
  }

  const subscription = state.user.subscription || {};
  const entitlements = state.user.entitlements || {};
  const latestBillingEvent = state.billingEvents[0];
  const latestPaymentSession = state.paymentSessions[0];
  const tenantScope = state.tenantScope;
  const pendingApprovalCount = state.approvalRequests.filter((request) => request.status === "pending").length;
  accountName.textContent = state.user.name || "Investor";
  subscriptionBadge.textContent = `${subscription.plan || "Pro"} ${subscription.status || "active"}`;
  subscriptionDetails.innerHTML = `
    <span>Role: ${escapeHtml(state.user.role || "customer")}</span>
    ${pendingApprovalCount ? `<span>Approvals pending: ${formatNumber(pendingApprovalCount)}</span>` : ""}
    ${tenantScope ? `<span>Scope: ${formatNumber(tenantScope.visibleOrganizationCount || 0)} workspace(s), ${formatNumber(tenantScope.visibleUserCount || 0)} user(s)</span>` : ""}
    <span>${money(subscription.priceThb || 0)} / month</span>
    <span>Plan access: ${formatNumber((entitlements.effectiveFeatures || []).length)} feature(s)</span>
    ${(entitlements.lockedFeatures || []).length ? `<span>Upgrade unlocks: ${formatNumber(entitlements.lockedFeatures.length)} feature(s)</span>` : ""}
    <span>Renewal: ${formatDate(subscription.renewsAt)}</span>
    <span>Billing: ${escapeHtml(subscription.provider || "trial")}</span>
    ${latestPaymentSession ? `<span>Payment: ${escapeHtml(latestPaymentSession.status)} · ${escapeHtml(latestPaymentSession.provider)}</span>` : ""}
    ${latestBillingEvent ? `<span>Latest invoice: ${escapeHtml(latestBillingEvent.invoiceNumber)} · ${money(latestBillingEvent.amountThb || 0)}</span>` : ""}
    <span>${state.user.email}</span>
  `;
}

function renderPlans() {
  const currentPlanId = getCurrentPlanId();
  const subscriptionStatus = state.user?.subscription?.status || "";
  plansList.innerHTML = state.plans.map((plan) => `
    <div class="plan-card ${plan.highlighted ? "highlighted" : ""}">
      <strong>${escapeHtml(plan.name)} · ${money(plan.priceThb)} / month</strong>
      <span class="muted">${escapeHtml(plan.billing)}</span>
      <p class="plan-meta">${escapeHtml(plan.bestFor || "")}</p>
      <div class="plan-tags">
        <span>${formatNumber((plan.entitlements || []).length)} features</span>
        <span>${formatNumber(plan.limits?.clientWorkspaces || 0)} client workspaces</span>
      </div>
      <ul>${(plan.features || []).map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
      <button class="plan-action" type="button" data-plan-id="${escapeHtml(plan.id)}"${state.user && currentPlanId === plan.id && subscriptionStatus === "active" ? " disabled" : ""}>
        ${!state.user ? "Sign in to subscribe" : currentPlanId === plan.id && subscriptionStatus === "active" ? "Current plan" : currentPlanId === plan.id ? `Activate ${escapeHtml(plan.name)}` : `Switch to ${escapeHtml(plan.name)}`}
      </button>
    </div>
  `).join("");
  plansList.insertAdjacentHTML("afterbegin", `<p id="billingMessage" class="muted">Choose a monthly plan to create a payment session. Local mode completes instantly; external providers return a checkout link.</p>`);
  plansList.querySelectorAll("[data-plan-id]").forEach((button) => {
    button.addEventListener("click", () => checkoutPlan(button.dataset.planId));
  });
}

async function checkoutPlan(planId) {
  const billingMessage = document.querySelector("#billingMessage");
  if (!state.user) {
    billingMessage.textContent = "Please sign in before choosing a plan.";
    return;
  }

  billingMessage.textContent = "Creating payment session...";
  plansList.querySelectorAll("[data-plan-id]").forEach((button) => {
    button.disabled = true;
  });

  const response = await fetch("/api/subscription/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  const data = await response.json();

  if (!data.ok) {
    renderPlans();
    document.querySelector("#billingMessage").textContent = data.message || "Checkout failed.";
    return;
  }

  state.user = data.user;
  state.billingEvents = [data.billingEvent, ...state.billingEvents].filter(Boolean);
  state.paymentSessions = [data.paymentSession, ...state.paymentSessions].filter(Boolean);
  renderAuthState();
  renderPlans();
  const updatedBillingMessage = document.querySelector("#billingMessage");
  if (data.paymentSession?.requiresRedirect && data.paymentSession?.checkoutUrl) {
    updatedBillingMessage.innerHTML = `Payment session created with ${escapeHtml(data.paymentSession.provider)}. <a href="${escapeHtml(data.paymentSession.checkoutUrl)}" target="_blank" rel="noopener">Open secure checkout</a>`;
  } else {
    updatedBillingMessage.textContent = data.duplicate
      ? `Payment webhook was already processed for ${data.user.subscription?.plan || "plan"}.`
      : `Payment succeeded via local gateway. Subscribed to ${data.user.subscription?.plan || "plan"}.`;
  }
  await Promise.all([loadBillingHistory(), loadPaymentSessions(), loadBusinessMetrics(), loadAuditEvents(), loadApprovalRequests(), loadTenantScope()]);
  renderAuthState();
  if (state.activeView === "business") {
    renderBusinessView();
  } else if (state.activeView === "approvals") {
    renderApprovalsView();
  } else {
    renderActiveView();
  }
}

async function runAnalysis(event) {
  event.preventDefault();

  if (!state.user) {
    runMessage.textContent = "Please create an account or sign in before running analysis.";
    return;
  }

  runMessage.textContent = "Fetching market data and building your action plan...";

  try {
    const formData = new FormData(analysisForm);
    const response = await fetch("/api/analysis/run", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!data.ok) {
      runMessage.textContent = data.message || "Analysis failed.";
      return;
    }

    const messages = [
      `Fetched ${data.count} stocks from ${data.symbols.length} symbols.`,
      `Generated ${data.recommendationCount} scored rows.`,
      `<a href="/api/analysis/raw">Download raw CSV</a>`,
      `<a href="/api/analysis/recommended">Download recommendations</a>`,
    ];

    if (data.portfolioReport) {
      messages.push(`Generated ${data.portfolioReport.count} portfolio rows.`);
      messages.push(`<a href="${data.portfolioReport.downloadUrl}">Download portfolio report</a>`);
    }

    messages.push(data.message);
    runMessage.innerHTML = messages.join("<br>");
    state.recommendations = data.recommendations || [];
    state.portfolioRows = data.portfolioRows || [];
    state.savedSnapshot = data.customerSnapshot || null;
    await Promise.all([loadBusinessMetrics(), loadAuditEvents(), loadApprovalRequests(), loadTenantScope()]);
    renderAuthState();
    state.activeView = state.portfolioRows.length ? "portfolio" : "screener";
    renderSnapshot();
    renderActiveView();
  } catch (error) {
    runMessage.textContent = error.message;
  }
}

function renderSnapshot() {
  const snapshot = state.savedSnapshot;
  if (!snapshot) {
    customerSnapshot.innerHTML = `
      <span>No portfolio saved yet</span>
      <strong>Run analysis to create your first snapshot.</strong>
    `;
    return;
  }

  const summary = snapshot.summary || {};
  customerSnapshot.innerHTML = `
    <span>Last saved: ${formatDate(snapshot.generatedAt)}</span>
    <strong>${money(summary.marketValue || 0)} · ${formatNumber(summary.gainLossPct || 0)}% P/L</strong>
    <p class="muted">${summary.holdings || 0} holdings · ${summary.urgentActions || 0} urgent actions · Avg score ${formatNumber(summary.avgScore || 0)}</p>
  `;
}

function renderActiveView() {
  if (!state.user) {
    viewOutput.innerHTML = `
      <div class="metric-grid">
        ${metric("Step 1", "Create account")}
        ${metric("Step 2", "Upload portfolio")}
        ${metric("Step 3", "Read the action plan")}
      </div>
      <p class="muted">StockFlix is designed to explain portfolio health in plain language before showing advanced tables.</p>
    `;
    return;
  }

  if (state.activeView === "portfolio") {
    renderPortfolioView();
    return;
  }

  if (state.activeView === "screener") {
    renderScreenerView();
    return;
  }

  if (state.activeView === "approvals") {
    if (["owner", "admin", "advisor"].includes(state.user?.role) && !hasEntitlement("approval.workflow")) {
      viewOutput.innerHTML = renderLockedFeature("approval.workflow");
      return;
    }

    renderApprovalsView();
    return;
  }

  if (state.activeView === "sector") {
    if (!hasEntitlement("sector.analysis")) {
      viewOutput.innerHTML = renderLockedFeature("sector.analysis");
      return;
    }

    renderSectorView();
    return;
  }

  if (state.activeView === "onboarding") {
    renderOnboardingView();
    return;
  }

  if (state.activeView === "business") {
    if (!canViewWorkspace()) {
      const featureId = hasRolePermission("business_metrics") ? "business.metrics" : "client.workspace";
      viewOutput.innerHTML = renderLockedFeature(featureId);
      return;
    }

    renderBusinessView();
    return;
  }

  if (!hasEntitlement("simulation.run")) {
    viewOutput.innerHTML = renderLockedFeature("simulation.run");
    return;
  }

  renderSimulationView();
}

function renderPortfolioView() {
  if (!state.portfolioRows.length) {
    viewOutput.innerHTML = `<p class="muted">Upload a portfolio and run analysis to see your personalized action plan.</p>`;
    return;
  }

  const totalMarketValue = sum(state.portfolioRows, "Market_Value");
  const totalCostValue = sum(state.portfolioRows, "Cost_Value");
  const totalGainLoss = sum(state.portfolioRows, "Gain_Loss_Value");
  const gainLossPct = totalCostValue ? (totalGainLoss / totalCostValue) * 100 : 0;
  const urgentRows = state.portfolioRows.filter((row) => /Exit|Reduce|Sell/i.test(String(row.Target_Action || row.Advice || "")));
  const rows = state.portfolioRows
    .slice()
    .sort((left, right) => numberValue(right.Market_Value) - numberValue(left.Market_Value));

  viewOutput.innerHTML = `
    <div class="metric-grid">
      ${metric("Portfolio Value", money(totalMarketValue))}
      ${metric("Gain/Loss", `${money(totalGainLoss)} (${formatNumber(gainLossPct)}%)`)}
      ${metric("Urgent Actions", urgentRows.length)}
      ${metric("Avg Score", formatNumber(average(rows, "Total_Score")))}
    </div>
    ${renderBeginnerGuidance({ gainLossPct, urgentRows, avgScore: average(rows, "Total_Score") })}
    ${renderPortfolioVisuals(rows)}
    <h3>Recommended actions</h3>
    ${renderTable(rows, [
      "Symbol",
      "Price",
      "Total_Score",
      "Advice",
      "Target_Action",
      "Gain_Loss_Pct",
      "RRR",
      "Trend_Status",
    ])}
  `;
}

function renderBeginnerGuidance({ gainLossPct, urgentRows, avgScore }) {
  const profile = state.profile || {};
  const riskText = {
    low: "เน้นลดความเสี่ยงก่อนเพิ่มผลตอบแทน",
    medium: "บาลานซ์โอกาสและการป้องกันเงินต้น",
    high: "รับความผันผวนได้ แต่ต้องมีจุดตัดขาดทุน",
  }[profile.riskLevel] || "ตั้งค่าระดับความเสี่ยงในหน้า Guide";
  const health = avgScore >= 70 ? "พอร์ตโดยรวมดูแข็งแรง" : avgScore >= 50 ? "พอร์ตยังพอไปต่อได้ แต่ควรคัดหุ้นอ่อนออก" : "พอร์ตมีความเสี่ยงสูง ควรลดหุ้นคะแนนต่ำ";
  const action = urgentRows.length
    ? `มี ${urgentRows.length} รายการที่ควรตรวจทันที เช่น Reduce, Sell หรือ Exit`
    : "ยังไม่มีสัญญาณเร่งด่วน ให้ติดตามโซนซื้อขายและถือวินัย";

  return `
    <div class="guidance-grid">
      <div class="guidance-card"><span>Portfolio health</span><strong>${escapeHtml(health)}</strong></div>
      <div class="guidance-card"><span>Risk style</span><strong>${escapeHtml(riskText)}</strong></div>
      <div class="guidance-card"><span>Next action</span><strong>${escapeHtml(action)}</strong></div>
      <div class="guidance-card"><span>P/L context</span><strong>${gainLossPct >= 0 ? "กำไรอยู่ ให้เน้นปกป้องกำไร" : "ขาดทุนอยู่ ให้ดู Recovery % และ Stop Loss"}</strong></div>
    </div>
  `;
}

function renderOnboardingView() {
  const profile = state.profile || {
    goal: "wealth",
    experience: "beginner",
    riskLevel: "medium",
    monthlyBudget: 5000,
    horizonYears: 5,
  };
  const goalLabels = {
    wealth: "สร้างความมั่งคั่งระยะยาว",
    income: "สร้างกระแสเงินสดจากปันผล",
    retirement: "เตรียมเงินเกษียณ",
    learning: "เรียนรู้ก่อนลงทุนจริงจัง",
  };
  const experienceLabels = {
    beginner: "มือใหม่ ต้องการคำอธิบายง่าย",
    intermediate: "พอเข้าใจพื้นฐานและอ่านงบได้บ้าง",
    advanced: "ลงทุนมานาน ต้องการเครื่องมือคัดกรองเร็ว",
  };
  const riskLabels = {
    low: "ระวังเงินต้นเป็นหลัก",
    medium: "รับความผันผวนได้ระดับกลาง",
    high: "รับความเสี่ยงสูงเพื่อโอกาสเติบโต",
  };
  const profileSaved = Boolean(state.profile);

  viewOutput.innerHTML = `
    <div class="metric-grid">
      ${metric("Goal", goalLabels[profile.goal] || "-")}
      ${metric("Experience", experienceLabels[profile.experience] || "-")}
      ${metric("Risk", riskLabels[profile.riskLevel] || "-")}
      ${metric("Monthly Budget", money(profile.monthlyBudget || 0))}
    </div>
    <div class="guidance-grid">
      <div class="guidance-card"><span>Recommended pace</span><strong>${profile.riskLevel === "low" ? "ทยอยลงทุนและถือเงินสดสำรองมากขึ้น" : profile.riskLevel === "high" ? "ลงทุนได้เชิงรุก แต่ต้องใช้ Stop Loss ทุกครั้ง" : "แบ่งเงินลงทุนเป็นรอบและติดตามคะแนนพอร์ต"}</strong></div>
      <div class="guidance-card"><span>Learning mode</span><strong>${profile.experience === "beginner" ? "ระบบจะเน้นภาษาง่ายและ action ที่ชัดเจน" : "ใช้ Screener และ Sector เพื่อค้นหาโอกาสเพิ่ม"}</strong></div>
      <div class="guidance-card"><span>Time horizon</span><strong>${formatNumber(profile.horizonYears || 0)} years · ${profile.horizonYears >= 5 ? "เหมาะกับการเน้นคุณภาพกิจการ" : "ควรระวังหุ้นผันผวนสูง"}</strong></div>
      <div class="guidance-card"><span>Status</span><strong>${profileSaved ? `Updated ${formatDate(profile.updatedAt)}` : "Save this profile before your next analysis"}</strong></div>
    </div>
    <form id="profileForm" class="profile-form">
      <label>
        Investment goal
        <select name="goal">
          ${option("wealth", goalLabels.wealth, profile.goal)}
          ${option("income", goalLabels.income, profile.goal)}
          ${option("retirement", goalLabels.retirement, profile.goal)}
          ${option("learning", goalLabels.learning, profile.goal)}
        </select>
      </label>
      <label>
        Experience
        <select name="experience">
          ${option("beginner", experienceLabels.beginner, profile.experience)}
          ${option("intermediate", experienceLabels.intermediate, profile.experience)}
          ${option("advanced", experienceLabels.advanced, profile.experience)}
        </select>
      </label>
      <label>
        Risk level
        <select name="riskLevel">
          ${option("low", riskLabels.low, profile.riskLevel)}
          ${option("medium", riskLabels.medium, profile.riskLevel)}
          ${option("high", riskLabels.high, profile.riskLevel)}
        </select>
      </label>
      <label>
        Monthly budget
        <input name="monthlyBudget" type="number" min="0" step="500" value="${numberValue(profile.monthlyBudget)}">
      </label>
      <label>
        Holding horizon
        <input name="horizonYears" type="number" min="1" max="50" value="${numberValue(profile.horizonYears)}">
      </label>
      <button type="submit">Save guide profile</button>
    </form>
    <p id="profileMessage" class="muted">${profileSaved ? "Profile saved. Portfolio guidance will use this context." : "Tell StockFlix how you invest so the guidance can speak your language."}</p>
  `;

  document.querySelector("#profileForm").addEventListener("submit", saveProfile);
}

async function saveProfile(event) {
  event.preventDefault();
  const profileMessage = document.querySelector("#profileMessage");
  profileMessage.textContent = "Saving investor profile...";
  const payload = Object.fromEntries(new FormData(event.target).entries());

  const response = await fetch("/api/customer/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!data.ok) {
    profileMessage.textContent = data.message || "Profile could not be saved.";
    return;
  }

  state.profile = data.profile;
  await Promise.all([loadBusinessMetrics(), loadAuditEvents(), loadApprovalRequests(), loadTenantScope()]);
  renderAuthState();
  renderOnboardingView();
}

function renderBusinessView() {
  if (canViewBusinessMetrics() && !state.businessMetrics) {
    viewOutput.innerHTML = `<p class="muted">Loading business metrics...</p>`;
    Promise.all([loadBusinessMetrics(), loadTeamUsers(), loadOrganizations(), loadApprovalRequests()])
      .then(renderBusinessView)
      .catch(() => {
        viewOutput.innerHTML = `<p class="muted">Business metrics are not available for this account.</p>`;
      });
    return;
  }

  if (!canViewBusinessMetrics()) {
    viewOutput.innerHTML = `
      <div class="metric-grid">
        ${metric("Workspace", "Advisor Clients")}
        ${metric("Assigned Clients", state.teamUsers.filter((user) => user.role === "customer").length)}
        ${metric("Visible Workspaces", state.organizations.length)}
        ${metric("Completed Profiles", state.teamUsers.filter((user) => user.profileCompleted).length)}
        ${metric("Saved Portfolios", state.teamUsers.filter((user) => user.portfolioSummary).length)}
      </div>
      ${renderTenantScopeSummary()}
      ${renderWorkspaceSummary()}
      ${renderApprovalWorkspace()}
      ${renderTeamWorkspace()}
      <h3>Recent payments</h3>
      ${renderPaymentSessions()}
      <h3>Recent activity</h3>
      ${renderActivityTimeline()}
    `;
    attachTeamActions();
    attachOrganizationActions();
    attachApprovalActions();
    return;
  }

  const metrics = state.businessMetrics;
  const readiness = state.operationalReadiness;
  const planRows = Object.entries(metrics.usersByPlan || {}).map(([plan, users]) => ({
    Plan: plan,
    Users: users,
    Share_Pct: metrics.users ? (users / metrics.users) * 100 : 0,
  }));
  const roleRows = Object.entries(metrics.usersByRole || {}).map(([role, users]) => ({
    Role: role,
    Users: users,
    Share_Pct: metrics.users ? (users / metrics.users) * 100 : 0,
  }));
  const billingRows = (metrics.recentBillingEvents || []).map((event) => ({
    Invoice: event.invoiceNumber,
    Plan: event.planName,
    Amount_THB: event.amountThb,
    Status: event.status,
    Date: formatDate(event.createdAt),
  }));
  const paymentRows = (metrics.recentPaymentSessions || state.paymentSessions || []).map((session) => ({
    Created: formatDateTime(session.createdAt),
    Plan: session.planName,
    Amount_THB: session.amountThb,
    Status: session.status,
    Provider: session.provider,
    Webhooks: session.webhookEventCount || 0,
  }));
  const webhookRows = (metrics.recentPaymentWebhookEvents || []).map((event) => ({
    Created: formatDateTime(event.createdAt),
    Event: event.eventType,
    Status: event.status,
    Source: event.source || "-",
    Verified: event.signatureVerified ? "Yes" : event.verificationStatus || "No",
    Message: event.message || "-",
  }));
  const pricingRows = (metrics.plans || []).map((plan) => ({
    Plan: plan.name,
    Price_THB: plan.priceThb,
    Billing: plan.billing,
    Focus: (plan.features || []).slice(0, 2).join(", "),
  }));
  const profileCompletionPct = metrics.users ? (metrics.completedProfiles / metrics.users) * 100 : 0;
  const portfolioAttachPct = metrics.users ? (metrics.savedPortfolios / metrics.users) * 100 : 0;

  viewOutput.innerHTML = `
    <div class="metric-grid">
      ${metric("Users", metrics.users || 0)}
      ${metric("Paid Users", metrics.paidUsers || 0)}
      ${metric("MRR Estimate", money(metrics.mrrEstimate || 0))}
      ${metric("Revenue Collected", money(metrics.revenueCollected || 0))}
      ${metric("Trials", metrics.trials || 0)}
      ${metric("Trial Potential", money(metrics.trialMrrPotential || 0))}
      ${metric("ARPU", money(metrics.arpu || 0))}
      ${metric("Saved Portfolios", metrics.savedPortfolios || 0)}
      ${metric("Advisor Assignments", metrics.advisorAssignments || 0)}
      ${metric("Activity Events", metrics.auditEvents || state.auditEvents.length)}
      ${metric("Workspaces", metrics.organizations || state.organizations.length)}
      ${metric("Customer Workspaces", metrics.customerWorkspaces || 0)}
      ${metric("Platform Members", metrics.platformMembers || 0)}
      ${metric("Pending Payments", metrics.pendingPaymentSessions || 0)}
      ${metric("Failed Payments", metrics.failedPaymentSessions || 0)}
      ${metric("Pending Approvals", metrics.pendingApprovalRequests || 0)}
      ${metric("Approved Approvals", metrics.approvedApprovalRequests || 0)}
      ${metric("Rejected Approvals", metrics.rejectedApprovalRequests || 0)}
      ${metric("Webhook Events", metrics.webhookEvents || 0)}
      ${metric("Verified Signatures", metrics.verifiedWebhookEvents || 0)}
      ${metric("Rejected Webhooks", metrics.rejectedWebhookEvents || 0)}
      ${metric("Webhook Tolerance", `${metrics.webhookSecurity?.toleranceSeconds || 0}s`)}
      ${metric("Audit Integrity", metrics.auditIntegrity?.status || "verified")}
      ${metric("Audit Hash Gaps", metrics.auditIntegrity?.invalidEvents || 0)}
      ${metric("Last Audit Hash", metrics.auditIntegrity?.lastHashPreview || "-")}
      ${metric("Audit Mirror", metrics.auditTrail?.status || "synced")}
      ${metric("Audit Mirror Gaps", metrics.auditTrail?.missingFromTrailCount || 0)}
      ${metric("External Audit", metrics.auditTrail?.external?.status || "disabled")}
      ${metric("External Audit Gaps", metrics.auditTrail?.external?.missingFromExternalCount || 0)}
      ${metric("Ops Readiness", readiness?.status || "loading")}
      ${metric("Ops Alerts", readiness?.alerts?.length || 0)}
      ${metric("DB Readiness", metrics.storageReadiness?.status || "ready")}
      ${metric("DB Blockers", metrics.storageReadiness?.blockerCount || 0)}
      ${metric("Schema Version", metrics.storageReadiness?.schemaVersion || "-")}
    </div>
    <div class="guidance-grid">
      <div class="guidance-card"><span>Activation</span><strong>${formatNumber(profileCompletionPct)}% completed investor profile</strong></div>
      <div class="guidance-card"><span>Portfolio attach</span><strong>${formatNumber(portfolioAttachPct)}% saved at least one portfolio</strong></div>
      <div class="guidance-card"><span>Live usage</span><strong>${metrics.activeSessions || 0} active sessions</strong></div>
      <div class="guidance-card"><span>Workspace model</span><strong>${metrics.tenantMetadata?.totalMissingOrganizationId ? "Some records still need workspace metadata" : "Tenant metadata is attached to critical records"}</strong></div>
      <div class="guidance-card"><span>Webhook security</span><strong>${metrics.webhookSecurity?.secretConfigured ? "Production secret configured" : "Using local demo secret for signed webhook tests"}</strong></div>
      <div class="guidance-card"><span>Payment gateway</span><strong>${metrics.paymentGateway?.provider || "local_gateway"} · ${metrics.paymentGateway?.configured ? "configured" : "needs config"}</strong></div>
      <div class="guidance-card"><span>Audit trail</span><strong>${metrics.auditIntegrity?.status === "verified" ? "Activity timeline hash chain is verified" : "Audit hash chain needs review"}</strong></div>
      <div class="guidance-card"><span>Audit mirror</span><strong>${metrics.auditTrail?.status === "synced" ? "Append-only audit mirror is synced" : "Audit mirror needs review"}</strong></div>
      <div class="guidance-card"><span>External audit</span><strong>${metrics.auditTrail?.external?.enabled ? `Provider ${metrics.auditTrail.external.provider} is ${metrics.auditTrail.external.status}` : "External immutable provider is disabled until configured"}</strong></div>
      <div class="guidance-card"><span>Database migration</span><strong>${metrics.storageReadiness?.status === "ready" ? "Local state is ready for database mapping" : "Storage readiness needs review before migration"}</strong></div>
      <div class="guidance-card"><span>Operational readiness</span><strong>${readiness ? `${readiness.status} · ${readiness.summary?.criticalAlerts || 0} critical · ${readiness.summary?.warningAlerts || 0} warning` : "Loading operational checks"}</strong></div>
    </div>
    ${renderOperationalReadiness(readiness)}
    ${renderBusinessFunnel(metrics, profileCompletionPct, portfolioAttachPct)}
    ${renderTenantScopeSummary()}
    ${renderWorkspaceSummary(metrics.recentOrganizations || state.organizations)}
    ${renderApprovalWorkspace(metrics.recentApprovalRequests || state.approvalRequests)}
    <h3>Recent activity</h3>
    ${renderActivityTimeline(metrics.recentAuditEvents || state.auditEvents)}
    <h3>Users by plan</h3>
    ${renderTable(planRows, ["Plan", "Users", "Share_Pct"])}
    <h3>Users by role</h3>
    ${renderTable(roleRows, ["Role", "Users", "Share_Pct"])}
    ${renderTeamWorkspace()}
    <h3>Recent payments</h3>
    ${renderTable(paymentRows, ["Created", "Plan", "Amount_THB", "Status", "Provider", "Webhooks"])}
    <h3>Recent gateway webhooks</h3>
    ${renderTable(webhookRows, ["Created", "Event", "Status", "Source", "Verified", "Message"])}
    <h3>Recent billing</h3>
    ${renderTable(billingRows, ["Invoice", "Plan", "Amount_THB", "Status", "Date"])}
    <h3>Pricing catalog</h3>
    ${renderTable(pricingRows, ["Plan", "Price_THB", "Billing", "Focus"])}
  `;
  attachTeamActions();
  attachOrganizationActions();
  attachApprovalActions();
}

function renderOperationalReadiness(readiness) {
  if (!readiness) {
    return `
      <section class="chart-panel">
        <h3>Operational readiness</h3>
        <p class="muted">Operational checks are loading...</p>
      </section>
    `;
  }

  const alerts = readiness.alerts || [];
  const topAlerts = alerts.slice(0, 6);
  const alertRows = topAlerts.map((item) => ({
    Severity: item.severity,
    Alert: item.title,
    Action: item.message,
  }));

  return `
    <section class="chart-panel">
      <h3>Operational readiness</h3>
      <div class="metric-grid">
        ${metric("Status", readiness.status || "unknown")}
        ${metric("Critical", readiness.summary?.criticalAlerts || 0)}
        ${metric("Warnings", readiness.summary?.warningAlerts || 0)}
        ${metric("Generated", readiness.generatedAt ? new Date(readiness.generatedAt).toLocaleTimeString() : "-")}
      </div>
      <div class="ops-alert-grid">
        ${(topAlerts.length ? topAlerts : [{ severity: "ok", title: "No alerts", message: "Operational readiness checks are clean." }]).map((item) => `
          <div class="ops-alert-card ${escapeHtml(item.severity)}">
            <span>${escapeHtml(item.severity)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.message)}</p>
          </div>
        `).join("")}
      </div>
      ${alertRows.length ? renderTable(alertRows, ["Severity", "Alert", "Action"]) : ""}
    </section>
  `;
}

function renderApprovalsView() {
  const requests = state.approvalRequests || [];
  const pending = requests.filter((request) => request.status === "pending").length;
  const approved = requests.filter((request) => request.status === "approved").length;
  const rejected = requests.filter((request) => request.status === "rejected").length;

  viewOutput.innerHTML = `
    <div class="metric-grid">
      ${metric("Pending", pending)}
      ${metric("Approved", approved)}
      ${metric("Rejected", rejected)}
      ${metric("Visible Requests", requests.length)}
    </div>
    ${renderApprovalWorkspace(requests)}
  `;
  attachApprovalActions();
}

function renderScreenerView() {
  if (!state.recommendations.length) {
    viewOutput.innerHTML = `<p class="muted">Run analysis to load stock recommendations.</p>`;
    return;
  }

  const sectors = uniqueValues(state.recommendations.map((row) => row.Sector || "Unknown"));
  const trends = uniqueValues(state.recommendations.map((row) => row.Trend_Status || "Unknown"));
  viewOutput.innerHTML = `
    <div class="filter-bar">
      <label>Min Score <input id="minScore" type="number" min="0" max="100" value="0"></label>
      <label>Min RRR <input id="minRrr" type="number" min="0" step="0.1" value="0"></label>
      <label>Max D/E <input id="maxDe" type="number" min="0" step="0.1" value="10"></label>
      <label>Sector <select id="sectorFilter">
        <option value="">All sectors</option>
        ${sectors.map((sector) => option(sector, sector, "")).join("")}
      </select></label>
      <label>Trend <select id="trendFilter">
        <option value="">All trends</option>
        ${trends.map((trend) => option(trend, trend, "")).join("")}
      </select></label>
    </div>
    <p id="screenerFilterStatus" class="muted"></p>
    <div id="screenerTable"></div>
  `;

  const minScore = document.querySelector("#minScore");
  const minRrr = document.querySelector("#minRrr");
  const maxDe = document.querySelector("#maxDe");
  const sectorFilter = document.querySelector("#sectorFilter");
  const trendFilter = document.querySelector("#trendFilter");
  const filterStatus = document.querySelector("#screenerFilterStatus");
  const renderFiltered = () => {
    const rows = state.recommendations
      .filter((row) => numberValue(row.Total_Score) >= numberValue(minScore.value))
      .filter((row) => numberValue(row.RRR) >= numberValue(minRrr.value))
      .filter((row) => numberValue(row.DE) <= numberValue(maxDe.value))
      .filter((row) => !sectorFilter.value || (row.Sector || "Unknown") === sectorFilter.value)
      .filter((row) => !trendFilter.value || (row.Trend_Status || "Unknown") === trendFilter.value)
      .slice(0, 100);
    const activeFilters = [
      sectorFilter.value ? `sector ${sectorFilter.value}` : "",
      trendFilter.value ? `trend ${trendFilter.value}` : "",
      `score >= ${formatNumber(minScore.value)}`,
      `RRR >= ${formatNumber(minRrr.value)}`,
      `D/E <= ${formatNumber(maxDe.value)}`,
    ].filter(Boolean);
    filterStatus.textContent = `${formatNumber(rows.length)} stocks match ${activeFilters.join(" · ")}. Click a sector bar to drill down.`;
    document.querySelector("#screenerTable").innerHTML = `
      ${renderScreenerInsights(rows, { selectedSector: sectorFilter.value })}
      ${renderTable(rows, [
        "Symbol",
        "Sector",
        "Price",
        "Total_Score",
        "RRR",
        "Upside_Pct",
        "PE",
        "ROE",
        "DE",
        "RSI",
        "Rationale",
      ])}
    `;
    document.querySelectorAll("[data-sector-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        sectorFilter.value = button.dataset.sectorFilter || "";
        renderFiltered();
      });
    });
  };

  [minScore, minRrr, maxDe].forEach((input) => input.addEventListener("input", renderFiltered));
  [sectorFilter, trendFilter].forEach((input) => input.addEventListener("change", renderFiltered));
  renderFiltered();
}

function renderSectorView() {
  if (!state.recommendations.length) {
    viewOutput.innerHTML = `<p class="muted">Run analysis to load sector data.</p>`;
    return;
  }

  const sectors = groupBy(state.recommendations, "Sector");
  const sectorNames = Object.keys(sectors).sort((left, right) => {
    if (left === "Unknown") return 1;
    if (right === "Unknown") return -1;
    return left.localeCompare(right);
  });
  const defaultSector = sectorNames[0];
  const rows = sectorNames
    .map((sector) => {
      const sectorRows = sectors[sector];
      const leader = sectorRows.slice().sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score))[0];
      const stats = getSectorStats(sectorRows);
      return {
        Sector: sector,
        Count: sectorRows.length,
        Median_PE: stats.pe,
        Median_ROE: stats.roe,
        Median_Yield: stats.yield,
        Avg_Score: average(sectorRows, "Total_Score"),
        Leader: leader?.Symbol || "-",
        Leader_Score: leader?.Total_Score || 0,
      };
    })
    .sort((left, right) => numberValue(right.Leader_Score) - numberValue(left.Leader_Score));

  viewOutput.innerHTML = `
    <div class="filter-bar">
      <label>
        Sector
        <select id="sectorSelect">
          ${sectorNames.map((sector) => `<option value="${escapeHtml(sector)}"${sector === defaultSector ? " selected" : ""}>${escapeHtml(sector)}</option>`).join("")}
        </select>
      </label>
    </div>
    <div id="sectorDetails"></div>
    <h3>Sector Summary</h3>
    ${renderTable(rows, ["Sector", "Count", "Median_PE", "Median_ROE", "Median_Yield", "Avg_Score", "Leader", "Leader_Score"])}
  `;

  const sectorSelect = document.querySelector("#sectorSelect");
  const renderDetails = () => {
    const selectedSector = sectorSelect.value;
    const sectorRows = sectors[selectedSector]
      .slice()
      .sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score));
    const leader = sectorRows[0];
    const stats = getSectorStats(sectorRows);
    document.querySelector("#sectorDetails").innerHTML = `
      <div class="metric-grid">
        ${metric("Sector", selectedSector)}
        ${metric("Stocks", sectorRows.length)}
        ${metric("Median PE", formatNumber(stats.pe))}
        ${metric("Median ROE", formatNumber(stats.roe))}
        ${metric("Leader", leader ? `${leader.Symbol} (${formatNumber(leader.Total_Score)})` : "-")}
      </div>
      ${renderSectorVisuals(sectorRows, stats)}
      ${renderTable(sectorRows, ["Symbol", "Price", "Total_Score", "RRR", "Upside_Pct", "Price_Position", "PE", "ROE", "Yield", "DE", "Trend_Status", "Rationale"])}
    `;
  };

  sectorSelect.addEventListener("change", renderDetails);
  renderDetails();
}

function renderSimulationView() {
  viewOutput.innerHTML = `
    <form id="simulationForm" class="inline-form">
      <label>Symbol <input name="symbol" value="CPALL" autocomplete="off"></label>
      <label>Initial Capital <input name="initialCapital" type="number" min="1000" step="1000" value="100000"></label>
      <label>Years Back <input name="yearsBack" type="number" min="1" max="3" value="1"></label>
      <button type="submit">Run Simulation</button>
    </form>
    <div id="simulationOutput" class="simulation-output muted">Enter inputs and run the simulation.</div>
  `;

  document.querySelector("#simulationForm").addEventListener("submit", runSimulation);
}

async function runSimulation(event) {
  event.preventDefault();
  const output = document.querySelector("#simulationOutput");
  output.textContent = "Running simulation...";

  const formData = new FormData(event.target);
  const response = await fetch("/api/simulation/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(formData.entries())),
  });
  const data = await response.json();

  if (!data.ok) {
    output.textContent = data.message || "Simulation failed.";
    return;
  }

  output.classList.remove("muted");
  output.innerHTML = `
    <div class="metric-grid">
      ${metric("Strategy Value", money(data.summary?.finalValue || 0))}
      ${metric("Strategy ROI", `${formatNumber(data.summary?.roi || 0)}%`)}
      ${metric("Buy & Hold ROI", `${formatNumber(data.summary?.buyHoldRoi || 0)}%`)}
      ${metric("Trades", data.summary?.totalTrades || 0)}
    </div>
    <h3>Recent Portfolio History</h3>
    ${renderTable((data.history || []).slice(-20), ["Date", "Price", "Portfolio_Value", "Buy_Hold_Value", "Cash", "Shares", "Action"])}
    <h3>Trade History</h3>
    ${renderTable(data.trades || [], ["Date", "Action", "Price", "Shares"])}
  `;
  await loadAuditEvents();
}

function renderPortfolioVisuals(rows) {
  const sectorExposure = breakdownBy(rows, (row) => row.Sector || "Unknown", "Market_Value", 6);
  const actionMix = breakdownBy(rows, actionGroup, () => 1, 5);
  const scoreBands = [
    { label: "Strong 70+", value: rows.filter((row) => numberValue(row.Total_Score) >= 70).length },
    { label: "Watch 45-69", value: rows.filter((row) => numberValue(row.Total_Score) >= 45 && numberValue(row.Total_Score) < 70).length },
    { label: "Risk <45", value: rows.filter((row) => numberValue(row.Total_Score) < 45).length },
  ];

  return `
    <div class="visual-grid">
      <section class="chart-panel">
        <h3>Sector exposure</h3>
        ${renderBarList(sectorExposure, { valueFormatter: money })}
      </section>
      <section class="chart-panel">
        <h3>Action mix</h3>
        ${renderBarList(actionMix, { valueFormatter: (value) => `${formatNumber(value)} holdings` })}
      </section>
      <section class="chart-panel">
        <h3>Score distribution</h3>
        ${renderBarList(scoreBands, { valueFormatter: (value) => `${formatNumber(value)} holdings` })}
      </section>
    </div>
  `;
}

function renderScreenerInsights(rows, options = {}) {
  if (!rows.length) {
    return "";
  }

  const topIdeas = rows
    .slice()
    .sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score))
    .slice(0, 5)
    .map((row) => ({
      label: row.Symbol,
      value: numberValue(row.Total_Score),
      caption: `RRR ${formatNumber(row.RRR)} · ${row.Sector || "Unknown"}`,
    }));
  const sectorQuality = breakdownBy(rows, (row) => row.Sector || "Unknown", () => 1)
    .map((item) => ({
      ...item,
      selected: item.label === options.selectedSector,
    }));

  return `
    <div class="visual-grid two-columns">
      <section class="chart-panel wide">
        <h3>Quality vs reward</h3>
        ${renderScatterPlot(rows, {
          xKey: "RRR",
          yKey: "Total_Score",
          labelKey: "Symbol",
          xLabel: "Reward/Risk",
          yLabel: "Quality score",
          xMax: 5,
          yMax: 100,
        })}
      </section>
      <section class="chart-panel">
        <h3>Top ideas</h3>
        ${renderBarList(topIdeas, { maxValue: 100, valueFormatter: (value) => `${formatNumber(value)} score` })}
      </section>
      <section class="chart-panel">
        <h3>Sector count</h3>
        ${renderBarList(sectorQuality, { action: "sector-filter", valueFormatter: (value) => `${formatNumber(value)} stocks` })}
      </section>
    </div>
  `;
}

function renderSectorVisuals(rows, stats) {
  const leaders = rows
    .slice(0, 6)
    .map((row) => ({
      label: row.Symbol,
      value: numberValue(row.Total_Score),
      caption: `RRR ${formatNumber(row.RRR)} · PE ${formatNumber(row.PE)}`,
    }));
  const benchmarks = [
    { label: "Median PE", value: stats.pe, caption: "Lower is generally cheaper" },
    { label: "Median ROE", value: stats.roe, caption: "Higher means stronger profitability" },
    { label: "Median Yield", value: stats.yield, caption: "Dividend context" },
  ];

  return `
    <div class="visual-grid two-columns">
      <section class="chart-panel">
        <h3>Sector leaders</h3>
        ${renderBarList(leaders, { maxValue: 100, valueFormatter: (value) => `${formatNumber(value)} score` })}
      </section>
      <section class="chart-panel">
        <h3>Sector benchmark</h3>
        ${renderBarList(benchmarks, { valueFormatter: (value) => formatNumber(value) })}
      </section>
      <section class="chart-panel wide">
        <h3>Timing vs quality</h3>
        ${renderScatterPlot(rows.slice(0, 80), {
          xKey: "Price_Position",
          yKey: "Total_Score",
          labelKey: "Symbol",
          xLabel: "Price position",
          yLabel: "Quality score",
          xMax: 100,
          yMax: 100,
        })}
      </section>
    </div>
  `;
}

function renderBusinessFunnel(metrics, profileCompletionPct, portfolioAttachPct) {
  const funnel = [
    { label: "Registered users", value: metrics.users || 0, caption: "Top of funnel" },
    { label: "Completed profiles", value: metrics.completedProfiles || 0, caption: `${formatNumber(profileCompletionPct)}% activation` },
    { label: "Saved portfolios", value: metrics.savedPortfolios || 0, caption: `${formatNumber(portfolioAttachPct)}% portfolio attach` },
    { label: "Paid users", value: metrics.paidUsers || 0, caption: `${money(metrics.mrrEstimate || 0)} MRR` },
  ];
  const plans = Object.entries(metrics.usersByPlan || {}).map(([label, value]) => ({
    label,
    value,
    caption: "Plan mix",
  }));

  return `
    <div class="visual-grid two-columns">
      <section class="chart-panel">
        <h3>Customer funnel</h3>
        ${renderBarList(funnel, { valueFormatter: (value) => `${formatNumber(value)} users` })}
      </section>
      <section class="chart-panel">
        <h3>Plan distribution</h3>
        ${renderBarList(plans, { valueFormatter: (value) => `${formatNumber(value)} users` })}
      </section>
    </div>
  `;
}

function renderTenantScopeSummary(scope = state.tenantScope) {
  if (!scope) {
    return `<p class="muted">Tenant scope is loading...</p>`;
  }

  const dataScope = scope.dataScope || {};
  const isolation = scope.isolation || {};
  const missing = isolation.missingOrganizationId || {};
  const missingTotal = numberValue(missing.totalMissingOrganizationId);
  const recordRows = [
    ["Portfolio snapshots", dataScope.portfolioSnapshots],
    ["Investor profiles", dataScope.investorProfiles],
    ["Billing events", dataScope.billingEvents],
    ["Payment sessions", dataScope.paymentSessions],
    ["Webhook events", dataScope.paymentWebhookEvents],
    ["Approval requests", dataScope.approvalRequests],
    ["Audit events", dataScope.auditEvents],
  ].map(([record, visible]) => ({
    Record: record,
    Visible: visible || 0,
  }));
  const workspaceRows = (scope.visibleOrganizations || []).slice(0, 8).map((organization) => ({
    Workspace: organization.name,
    Type: organization.type,
    Members: organization.memberCount || 0,
    Revenue_THB: organization.revenueCollected || 0,
  }));

  return `
    <section class="chart-panel">
      <h3>Tenant isolation</h3>
      <div class="metric-grid">
        ${metric("Visible Workspaces", scope.visibleOrganizationCount || 0)}
        ${metric("Visible Users", scope.visibleUserCount || 0)}
        ${metric("Record Metadata Gaps", missingTotal)}
        ${metric("Production Store", isolation.productionDatabaseRequired ? "DB required" : "Ready")}
      </div>
      <div class="guidance-grid">
        <div class="guidance-card"><span>Scope status</span><strong>${missingTotal ? "Some records need workspace metadata before production" : "Critical records are tagged with workspace metadata"}</strong></div>
        <div class="guidance-card"><span>Current store</span><strong>${escapeHtml(isolation.store || "local_file")} prototype for demo and validation</strong></div>
      </div>
      <h3>Visible data scope</h3>
      ${renderTable(recordRows, ["Record", "Visible"])}
      <h3>Workspace access</h3>
      ${renderTable(workspaceRows, ["Workspace", "Type", "Members", "Revenue_THB"])}
    </section>
  `;
}

function renderWorkspaceSummary(organizations = state.organizations) {
  if (!organizations.length) {
    return `<p class="muted">No workspaces available yet.</p>`;
  }

  const organizationTypes = ["client", "customer", "advisor", "platform"];
  const canManage = canManageOrganizations();
  const createForm = canManage
    ? `
      <form id="organizationForm" class="inline-form workspace-form">
        <label>Workspace name <input name="name" placeholder="Client workspace"></label>
        <label>Type <select name="type">${organizationTypes.map((type) => option(type, type, "client")).join("")}</select></label>
        <button type="submit">Create Workspace</button>
      </form>
      <p id="organizationMessage" class="muted">Create client workspaces to group customers, advisors, and future team seats.</p>
    `
    : "";

  return `
    <h3>Workspaces</h3>
    ${createForm}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Workspace</th>
            <th>Type</th>
            <th>Members</th>
            <th>Customers</th>
            <th>Paid</th>
            <th>Revenue</th>
            <th>Portfolios</th>
            <th>Owner</th>
            ${canManage ? "<th>Actions</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${organizations.map((organization) => {
            const nameControl = canManage
              ? `<input class="table-input" data-organization-name="${escapeHtml(organization.id)}" value="${escapeHtml(organization.name)}">`
              : escapeHtml(organization.name);
            const typeControl = canManage
              ? `<select data-organization-type="${escapeHtml(organization.id)}">${organizationTypes.map((type) => option(type, type, organization.type)).join("")}</select>`
              : escapeHtml(organization.type);

            return `
              <tr>
                <td><strong>${nameControl}</strong></td>
                <td>${typeControl}</td>
                <td>${formatNumber(organization.memberCount || 0)}</td>
                <td>${formatNumber(organization.customerCount || 0)}</td>
                <td>${formatNumber(organization.paidMembers || 0)}</td>
                <td>${money(organization.revenueCollected || 0)}</td>
                <td>${formatNumber(organization.savedPortfolios || 0)}</td>
                <td>${escapeHtml(organization.ownerName || organization.ownerEmail || "-")}</td>
                ${canManage ? `<td><button class="table-action" type="button" data-save-organization="${escapeHtml(organization.id)}">Save workspace</button></td>` : ""}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTeamWorkspace() {
  if (!state.teamUsers.length) {
    return `<p class="muted">No team or client records available yet.</p>`;
  }

  const roles = state.policy?.roles || ["owner", "admin", "advisor", "customer"];
  const advisors = state.teamUsers.filter((user) => ["owner", "admin", "advisor"].includes(user.role));
  const organizations = state.organizations.length ? state.organizations : state.businessMetrics?.recentOrganizations || [];

  return `
    <h3>${canViewBusinessMetrics() ? "Team and clients" : "Assigned clients"}</h3>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Role</th>
            <th>Workspace</th>
            <th>Plan</th>
            <th>Advisor</th>
            <th>Profile</th>
            <th>Portfolio</th>
            <th>Revenue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.teamUsers.map((user) => {
            const roleControl = canManageRoles()
              ? `<select data-role-user="${escapeHtml(user.id)}">${roles.map((role) => option(role, role, user.role)).join("")}</select>`
              : escapeHtml(user.role);
            const advisorControl = canAssignAdvisors() && user.role === "customer"
              ? `<select data-advisor-user="${escapeHtml(user.id)}">
                  <option value="">Unassigned</option>
                  ${advisors.map((advisor) => option(advisor.id, `${advisor.name} (${advisor.role})`, user.advisorId)).join("")}
                </select>`
              : escapeHtml(user.advisorName || "-");
            const organizationControl = canManageOrganizations()
              ? `<select data-organization-user="${escapeHtml(user.id)}">${organizations.map((organization) => option(organization.id, organization.name, user.organizationId)).join("")}</select>`
              : `${escapeHtml(user.organizationName || "-")}<br><span class="muted">${escapeHtml(user.organizationType || "-")}</span>`;
            const portfolioValue = user.portfolioSummary ? money(user.portfolioSummary.marketValue || 0) : "-";
            const revenue = money(user.billingSummary?.revenueCollected || 0);

            return `
              <tr>
                <td><strong>${escapeHtml(user.name || "Investor")}</strong><br><span class="muted">${escapeHtml(user.email)}</span></td>
                <td>${roleControl}</td>
                <td>${organizationControl}</td>
                <td>${escapeHtml(user.subscription?.plan || "-")}<br><span class="muted">${escapeHtml(user.subscription?.status || "-")}</span></td>
                <td>${advisorControl}</td>
                <td>${user.profileCompleted ? "Complete" : "Missing"}</td>
                <td>${escapeHtml(portfolioValue)}</td>
                <td>${escapeHtml(revenue)}</td>
                <td>
                  ${canManageRoles() ? `<button class="table-action" type="button" data-save-role="${escapeHtml(user.id)}">Save role</button>` : ""}
                  ${canManageOrganizations() ? `<button class="table-action" type="button" data-save-organization-user="${escapeHtml(user.id)}">Move workspace</button>` : ""}
                  ${canAssignAdvisors() && user.role === "customer" ? `<button class="table-action" type="button" data-save-advisor="${escapeHtml(user.id)}">Assign</button>` : ""}
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
    <p id="teamMessage" class="muted">Role and advisor changes are recorded in the activity timeline.</p>
  `;
}

function renderApprovalWorkspace(requests = state.approvalRequests) {
  const customerOptions = state.teamUsers.filter((user) => user.role === "customer");
  const canCreate = canCreateApprovalRequests();
  const createForm = canCreate
    ? `
      <form id="approvalForm" class="inline-form approval-form">
        <label>Customer <select name="customerId" required>
          <option value="">Select customer</option>
          ${customerOptions.map((user) => option(user.id, `${user.name} (${user.email})`, "")).join("")}
        </select></label>
        <label>Title <input name="title" maxlength="100" placeholder="Review AOT rebalance" required></label>
        <label>Action <select name="actionType">
          ${["portfolio_review", "rebalance", "buy_plan", "risk_action", "subscription_support", "other"].map((value) => option(value, approvalActionTypeLabel(value), "portfolio_review")).join("")}
        </select></label>
        <label>Risk <select name="riskLevel">
          ${["low", "medium", "high"].map((value) => option(value, value, "medium")).join("")}
        </select></label>
        <label>Amount THB <input name="amountThb" type="number" min="0" step="1000" placeholder="0"></label>
        <label>Summary <input name="summary" maxlength="600" placeholder="Explain why this approval is needed"></label>
        <button type="submit"${customerOptions.length ? "" : " disabled"}>Request Approval</button>
      </form>
      <p id="approvalMessage" class="muted">${customerOptions.length ? "Approval requests are recorded in the activity timeline." : "Assign or create customer accounts before requesting approval."}</p>
    `
    : "";

  return `
    <h3>Client approvals</h3>
    ${createForm}
    ${renderApprovalTable(requests)}
  `;
}

function renderApprovalTable(requests = state.approvalRequests) {
  if (!requests.length) {
    return `<p class="muted">No approval requests yet.</p>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Updated</th>
            <th>Customer</th>
            <th>Request</th>
            <th>Risk</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Requested by</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map((request) => {
            const canDecide = request.status === "pending" && request.customerId === state.user?.id;
            const decisionCell = canDecide
              ? `
                <button class="table-action" type="button" data-approval-decision="${escapeHtml(request.id)}" data-decision="approved">Approve</button>
                <button class="table-action ghost-button" type="button" data-approval-decision="${escapeHtml(request.id)}" data-decision="rejected">Reject</button>
              `
              : request.decidedAt
                ? `${escapeHtml(request.decidedByName || request.decidedByEmail || "-")}<br><span class="muted">${formatDateTime(request.decidedAt)}</span>`
                : "-";

            return `
              <tr>
                <td>${formatDateTime(request.updatedAt || request.createdAt)}</td>
                <td><strong>${escapeHtml(request.customerName || "Customer")}</strong><br><span class="muted">${escapeHtml(request.customerEmail || "-")}</span></td>
                <td><strong>${escapeHtml(request.title)}</strong><br><span class="muted">${escapeHtml(approvalActionTypeLabel(request.actionType))} · ${escapeHtml(request.summary || "-")}</span></td>
                <td>${escapeHtml(request.riskLevel || "medium")}</td>
                <td>${money(request.amountThb || 0)}</td>
                <td>${escapeHtml(request.status || "pending")}</td>
                <td>${escapeHtml(request.requestedByName || request.requestedByEmail || "-")}</td>
                <td>${decisionCell}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderActivityTimeline(events = state.auditEvents) {
  if (!events.length) {
    return `<p class="muted">No activity recorded yet.</p>`;
  }

  const rows = events.slice(0, 12).map((event) => ({
    Time: formatDateTime(event.createdAt),
    Activity: auditActionLabel(event.action),
    Actor: event.actorName || event.actorEmail || "-",
    Target: event.targetName || event.targetEmail || "-",
    Detail: summarizeAuditDetails(event),
    Hash: event.hashPreview || shortHash(event.eventHash),
  }));

  return renderTable(rows, ["Time", "Activity", "Actor", "Target", "Detail", "Hash"]);
}

function renderPaymentSessions(sessions = state.paymentSessions) {
  if (!sessions.length) {
    return `<p class="muted">No payment sessions recorded yet.</p>`;
  }

  const rows = sessions.slice(0, 12).map((session) => ({
    Created: formatDateTime(session.createdAt),
    Plan: session.planName || "-",
    Amount_THB: session.amountThb || 0,
    Status: session.status || "-",
    Provider: session.provider || "-",
    Webhooks: session.webhookEventCount || 0,
  }));

  return renderTable(rows, ["Created", "Plan", "Amount_THB", "Status", "Provider", "Webhooks"]);
}

function auditActionLabel(action) {
  return {
    "auth.register": "Account registered",
    "auth.login": "Signed in",
    "auth.logout": "Signed out",
    "analysis.run": "Portfolio analysis",
    "analysis.snapshot_saved": "Snapshot saved",
    "simulation.run": "Simulation",
    "profile.update": "Guide profile",
    "billing.checkout": "Subscription checkout",
    "team.role_update": "Role updated",
    "team.advisor_assigned": "Advisor assigned",
    "team.advisor_reassigned": "Advisor reassigned",
    "team.advisor_unassigned": "Advisor removed",
    "organization.create": "Workspace created",
    "organization.update": "Workspace updated",
    "organization.member_move": "Workspace member moved",
    "payment.session_created": "Payment session",
    "payment.webhook_succeeded": "Payment succeeded",
    "payment.webhook_failed": "Payment failed",
    "payment.webhook_rejected": "Webhook rejected",
    "approval.request_created": "Approval requested",
    "approval.request_approved": "Approval approved",
    "approval.request_rejected": "Approval rejected",
  }[action] || action;
}

function summarizeAuditDetails(event) {
  const details = event.details || {};

  if (event.action === "billing.checkout") {
    return `${details.planName || details.planId || "Plan"} · ${money(details.amountThb || 0)} · ${details.invoiceNumber || "-"}`;
  }

  if (event.action === "team.role_update") {
    return `${details.previousRole || "-"} → ${details.nextRole || "-"}`;
  }

  if (event.action === "team.advisor_assigned" || event.action === "team.advisor_reassigned") {
    return details.advisorEmail ? `Advisor: ${details.advisorEmail}` : "Advisor assigned";
  }

  if (event.action === "team.advisor_unassigned") {
    return details.previousAdvisorEmail ? `Removed: ${details.previousAdvisorEmail}` : "Advisor removed";
  }

  if (event.action === "organization.create") {
    return `${details.organizationName || "Workspace"} · ${details.organizationType || "client"}`;
  }

  if (event.action === "organization.update") {
    return `${details.previousName || "-"} → ${details.nextName || "-"}`;
  }

  if (event.action === "organization.member_move") {
    return `${details.previousOrganization || "-"} → ${details.nextOrganization || "-"}`;
  }

  if (event.action === "payment.session_created") {
    return `${details.planName || "-"} · ${money(details.amountThb || 0)} · ${details.status || "pending"}`;
  }

  if (event.action === "payment.webhook_succeeded" || event.action === "payment.webhook_failed") {
    return `${details.planName || "-"} · ${money(details.amountThb || 0)} · ${details.status || "-"} · ${details.verificationStatus || "not_required"}`;
  }

  if (event.action === "payment.webhook_rejected") {
    return `${details.eventType || "-"} · ${details.verificationStatus || "rejected"} · ${details.reason || "-"}`;
  }

  if (event.action === "approval.request_created" || event.action === "approval.request_approved" || event.action === "approval.request_rejected") {
    return `${details.title || "Approval"} · ${details.status || "-"} · ${money(details.amountThb || 0)}`;
  }

  if (event.action === "analysis.run") {
    return `${formatNumber(details.symbols || 0)} symbols · ${formatNumber(details.recommendationCount || 0)} ideas · ${formatNumber(details.portfolioRows || 0)} holdings`;
  }

  if (event.action === "analysis.snapshot_saved") {
    return `${formatNumber(details.holdings || 0)} holdings · urgent ${formatNumber(details.urgentActions || 0)} · P/L ${formatNumber(details.gainLossPct || 0)}%`;
  }

  if (event.action === "simulation.run") {
    return `${details.symbol || "-"} · ${formatNumber(details.yearsBack || 0)} years · ${formatNumber(details.trades || 0)} trades`;
  }

  if (event.action === "profile.update") {
    return `${details.goal || "-"} · ${details.riskLevel || "-"} risk · ${formatNumber(details.horizonYears || 0)} years`;
  }

  const entries = Object.entries(details).slice(0, 3);
  return entries.length ? entries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ") : "-";
}

function attachTeamActions() {
  document.querySelectorAll("[data-save-role]").forEach((button) => {
    button.addEventListener("click", () => updateTeamRole(button.dataset.saveRole));
  });
  document.querySelectorAll("[data-save-advisor]").forEach((button) => {
    button.addEventListener("click", () => updateAdvisorAssignment(button.dataset.saveAdvisor));
  });
  document.querySelectorAll("[data-save-organization-user]").forEach((button) => {
    button.addEventListener("click", () => updateUserOrganization(button.dataset.saveOrganizationUser));
  });
}

function attachOrganizationActions() {
  const organizationForm = document.querySelector("#organizationForm");
  if (organizationForm) {
    organizationForm.addEventListener("submit", createWorkspace);
  }

  document.querySelectorAll("[data-save-organization]").forEach((button) => {
    button.addEventListener("click", () => updateWorkspace(button.dataset.saveOrganization));
  });
}

function attachApprovalActions() {
  const approvalForm = document.querySelector("#approvalForm");
  if (approvalForm) {
    approvalForm.addEventListener("submit", createApprovalRequest);
  }

  document.querySelectorAll("[data-approval-decision]").forEach((button) => {
    button.addEventListener("click", () => decideApprovalRequest(button.dataset.approvalDecision, button.dataset.decision));
  });
}

async function createApprovalRequest(event) {
  event.preventDefault();
  const approvalMessage = document.querySelector("#approvalMessage");
  if (approvalMessage) {
    approvalMessage.textContent = "Creating approval request...";
  }

  const payload = Object.fromEntries(new FormData(event.target).entries());
  const response = await fetch("/api/approvals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!data.ok) {
    if (approvalMessage) {
      approvalMessage.textContent = data.message || "Approval request could not be created.";
    }
    return;
  }

  event.target.reset();
  await refreshWorkspaceData();
  renderAfterApprovalChange();
}

async function decideApprovalRequest(approvalId, decision) {
  const response = await fetch(`/api/approvals/${encodeURIComponent(approvalId)}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision }),
  });
  const data = await response.json();

  if (!data.ok) {
    viewOutput.insertAdjacentHTML("afterbegin", `<p class="muted">${escapeHtml(data.message || "Approval decision failed.")}</p>`);
    return;
  }

  await refreshWorkspaceData();
  renderAfterApprovalChange();
}

function renderAfterApprovalChange() {
  renderAuthState();
  if (state.activeView === "business") {
    renderBusinessView();
    return;
  }

  renderApprovalsView();
}

async function createWorkspace(event) {
  event.preventDefault();
  const organizationMessage = document.querySelector("#organizationMessage");
  if (organizationMessage) {
    organizationMessage.textContent = "Creating workspace...";
  }

  const payload = Object.fromEntries(new FormData(event.target).entries());
  const response = await fetch("/api/admin/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!data.ok) {
    if (organizationMessage) {
      organizationMessage.textContent = data.message || "Workspace could not be created.";
    }
    return;
  }

  await refreshWorkspaceData();
  renderBusinessView();
}

async function updateWorkspace(organizationId) {
  const nameInput = document.querySelector(`[data-organization-name="${cssEscape(organizationId)}"]`);
  const typeSelect = document.querySelector(`[data-organization-type="${cssEscape(organizationId)}"]`);
  const organizationMessage = document.querySelector("#organizationMessage");
  if (!nameInput || !typeSelect) return;

  if (organizationMessage) {
    organizationMessage.textContent = "Saving workspace...";
  }

  const response = await fetch(`/api/admin/organizations/${encodeURIComponent(organizationId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameInput.value,
      type: typeSelect.value,
    }),
  });
  const data = await response.json();

  if (!data.ok) {
    if (organizationMessage) {
      organizationMessage.textContent = data.message || "Workspace could not be saved.";
    }
    return;
  }

  await refreshWorkspaceData();
  renderBusinessView();
}

async function updateTeamRole(userId) {
  const select = document.querySelector(`[data-role-user="${cssEscape(userId)}"]`);
  const teamMessage = document.querySelector("#teamMessage");
  if (!select || !teamMessage) return;

  teamMessage.textContent = "Saving role...";
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: select.value }),
  });
  const data = await response.json();

  if (!data.ok) {
    teamMessage.textContent = data.message || "Role update failed.";
    return;
  }

  await refreshWorkspaceData({ includeCurrentUser: true });
  renderAuthState();
  renderBusinessView();
}

async function updateAdvisorAssignment(userId) {
  const select = document.querySelector(`[data-advisor-user="${cssEscape(userId)}"]`);
  const teamMessage = document.querySelector("#teamMessage");
  if (!select || !teamMessage) return;

  teamMessage.textContent = "Saving advisor assignment...";
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ advisorId: select.value }),
  });
  const data = await response.json();

  if (!data.ok) {
    teamMessage.textContent = data.message || "Advisor assignment failed.";
    return;
  }

  await refreshWorkspaceData();
  renderBusinessView();
}

async function updateUserOrganization(userId) {
  const select = document.querySelector(`[data-organization-user="${cssEscape(userId)}"]`);
  const teamMessage = document.querySelector("#teamMessage");
  if (!select || !teamMessage) return;

  teamMessage.textContent = "Moving member to workspace...";
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/organization`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: select.value }),
  });
  const data = await response.json();

  if (!data.ok) {
    teamMessage.textContent = data.message || "Workspace move failed.";
    return;
  }

  await refreshWorkspaceData();
  renderBusinessView();
}

async function refreshWorkspaceData(options = {}) {
  const loaders = [loadBusinessMetrics(), loadTeamUsers(), loadOrganizations(), loadPaymentSessions(), loadAuditEvents(), loadApprovalRequests(), loadTenantScope()];
  if (options.includeCurrentUser) {
    loaders.push(loadCurrentUser());
  }

  await Promise.all(loaders);
}

function renderBarList(items, options = {}) {
  if (!items.length) {
    return `<p class="muted">No visual data yet.</p>`;
  }

  const max = options.maxValue || Math.max(...items.map((item) => numberValue(item.value)), 1);
  const valueFormatter = options.valueFormatter || formatNumber;

  return `
    <div class="bar-list">
      ${items.map((item) => {
        const width = clamp((numberValue(item.value) / max) * 100, 3, 100);
        const rowContent = `
            <div class="bar-row-header">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(valueFormatter(item.value))}</span>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
            ${item.caption ? `<p class="muted">${escapeHtml(item.caption)}</p>` : ""}
        `;

        if (options.action === "sector-filter") {
          return `
            <button class="bar-row bar-row-button ${item.selected ? "selected" : ""}" type="button" data-sector-filter="${escapeHtml(item.label)}" title="Filter sector ${escapeHtml(item.label)}">
              ${rowContent}
            </button>
          `;
        }

        return `<div class="bar-row">${rowContent}</div>`;
      }).join("")}
    </div>
  `;
}

function renderScatterPlot(rows, { xKey, yKey, labelKey, xLabel, yLabel, xMax, yMax }) {
  const width = 560;
  const height = 260;
  const padding = 34;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const points = rows
    .filter((row) => numberValue(row[xKey]) || numberValue(row[yKey]))
    .slice(0, 90)
    .map((row) => {
      const xValue = clamp(numberValue(row[xKey]), 0, xMax);
      const yValue = clamp(numberValue(row[yKey]), 0, yMax);
      return {
        label: row[labelKey] || "-",
        x: padding + (xValue / xMax) * plotWidth,
        y: height - padding - (yValue / yMax) * plotHeight,
        xValue,
        yValue,
      };
    });

  if (!points.length) {
    return `<p class="muted">No chart data for the current filter.</p>`;
  }

  return `
    <div class="scatter-frame">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(`${xLabel} by ${yLabel}`)}">
        <line class="axis-line" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
        <line class="axis-line" x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"></line>
        <line class="guide-line" x1="${padding}" y1="${height - padding - plotHeight * 0.7}" x2="${width - padding}" y2="${height - padding - plotHeight * 0.7}"></line>
        <line class="guide-line" x1="${padding + plotWidth * 0.4}" y1="${padding}" x2="${padding + plotWidth * 0.4}" y2="${height - padding}"></line>
        ${points.map((point) => `
          <circle class="scatter-point" cx="${point.x}" cy="${point.y}" r="5">
            <title>${escapeHtml(`${point.label}: ${xLabel} ${formatNumber(point.xValue)}, ${yLabel} ${formatNumber(point.yValue)}`)}</title>
          </circle>
        `).join("")}
        <text class="axis-text" x="${width / 2}" y="${height - 6}">${escapeHtml(xLabel)}</text>
        <text class="axis-text" x="8" y="18">${escapeHtml(yLabel)}</text>
      </svg>
    </div>
  `;
}

function breakdownBy(rows, labelGetter, valueGetter, limit) {
  const groups = rows.reduce((totals, row) => {
    const label = typeof labelGetter === "function" ? labelGetter(row) : row[labelGetter];
    const value = typeof valueGetter === "function" ? valueGetter(row) : row[valueGetter];
    const key = label || "Unknown";
    totals[key] = (totals[key] || 0) + numberValue(value);
    return totals;
  }, {});
  const sorted = Object.entries(groups)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => numberValue(right.value) - numberValue(left.value));

  if (!limit || sorted.length <= limit) {
    return sorted;
  }

  const visible = sorted.slice(0, limit - 1);
  const otherValue = sorted.slice(limit - 1).reduce((total, item) => total + numberValue(item.value), 0);
  return [...visible, { label: "Other", value: otherValue }];
}

function uniqueValues(values) {
  return [...new Set(values
    .map((value) => String(value || "Unknown").trim() || "Unknown"))]
    .sort((left, right) => left.localeCompare(right));
}

function actionGroup(row) {
  const text = String(row.Target_Action || row.Advice || "Keep Holding");
  if (/Exit|Sell/i.test(text)) return "Exit/Sell";
  if (/Reduce|Cut/i.test(text)) return "Reduce";
  if (/Buy|Accumulate/i.test(text)) return "Buy/Accumulate";
  if (/Wait/i.test(text)) return "Wait";
  return "Hold";
}

function renderTable(rows, columns) {
  if (!rows.length) {
    return `<p class="muted">No rows match the current view.</p>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${columns.map((column) => `<td>${formatCell(row[column])}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function metric(label, value) {
  return `<div class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function option(value, label, selectedValue) {
  return `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function approvalActionTypeLabel(actionType) {
  return {
    portfolio_review: "Portfolio review",
    rebalance: "Rebalance",
    buy_plan: "Buy plan",
    risk_action: "Risk action",
    subscription_support: "Subscription support",
    other: "Other",
  }[actionType] || "Portfolio review";
}

function canViewWorkspace() {
  return canViewBusinessMetrics() || (hasRolePermission("client_workspace") && hasEntitlement("client.workspace"));
}

function canSeeWorkspaceNav() {
  return hasRolePermission("business_metrics") || hasRolePermission("team_management") || hasRolePermission("client_workspace");
}

function canViewBusinessMetrics() {
  return hasRolePermission("business_metrics") && hasEntitlement("business.metrics");
}

function canManageRoles() {
  return hasRolePermission("role_management") && hasEntitlement("role.management");
}

function canAssignAdvisors() {
  return hasRolePermission("advisor_assignment") && hasEntitlement("advisor.assignment");
}

function canManageOrganizations() {
  return hasRolePermission("organization_management") && hasEntitlement("organization.management");
}

function canCreateApprovalRequests() {
  return ["owner", "admin", "advisor"].includes(state.user?.role) && hasEntitlement("approval.workflow");
}

function hasPermission(permission) {
  return hasRolePermission(permission);
}

function hasRolePermission(permission) {
  return Boolean(state.user?.permissions?.includes(permission) || state.policy?.permissions?.includes(permission));
}

function hasEntitlement(featureId) {
  return Boolean(state.user?.entitlements?.effectiveFeatures?.includes(featureId));
}

function featurePolicy(featureId) {
  const lockedFeature = (state.user?.entitlements?.lockedFeatures || []).find((feature) => feature.id === featureId);
  if (lockedFeature) {
    return lockedFeature;
  }

  for (const plan of state.plans || []) {
    if ((plan.entitlements || []).includes(featureId)) {
      return {
        id: featureId,
        label: featureId.replaceAll(".", " "),
        requiredPlanId: plan.id,
        requiredPlanName: plan.name,
        description: "",
      };
    }
  }

  return {
    id: featureId,
    label: featureId.replaceAll(".", " "),
    requiredPlanId: "pro",
    requiredPlanName: "Pro",
    description: "",
  };
}

function renderLockedFeature(featureId) {
  const feature = featurePolicy(featureId);
  const plan = state.plans.find((candidate) => candidate.id === feature.requiredPlanId);
  const currentPlan = state.user?.entitlements?.planName || state.user?.subscription?.plan || "Current plan";

  return `
    <section class="locked-card">
      <p class="eyebrow">Upgrade Required</p>
      <h3>${escapeHtml(feature.label)}</h3>
      <p class="muted">${escapeHtml(feature.description || `${feature.label} is not included in ${currentPlan}.`)}</p>
      <div class="metric-grid">
        ${metric("Current Plan", currentPlan)}
        ${metric("Required Plan", feature.requiredPlanName || feature.requiredPlanId)}
        ${metric("Monthly Price", plan ? money(plan.priceThb || 0) : "-")}
        ${metric("Status", state.user?.entitlements?.status || state.user?.subscription?.status || "-")}
      </div>
      <button type="button" data-upgrade-plan="${escapeHtml(feature.requiredPlanId || "pro")}">Upgrade to ${escapeHtml(feature.requiredPlanName || "Pro")}</button>
    </section>
  `;
}

function cssEscape(value) {
  if (globalThis.CSS?.escape) {
    return globalThis.CSS.escape(String(value));
  }

  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function getCurrentPlanId() {
  const subscription = state.user?.subscription || {};
  if (subscription.planId) {
    return String(subscription.planId).toLowerCase();
  }

  return String(subscription.plan || "").toLowerCase();
}

function getSectorStats(sectorRows) {
  const firstRow = sectorRows.find((row) => numberValue(row.Sector_PE) || numberValue(row.Sector_ROE) || numberValue(row.Sector_Yield));
  return {
    pe: firstRow ? numberValue(firstRow.Sector_PE) : median(sectorRows.map((row) => numberValue(row.PE))),
    roe: firstRow ? numberValue(firstRow.Sector_ROE) : median(sectorRows.map((row) => numberValue(row.ROE))),
    yield: firstRow ? numberValue(firstRow.Sector_Yield) : median(sectorRows.map((row) => numberValue(row.Yield))),
  };
}

function formatCell(value) {
  return escapeHtml(typeof value === "number" ? formatNumber(value) : String(value ?? ""));
}

function money(value) {
  return `${formatNumber(value)} THB`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatNumber(value) {
  const number = numberValue(value);
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function shortHash(value) {
  return value ? String(value).slice(0, 12) : "-";
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + numberValue(row[key]), 0);
}

function average(rows, key) {
  const values = rows.map((row) => numberValue(row[key])).filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function groupBy(rows, key) {
  return rows.reduce((groups, row) => {
    const group = row[key] || "Unknown";
    groups[group] ||= [];
    groups[group].push(row);
    return groups;
  }, {});
}

function median(values) {
  const sorted = values.slice().sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
