import { businessMetrics } from "./authService.js";
import { stateRepositoryInfo } from "./stateRepository.js";

export const OPERATIONAL_READINESS_VERSION = "stockflix-ops-v1";

export async function operationalReadinessReport(options = {}) {
  const metrics = options.metrics || await businessMetrics();
  return buildOperationalReadinessReport(metrics, {
    ...options,
    repository: options.repository || stateRepositoryInfo(),
  });
}

export function buildOperationalReadinessReport(metrics = {}, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const repository = options.repository || {};
  const alerts = operationalAlerts(metrics, repository);
  const status = highestSeverityStatus(alerts);

  return {
    ok: status !== "critical",
    version: OPERATIONAL_READINESS_VERSION,
    status,
    generatedAt,
    summary: {
      criticalAlerts: alerts.filter((alert) => alert.severity === "critical").length,
      warningAlerts: alerts.filter((alert) => alert.severity === "warning").length,
      infoAlerts: alerts.filter((alert) => alert.severity === "info").length,
      users: numberValue(metrics.users),
      paidUsers: numberValue(metrics.paidUsers),
      mrrEstimate: numberValue(metrics.mrrEstimate),
      revenueCollected: numberValue(metrics.revenueCollected),
    },
    checks: {
      repository: repositoryCheck(repository),
      storage: storageCheck(metrics.storageReadiness),
      audit: auditCheck(metrics),
      payment: paymentCheck(metrics),
      business: businessCheck(metrics),
      dependencyRisk: dependencyRiskCheck(),
    },
    alerts,
    runbook: {
      ci: "npm run ci:quality",
      dependencyRisk: "npm run test:dependency-risk",
      storageReadiness: "GET /api/storage/readiness",
      auditIntegrity: "GET /api/audit/integrity",
      backupDryRun: "npm run restore:state -- --backup-dir data/backups/<backup-folder> --dry-run",
      alertDelivery: "npm run ops:alerts -- --dry-run --format text",
    },
  };
}

function operationalAlerts(metrics, repository) {
  const alerts = [];
  const storage = metrics.storageReadiness || {};
  const auditIntegrity = metrics.auditIntegrity || {};
  const auditTrail = metrics.auditTrail || {};
  const externalAudit = auditTrail.external || {};
  const paymentGateway = metrics.paymentGateway || {};
  const webhookEvents = numberValue(metrics.webhookEvents);
  const rejectedWebhookEvents = numberValue(metrics.rejectedWebhookEvents);
  const rejectedWebhookRatio = webhookEvents ? rejectedWebhookEvents / webhookEvents : 0;

  if (storage.status === "blocked" || numberValue(storage.blockerCount) > 0) {
    alerts.push(alert("storage_blocked", "critical", "Storage readiness is blocked", "Fix duplicate ids, missing required fields, or dangling references before production migration.", {
      blockerCount: numberValue(storage.blockerCount),
      issues: storage.issues || [],
    }));
  } else if (storage.status === "review" || numberValue(storage.warningCount) > 0) {
    alerts.push(alert("storage_review", "warning", "Storage readiness needs review", "Review tenant metadata warnings before production migration.", {
      warningCount: numberValue(storage.warningCount),
      issues: storage.issues || [],
    }));
  }

  if (auditIntegrity.status && auditIntegrity.status !== "verified") {
    alerts.push(alert("audit_integrity_needs_review", "critical", "Audit hash chain needs review", "Audit events have missing or mismatched hash-chain fields.", {
      invalidEvents: numberValue(auditIntegrity.invalidEvents),
      invalidSamples: auditIntegrity.invalidSamples || [],
    }));
  }

  if (auditTrail.status && auditTrail.status !== "synced") {
    alerts.push(alert("audit_trail_needs_review", "warning", "Audit mirror needs review", "Append-only audit mirror is missing events or contains invalid rows.", {
      status: auditTrail.status,
      missingFromTrailCount: numberValue(auditTrail.missingFromTrailCount),
      invalidLineCount: numberValue(auditTrail.invalidLineCount),
    }));
  }

  if (externalAudit.required && externalAudit.status !== "synced") {
    alerts.push(alert("external_audit_required_not_synced", "critical", "Required external audit provider is not synced", "Fix external audit URL, secret, receipts, or delivery before production launch.", {
      status: externalAudit.status,
      endpointConfigured: Boolean(externalAudit.endpointConfigured),
      missingFromExternalCount: numberValue(externalAudit.missingFromExternalCount),
    }));
  } else if (!externalAudit.enabled) {
    alerts.push(alert("external_audit_disabled", "warning", "External audit provider is disabled", "Enable immutable external audit storage before launch if compliance-grade audit retention is required.", {
      provider: externalAudit.provider || "disabled",
    }));
  }

  if (paymentGateway.configured === false) {
    alerts.push(alert("payment_gateway_not_configured", "critical", "Payment gateway is not fully configured", "Set the selected payment gateway secrets, webhook secret, success URL, cancel URL, and price ids.", {
      provider: paymentGateway.provider || "unknown",
    }));
  } else if (paymentGateway.provider === "local_gateway") {
    alerts.push(alert("local_payment_gateway", "warning", "Local payment gateway is active", "Use Stripe Checkout or another production payment provider before charging real customers.", {
      provider: paymentGateway.provider,
    }));
  }

  if (rejectedWebhookEvents > 0) {
    alerts.push(alert(
      rejectedWebhookRatio >= 0.5 ? "webhook_rejection_spike" : "webhook_rejections_present",
      rejectedWebhookRatio >= 0.5 ? "critical" : "warning",
      rejectedWebhookRatio >= 0.5 ? "Payment webhook rejection spike" : "Payment webhook rejections present",
      "Review webhook signatures, timestamp tolerance, session ids, and provider mapping.",
      {
        webhookEvents,
        rejectedWebhookEvents,
        rejectedWebhookRatio,
      },
    ));
  }

  if (numberValue(metrics.failedPaymentSessions) > 0) {
    alerts.push(alert("failed_payment_sessions", "warning", "Failed payment sessions present", "Review failed checkout sessions and customer support follow-up.", {
      failedPaymentSessions: numberValue(metrics.failedPaymentSessions),
    }));
  }

  if (numberValue(metrics.pendingPaymentSessions) > 10) {
    alerts.push(alert("pending_payment_backlog", "warning", "Pending payment session backlog", "Review stale pending checkout sessions and webhook delivery.", {
      pendingPaymentSessions: numberValue(metrics.pendingPaymentSessions),
    }));
  }

  if (repository.productionReady === false) {
    alerts.push(alert("repository_not_production_ready", "warning", "Repository is not production-ready", "Move from local-file storage to a configured production database before launch.", {
      adapter: repository.adapter || "unknown",
      migrationTarget: repository.migrationTarget || "",
    }));
  }

  return alerts;
}

