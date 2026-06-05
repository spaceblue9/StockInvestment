import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, ensureDataDirs } from "./pathService.js";

const AUDIT_TRAIL_FILE = path.join(DATA_DIR, "audit-events.ndjson");
const EXTERNAL_AUDIT_RECEIPTS_FILE = path.join(DATA_DIR, "audit-external-receipts.ndjson");
const AUDIT_TRAIL_VERSION = "local-ndjson-v1";
const EXTERNAL_AUDIT_VERSION = "external-http-v1";
const EXTERNAL_AUDIT_SIGNATURE_VERSION = "v1";
const DEFAULT_EXTERNAL_AUDIT_SECRET = "stockflix-local-audit-secret";
const EXTERNAL_AUDIT_SIGNATURE_HEADER = "x-stockflix-audit-signature";
const EXTERNAL_AUDIT_TIMESTAMP_HEADER = "x-stockflix-audit-timestamp";

export async function mirrorAuditTrail(auditEvents = []) {
  const events = Array.isArray(auditEvents) ? auditEvents.filter((event) => event?.id) : [];
  if (!events.length) {
    return auditTrailInfo();
  }

  const existing = await readAuditTrail();
  const mirroredIds = new Set(existing.events.map((event) => event.id).filter(Boolean));
  const missingEvents = events.filter((event) => !mirroredIds.has(event.id));
  if (!missingEvents.length) {
    await mirrorExternalAuditTrail(events);
    return auditTrailInfo();
  }

  ensureDataDirs();
  const payload = missingEvents
    .map((event) => JSON.stringify(event))
    .join("\n");
  await fs.appendFile(AUDIT_TRAIL_FILE, `${payload}\n`, "utf8");
  await mirrorExternalAuditTrail(events);
  return auditTrailInfo();
}

export async function auditTrailReadinessReport(stateAuditEvents = []) {
  const stateEvents = Array.isArray(stateAuditEvents) ? stateAuditEvents.filter((event) => event?.id) : [];
  const trail = await readAuditTrail();
  const externalReceipts = await readExternalAuditReceipts();
  const stateIds = new Set(stateEvents.map((event) => event.id));
  const trailIds = new Set(trail.events.map((event) => event.id).filter(Boolean));
  const externalEventIds = new Set(externalReceipts.events.map((receipt) => receipt.eventId).filter(Boolean));
  const missingFromTrail = stateEvents
    .filter((event) => !trailIds.has(event.id))
    .map(publicAuditTrailSample);
  const missingFromExternal = externalAuditEnabled()
    ? stateEvents
      .filter((event) => !externalEventIds.has(event.id))
      .map(publicAuditTrailSample)
    : [];
  const extraInTrail = trail.events
    .filter((event) => event?.id && !stateIds.has(event.id))
    .map(publicAuditTrailSample);
  const duplicateTrailIds = duplicateIds(trail.events);
  const externalIssueCount = externalAuditEnabled()
    ? missingFromExternal.length + externalReceipts.invalidLines.length + (externalAuditUrl() ? 0 : 1)
    : 0;
  const issueCount = trail.invalidLines.length
    + missingFromTrail.length
    + extraInTrail.length
    + duplicateTrailIds.length
    + externalIssueCount;
  const external = externalAuditReport({
    stateEvents,
    receipts: externalReceipts,
    missingFromExternal,
  });

  return {
    ...auditTrailInfo(),
    status: issueCount === 0 ? "synced" : "needs_review",
    stateEvents: stateEvents.length,
    trailEvents: trail.events.length,
    invalidLineCount: trail.invalidLines.length,
    missingFromTrailCount: missingFromTrail.length,
    extraInTrailCount: extraInTrail.length,
    duplicateTrailIdCount: duplicateTrailIds.length,
    external,
    missingFromTrail: missingFromTrail.slice(0, 10),
    missingFromExternal: missingFromExternal.slice(0, 10),
    extraInTrail: extraInTrail.slice(0, 10),
    duplicateTrailIds: duplicateTrailIds.slice(0, 10),
    invalidLines: trail.invalidLines.slice(0, 10),
  };
}

export function auditTrailInfo() {
  return {
    adapter: "local_ndjson",
    version: AUDIT_TRAIL_VERSION,
    trailFile: "data/audit-events.ndjson",
    appendOnly: true,
    productionReady: false,
    migrationTarget: "external_append_only_audit_storage",
    externalProvider: externalAuditInfo(),
  };
}

export function createExternalAuditSignature(body, timestamp = currentEpochSeconds()) {
  const digest = crypto
    .createHmac("sha256", externalAuditSecret())
    .update(`${timestamp}.${body}`)
    .digest("hex");

  return {
    signature: `${EXTERNAL_AUDIT_SIGNATURE_VERSION}=${digest}`,
    timestamp: String(timestamp),
  };
}

async function readAuditTrail() {
  ensureDataDirs();
  try {
    const content = await fs.readFile(AUDIT_TRAIL_FILE, "utf8");
    return parseNdjson(content);
  } catch {
    return {
      events: [],
      invalidLines: [],
      totalLines: 0,
    };
  }
}

async function mirrorExternalAuditTrail(auditEvents = []) {
  if (!externalAuditEnabled()) {
    return externalAuditInfo();
  }

  const url = externalAuditUrl();
  if (!url) {
    if (externalAuditRequired()) {
      throw new Error("AUDIT_TRAIL_HTTP_URL is required when external audit provider is required.");
    }
    return externalAuditInfo();
  }

  const receipts = await readExternalAuditReceipts();
  const mirroredIds = new Set(receipts.events.map((receipt) => receipt.eventId).filter(Boolean));
  const missingEvents = auditEvents.filter((event) => event?.id && !mirroredIds.has(event.id));
  if (!missingEvents.length) {
    return externalAuditInfo();
  }

  for (const event of missingEvents) {
    try {
      const receipt = await sendExternalAuditEvent(url, event);
      await appendExternalAuditReceipt(receipt);
    } catch (error) {
      if (externalAuditRequired()) {
        throw error;
      }
      return externalAuditInfo({
        lastError: error.message,
      });
    }
  }

  return externalAuditInfo();
}

