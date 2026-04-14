import { BACKEND_URL, SOS_URL } from "../constants";
import { withAuthHeaders } from "../api/auth";
import { fetchVbcChecklistByAppointment } from "../api/vbcChecklist";

const normalizeToken = (value = "") =>
  String(value).toLowerCase().trim().replace(/[\s_-]/g, "");

const normalizeText = (value = "") => String(value || "").trim();

const isLocalhost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location?.hostname;
  return host === "localhost" || host === "127.0.0.1";
};

const BASE = (
  process.env.REACT_APP_VBC_API_BASE_URL ||
  SOS_URL ||
  BACKEND_URL ||
  (isLocalhost() ? "http://127.0.0.1:8080" : "") ||
  ""
).replace(/\/+$/, "");
const api = (path) => `${BASE}/${String(path).replace(/^\/+/, "")}`;

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const pickFirst = (...values) => values.find(hasValue);

const toDate = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toIsoDate = (value) => {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

const addDays = (value, days) => {
  const date = toDate(value) || new Date();
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
};

const normalizePriority = (value = "") => {
  const token = normalizeToken(value);
  if (token.includes("high") || token.includes("urgent") || token.includes("critical")) {
    return "HIGH";
  }
  if (token.includes("medium") || token.includes("moderate")) {
    return "MEDIUM";
  }
  return "LOW";
};

const getFallbackActionLabel = (row = {}) => {
  const badges = Array.isArray(row.gapBadges) ? row.gapBadges : [];
  const normalizedBadges = badges.map((badge) => normalizeToken(badge));

  if (normalizedBadges.some((badge) => badge.includes("a1c"))) {
    return "Order HbA1c and schedule diabetes follow-up";
  }
  if (normalizedBadges.some((badge) => badge === "bp" || badge.includes("bloodpressure"))) {
    return "Repeat blood pressure and review antihypertensive regimen";
  }
  if (normalizedBadges.some((badge) => badge.includes("ldl") || badge.includes("lipid"))) {
    return "Review statin therapy and lipid management";
  }
  if (normalizedBadges.some((badge) => badge.includes("renal") || badge.includes("kidney"))) {
    return "Order renal screening and document follow-up";
  }
  if (normalizedBadges.some((badge) => badge.includes("eye"))) {
    return "Schedule retinal eye exam";
  }
  if (normalizedBadges.some((badge) => badge.includes("foot"))) {
    return "Schedule diabetic foot exam";
  }
  if (normalizedBadges.some((badge) => badge.includes("phq") || badge.includes("depression"))) {
    return "Arrange behavioral health follow-up";
  }

  if (Number(row.openGapCount) > 0) {
    return "Review preventive care needs before the appointment";
  }
  if (Number(row.addressedGapCount) > 0) {
    return "Confirm documentation and patient follow-up";
  }
  return "Prepare the visit agenda and verify care plan";
};

const deriveOwner = (actionLabel = "", reason = "") => {
  const token = normalizeToken(`${actionLabel} ${reason}`);

  if (
    ["behavioral", "mentalhealth", "phq", "depression", "counseling"].some((keyword) =>
      token.includes(keyword)
    )
  ) {
    return "behavioral_health";
  }

  if (
    ["schedule", "appointment", "visit", "frontdesk", "referral"].some((keyword) =>
      token.includes(keyword)
    )
  ) {
    return "front_desk";
  }

  if (
    ["outreach", "call", "followup", "caremanager", "contact"].some((keyword) =>
      token.includes(keyword)
    )
  ) {
    return "care_manager";
  }

  return "provider";
};

const deriveDueDate = (priority, referenceDate) => {
  if (priority === "HIGH") return addDays(referenceDate, 7);
  if (priority === "MEDIUM") return addDays(referenceDate, 14);
  return addDays(referenceDate, 30);
};

const deriveStatus = ({ openGapCount = 0, addressedGapCount = 0, priority = "LOW" } = {}) => {
  if (Number(openGapCount) > 0) {
    return priority === "HIGH" ? "URGENT" : "OPEN";
  }
  if (Number(addressedGapCount) > 0) return "FOLLOW_UP";
  return "READY";
};

export const WORKFLOW_STATUS_OPTIONS = [
  "URGENT",
  "OPEN",
  "FOLLOW_UP",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
  "DEFERRED",
];

export const WORKFLOW_OWNER_OPTIONS = [
  "provider",
  "care_manager",
  "front_desk",
  "behavioral_health",
];

const normalizeWorkflowStatus = (value = "") => {
  const token = normalizeToken(value);
  if (!token) return "READY";
  if (token === "followup") return "FOLLOW_UP";
  if (token === "inprogress") return "IN_PROGRESS";
  if (token === "completed" || token === "closed" || token === "done") return "COMPLETED";
  if (token === "deferred") return "DEFERRED";
  if (token === "urgent") return "URGENT";
  if (token === "open") return "OPEN";
  return "READY";
};

const normalizeWorkflowOwner = (value = "") => {
  const token = normalizeToken(value);
  if (token === "caremanager") return "care_manager";
  if (token === "frontdesk") return "front_desk";
  if (token === "behavioralhealth") return "behavioral_health";
  return token || "provider";
};

export const formatWorkflowOwner = (owner = "") => {
  const token = normalizeToken(normalizeWorkflowOwner(owner));
  if (token === "caremanager") return "Care Manager";
  if (token === "frontdesk") return "Front Desk";
  if (token === "behavioralhealth") return "Behavioral Health";
  return "Provider";
};

export const getWorkflowBadgeClassName = (status = "") => {
  const token = normalizeToken(status);
  if (token === "urgent") return "border-red-200 bg-red-50 text-red-700";
  if (token === "open") return "border-amber-200 bg-amber-50 text-amber-700";
  if (token === "followup") return "border-blue-200 bg-blue-50 text-blue-700";
  if (token === "inprogress") return "border-violet-200 bg-violet-50 text-violet-700";
  if (token === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (token === "deferred") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

export const buildWorkflowTask = (row = {}, { referenceDate } = {}) => {
  const firstAction = Array.isArray(row.nextBestActions) ? row.nextBestActions[0] : null;
  const actionLabel = normalizeText(
    pickFirst(firstAction?.label, firstAction?.action, row.nextBestAction, getFallbackActionLabel(row))
  );
  const priority = normalizePriority(
    pickFirst(firstAction?.priority, row.priority, Number(row.openGapCount) > 0 ? "MEDIUM" : "LOW")
  );
  const owner = normalizeText(
    pickFirst(firstAction?.owner, firstAction?.assignedTo, deriveOwner(actionLabel, firstAction?.reason))
  );
  const dueDate = normalizeText(
    pickFirst(
      firstAction?.dueDate,
      firstAction?.due_date,
      deriveDueDate(priority, referenceDate || row.appointmentDate || new Date())
    )
  );

  return {
    action: actionLabel,
    priority,
    owner,
    dueDate,
    status: deriveStatus({
      openGapCount: row.openGapCount,
      addressedGapCount: row.addressedGapCount,
      priority,
    }),
    reason: normalizeText(firstAction?.reason),
  };
};

export const getWorkflowTaskKey = (row = {}, task = {}) =>
  [
    normalizeText(row.id || row.appointmentId || row.callId || "unknown"),
    normalizeToken(row.patientName || "unknown"),
    normalizeToken(task.action || row.nextBestAction || "task"),
  ].join("::");

export const applyWorkflowTaskOverride = (task = {}, override = {}) => ({
  ...task,
  status: normalizeWorkflowStatus(pickFirst(override.status, task.status)),
  owner: normalizeWorkflowOwner(pickFirst(override.owner, task.owner)),
  dueDate: normalizeText(pickFirst(override.dueDate, task.dueDate)),
  reason: normalizeText(pickFirst(override.reason, task.reason)),
});

const parseApiResponse = async (response, fallbackMessage = "Request failed") => {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    const errorMessage =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" && payload.trim()) ||
      `${fallbackMessage} (${response.status})`;
    throw new Error(errorMessage);
  }

  return payload;
};

// Starter VBC workflow helpers - lightweight orchestrations used by UI.

export async function loadChecklistForAppointment(appointmentId) {
  if (!appointmentId) throw new Error('appointmentId required');
  try {
    const checklist = await fetchVbcChecklistByAppointment(appointmentId);
    return checklist;
  } catch (e) {
    console.error('loadChecklistForAppointment error', e);
    throw e;
  }
}

export async function submitChecklistForAppointment(appointmentId, data) {
  if (!appointmentId) throw new Error('appointmentId required');
  try {
    const response = await fetch(api("/api/vbc/checklist"), {
      method: "POST",
      headers: withAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ appointmentId, data }),
    });
    const res = await parseApiResponse(response, "Failed to submit VBC checklist");
    return res;
  } catch (e) {
    console.error('submitChecklistForAppointment error', e);
    throw e;
  }
}

export async function startVbccycle(appointmentId) {
  if (!appointmentId) throw new Error('appointmentId required');
  try {
    const response = await fetch(api("/api/vbc/cycle/start"), {
      method: "POST",
      headers: withAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ appointmentId }),
    });
    const res = await parseApiResponse(response, "Failed to start VBC cycle");
    return res;
  } catch (e) {
    console.error('startVbccycle error', e);
    throw e;
  }
}

export async function fetchVbcWorkqueue(params) {
  try {
    const query = new URLSearchParams(params || {}).toString();
    const response = await fetch(
      api(`/api/vbc/workqueue${query ? `?${query}` : ""}`),
      {
        headers: withAuthHeaders(),
      }
    );
    const res = await parseApiResponse(response, "Failed to fetch VBC work queue");
    return res;
  } catch (e) {
    console.error('fetchVbcWorkqueue error', e);
    throw e;
  }
}
