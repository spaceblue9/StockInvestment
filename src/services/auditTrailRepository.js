import fs from "fs/promises";
import path from "path";
import { DATA_DIR, ensureDataDirs } from "./pathService.js";

const AUDIT_TRAIL_FILE = path.join(DATA_DIR, "audit-events.ndjson");
const AUDIT_TRAIL_VERSION = "local-ndjson-v1";

export async function mirrorAuditTrail(auditEvents = []) {
  const events = Array.isArray(auditEvents) ? auditEvents.filter((event) => event?.id) : [];
  if (!events.length) {
    return auditTrailInfo();
  }

  const existing = await readAuditTrail();
  const mirroredIds = new Set(existing.events.map((event) => event.id).filter(Boolean));
  const missingEvents = events.filter((event) => !mirroredIds.has(event.id));
  if (!missingEvents.length) {
    return auditTrailInfo();
  }

  ensureDataDirs();
  const payload = missingEvents
    .map((event) => JSON.stringify(event))
    .join("\n");
  await fs.appendFile(AUDIT_TRAIL_FILE, `${payload}\n`, "utf8");
  return auditTrailInfo();
}

export async function auditTrailReadinessReport(stateAuditEvents = []) {
  const stateEvents = Array.isArray(stateAuditEvents) ? stateAuditEvents.filter((event) => event?.id) : [];
  const trail = await readAuditTrail();
  const stateIds = new Set(stateEvents.map((event) => event.id));
  const trailIds = new Set(trail.events.map((event) => event.id).filter(Boolean));
  const missingFromTrail = stateEvents
    .filter((event) => !trailIds.has(event.id))
    .map(publicAuditTrailSample);
  const extraInTrail = trail.events
    .filter((event) => event?.id && !stateIds.has(event.id))
    .map(publicAuditTrailSample);
  const duplicateTrailIds = duplicateIds(trail.events);
  const issueCount = trail.invalidLines.length
    + missingFromTrail.length
    + extraInTrail.length
    + duplicateTrailIds.length;

  return {
    ...auditTrailInfo(),
    status: issueCount === 0 ? "synced" : "needs_review",
    stateEvents: stateEvents.length,
    trailEvents: trail.events.length,
    invalidLineCount: trail.invalidLines.length,
    missingFromTrailCount: missingFromTrail.length,
    extraInTrailCount: extraInTrail.length,
    duplicateTrailIdCount: duplicateTrailIds.length,
    missingFromTrail: missingFromTrail.slice(0, 10),
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