async function sendExternalAuditEvent(url, event) {
  const body = JSON.stringify({
    version: EXTERNAL_AUDIT_VERSION,
    event,
  });
  const { signature, timestamp } = createExternalAuditSignature(body);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [EXTERNAL_AUDIT_SIGNATURE_HEADER]: signature,
      [EXTERNAL_AUDIT_TIMESTAMP_HEADER]: timestamp,
    },
    body,
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`External audit provider rejected event ${event.id}: ${response.status}`);
  }

  return {
    eventId: event.id,
    eventHash: event.eventHash || "",
    action: event.action || "",
    provider: selectedExternalAuditProvider(),
    endpointHost: safeEndpointHost(url),
    responseStatus: response.status,
    receiptId: parseReceiptId(responseText),
    createdAt: new Date().toISOString(),
  };
}

async function appendExternalAuditReceipt(receipt) {
  ensureDataDirs();
  await fs.appendFile(EXTERNAL_AUDIT_RECEIPTS_FILE, `${JSON.stringify(receipt)}\n`, "utf8");
}

async function readExternalAuditReceipts() {
  ensureDataDirs();
  try {
    const content = await fs.readFile(EXTERNAL_AUDIT_RECEIPTS_FILE, "utf8");
    return parseNdjson(content);
  } catch {
    return {
      events: [],
      invalidLines: [],
      totalLines: 0,
    };
  }
}

function parseNdjson(content) {
  const lines = String(content || "").split(/\r?\n/);
  const events = [];
  const invalidLines = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    try {
      const event = JSON.parse(trimmed);
      events.push(event);
    } catch {
      invalidLines.push({
        line: index + 1,
        preview: trimmed.slice(0, 120),
      });
    }
  });

  return {
    events,
    invalidLines,
    totalLines: lines.filter((line) => line.trim()).length,
  };
}

function externalAuditReport({ stateEvents, receipts, missingFromExternal }) {
  const info = externalAuditInfo();
  return {
    ...info,
    status: !info.enabled
      ? "disabled"
      : !info.endpointConfigured
        ? "needs_configuration"
        : missingFromExternal.length || receipts.invalidLines.length
          ? "needs_review"
          : "synced",
    stateEvents: stateEvents.length,
    receiptEvents: receipts.events.length,
    invalidReceiptLineCount: receipts.invalidLines.length,
    missingFromExternalCount: missingFromExternal.length,
    missingFromExternal: missingFromExternal.slice(0, 10),
    invalidReceiptLines: receipts.invalidLines.slice(0, 10),
  };
}

function externalAuditInfo(overrides = {}) {
  const provider = selectedExternalAuditProvider();
  const enabled = externalAuditEnabled();
  return {
    provider,
    version: EXTERNAL_AUDIT_VERSION,
    enabled,
    endpointConfigured: Boolean(externalAuditUrl()),
    endpointHost: safeEndpointHost(externalAuditUrl()),
    required: externalAuditRequired(),
    signatureHeader: EXTERNAL_AUDIT_SIGNATURE_HEADER,
    timestampHeader: EXTERNAL_AUDIT_TIMESTAMP_HEADER,
    secretConfigured: Boolean(process.env.AUDIT_TRAIL_HTTP_SECRET),
    receiptFile: "data/audit-external-receipts.ndjson",
    appendOnly: true,
    productionReady: enabled && Boolean(externalAuditUrl()) && Boolean(process.env.AUDIT_TRAIL_HTTP_SECRET),
    ...overrides,
  };
}

function selectedExternalAuditProvider() {
  return String(process.env.AUDIT_TRAIL_EXTERNAL_PROVIDER || "disabled").trim().toLowerCase();
}

function externalAuditEnabled() {
  return selectedExternalAuditProvider() === "http_webhook";
}

function externalAuditUrl() {
  return String(process.env.AUDIT_TRAIL_HTTP_URL || "").trim();
}

function externalAuditRequired() {
  return String(process.env.AUDIT_TRAIL_EXTERNAL_REQUIRED || "").trim().toLowerCase() === "true";
}

function externalAuditSecret() {
  return process.env.AUDIT_TRAIL_HTTP_SECRET || DEFAULT_EXTERNAL_AUDIT_SECRET;
}

function currentEpochSeconds() {
  return Math.floor(Date.now() / 1000);
}

function safeEndpointHost(url) {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return "";
  }
}

function parseReceiptId(responseText) {
  try {
    const parsed = JSON.parse(responseText);
    return String(parsed.receiptId || parsed.id || "").slice(0, 120);
  } catch {
    return "";
  }
}

function duplicateIds(events) {
  const seen = new Set();
  const duplicates = new Set();

  events.forEach((event) => {
    if (!event?.id) {
      return;
    }
    if (seen.has(event.id)) {
      duplicates.add(event.id);
    } else {
      seen.add(event.id);
    }
  });

  return [...duplicates];
}

function publicAuditTrailSample(event) {
  return {
    id: event.id || "",
    action: event.action || "",
    createdAt: event.createdAt || "",
    hashPreview: event.hashPreview || String(event.eventHash || "").slice(0, 12),
  };
}