function repositoryCheck(repository = {}) {
  return {
    status: repository.productionReady === false ? "warning" : "ok",
    adapter: repository.adapter || "unknown",
    productionReady: Boolean(repository.productionReady),
    scopedReads: repository.scopedReads || repository.tenantQueryGuard?.scopedReadMode || "",
    migrationTarget: repository.migrationTarget || "",
  };
}

function storageCheck(storage = {}) {
  return {
    status: storage.status || "unknown",
    schemaVersion: storage.schemaVersion || "",
    totalRecords: numberValue(storage.totalRecords),
    blockerCount: numberValue(storage.blockerCount),
    warningCount: numberValue(storage.warningCount),
  };
}

function auditCheck(metrics = {}) {
  const auditTrail = metrics.auditTrail || {};
  return {
    integrityStatus: metrics.auditIntegrity?.status || "unknown",
    trailStatus: auditTrail.status || "unknown",
    auditEvents: numberValue(metrics.auditEvents),
    trailEvents: numberValue(auditTrail.trailEvents),
    missingFromTrailCount: numberValue(auditTrail.missingFromTrailCount),
    invalidLineCount: numberValue(auditTrail.invalidLineCount),
    externalStatus: auditTrail.external?.status || "unknown",
    externalEnabled: Boolean(auditTrail.external?.enabled),
    externalRequired: Boolean(auditTrail.external?.required),
  };
}

function paymentCheck(metrics = {}) {
  const gateway = metrics.paymentGateway || {};
  const webhookEvents = numberValue(metrics.webhookEvents);
  const rejectedWebhookEvents = numberValue(metrics.rejectedWebhookEvents);
  return {
    status: gateway.configured === false ? "critical" : rejectedWebhookEvents > 0 ? "warning" : "ok",
    provider: gateway.provider || "unknown",
    configured: gateway.configured !== false,
    pendingPaymentSessions: numberValue(metrics.pendingPaymentSessions),
    failedPaymentSessions: numberValue(metrics.failedPaymentSessions),
    webhookEvents,
    rejectedWebhookEvents,
    rejectedWebhookRatio: webhookEvents ? rejectedWebhookEvents / webhookEvents : 0,
  };
}

function businessCheck(metrics = {}) {
  return {
    users: numberValue(metrics.users),
    activeSessions: numberValue(metrics.activeSessions),
    paidUsers: numberValue(metrics.paidUsers),
    trials: numberValue(metrics.trials),
    mrrEstimate: numberValue(metrics.mrrEstimate),
    revenueCollected: numberValue(metrics.revenueCollected),
    pendingApprovalRequests: numberValue(metrics.pendingApprovalRequests),
    advisorAssignments: numberValue(metrics.advisorAssignments),
  };
}

function dependencyRiskCheck() {
  return {
    status: "covered_by_ci",
    gate: "npm run test:dependency-risk",
    register: "docs/DEPENDENCY_RISK_REGISTER.md",
  };
}

function highestSeverityStatus(alerts) {
  if (alerts.some((item) => item.severity === "critical")) {
    return "critical";
  }
  if (alerts.some((item) => item.severity === "warning")) {
    return "warning";
  }
  return "ok";
}

function alert(id, severity, title, message, details = {}) {
  return {
    id,
    severity,
    title,
    message,
    details,
  };
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
