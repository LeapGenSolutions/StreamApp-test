import { BACKEND_URL, SOS_URL } from "../constants";
import { withAuthHeaders } from "./auth";

const isLocalhost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location?.hostname;
  return host === "localhost" || host === "127.0.0.1";
};

const isLoopbackUrl = (value = "") => {
  const text = String(value || "").trim().toLowerCase();
  return text.includes("localhost") || text.includes("127.0.0.1");
};

const envApiBase = String(process.env.REACT_APP_VBC_API_BASE_URL || "").trim();
const resolvedEnvApiBase =
  envApiBase && (!isLoopbackUrl(envApiBase) || isLocalhost()) ? envApiBase : "";

const BASE = (
  resolvedEnvApiBase ||
  SOS_URL ||
  BACKEND_URL ||
  (isLocalhost() ? "http://127.0.0.1:8080" : "") ||
  ""
).replace(/\/+$/, "");
const api = (path) => `${BASE}/${String(path).replace(/^\/+/, "")}`;

const getChecklistEndpoints = (appointmentId) => {
  const encodedAppointmentId = encodeURIComponent(appointmentId);
  return [
    api(`/api/vbc-checklist/${encodedAppointmentId}`),
    api(`/api/vbc/checklist/${encodedAppointmentId}`),
    api(`/api/vbc/${encodedAppointmentId}/checklist`),
    api(`/api/vbc/appointments/${encodedAppointmentId}/checklist`),
  ];
};

const getChecklistUpdateRequests = (appointmentId, checklistItemId) => {
  const encodedAppointmentId = encodeURIComponent(appointmentId);
  const encodedChecklistItemId = encodeURIComponent(checklistItemId);

  return [
    {
      method: "PATCH",
      endpoint: api(
        `/api/vbc-checklist/${encodedAppointmentId}/items/${encodedChecklistItemId}`
      ),
    },
    {
      method: "PATCH",
      endpoint: api(
        `/api/vbc/checklist/${encodedAppointmentId}/items/${encodedChecklistItemId}`
      ),
    },
    {
      method: "PATCH",
      endpoint: api(`/api/vbc-checklist/${encodedAppointmentId}/addressed`),
    },
    {
      method: "PATCH",
      endpoint: api(`/api/vbc/checklist/${encodedAppointmentId}/addressed`),
    },
    {
      method: "POST",
      endpoint: api(`/api/vbc-checklist/${encodedAppointmentId}/addressed`),
    },
  ];
};

const getChecklistReviewRequests = (appointmentId, checklistItemId) => {
  const encodedAppointmentId = encodeURIComponent(appointmentId);
  const encodedChecklistItemId = encodeURIComponent(checklistItemId);

  return [
    {
      method: "POST",
      endpoint: api(`/api/vbc-checklist/${encodedAppointmentId}/reviews`),
    },
    {
      method: "POST",
      endpoint: api(`/api/vbc/checklist/${encodedAppointmentId}/reviews`),
    },
    {
      method: "PATCH",
      endpoint: api(
        `/api/vbc-checklist/${encodedAppointmentId}/items/${encodedChecklistItemId}/review`
      ),
    },
    {
      method: "PATCH",
      endpoint: api(
        `/api/vbc/checklist/${encodedAppointmentId}/items/${encodedChecklistItemId}/review`
      ),
    },
    {
      method: "PATCH",
      endpoint: api(
        `/api/vbc-checklist/${encodedAppointmentId}/items/${encodedChecklistItemId}`
      ),
    },
    {
      method: "PATCH",
      endpoint: api(
        `/api/vbc/checklist/${encodedAppointmentId}/items/${encodedChecklistItemId}`
      ),
    },
  ];
};

const normalizeReviewStatus = (value = "") => {
  const normalized = String(value).toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (!normalized) return "";
  if (["completed", "complete", "closed"].includes(normalized)) return "completed";
  if (["reviewed", "addressed", "review", "reviewed_today"].includes(normalized)) {
    return "reviewed";
  }
  if (
    [
      "still_open",
      "open",
      "needs_follow_up",
      "needsfollowup",
      "follow_up",
    ].includes(normalized)
  ) {
    return "still_open";
  }
  if (["deferred", "defer"].includes(normalized)) return "deferred";
  return normalized;
};

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const pickFirst = (...values) => values.find(hasValue);

const toText = (value = "", fallback = "") =>
  hasValue(value) ? String(value).trim() : fallback;

const toTextList = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.map((entry) => toText(entry)).filter(Boolean);
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((entry) => toText(entry)).filter(Boolean);
        }
      } catch {
        return trimmed
          .split(/[|,;\n]/)
          .map((entry) => toText(entry))
          .filter(Boolean);
      }
    }
  }

  return [];
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return fallback;
};

const sendChecklistMutation = async (
  requests,
  payload,
  { signal } = {},
  defaultErrorMessage = "Failed to update checklist item"
) => {
  let lastError = null;

  for (const request of requests) {
    try {
      const response = await fetch(request.endpoint, {
        method: request.method,
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
        signal,
      });

      if (response.ok) {
        try {
          return await response.json();
        } catch {
          return true;
        }
      }

      const errorText = await response.text().catch(() => "");
      lastError = new Error(
        errorText || `${defaultErrorMessage} (${response.status})`
      );
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError || new Error(defaultErrorMessage);
};

const normalizeChecklistItem = (item, index) => {
  if (!item) return null;

  const metadata =
    item.metadata && typeof item.metadata === "object" ? item.metadata : {};
  const evidence =
    item.evidence && typeof item.evidence === "object"
      ? item.evidence
      : metadata.evidence && typeof metadata.evidence === "object"
      ? metadata.evidence
      : {};
  const prompts =
    item.prompts && typeof item.prompts === "object" ? item.prompts : {};
  const sync =
    item.sync && typeof item.sync === "object" ? item.sync : {};

  const id =
    item.id ??
    item.itemId ??
    item.checklistItemId ??
    item.checklist_item_id ??
    index + 1;
  const text = pickFirst(
    item.text,
    item.question_text,
    item.question,
    item.prompt,
    item.title,
    item.label,
    item.name,
    metadata.text
  );
  const category = toText(
    pickFirst(
      item.category,
      item.domain,
      item.group,
      item.section,
      metadata.category
    ),
    "General"
  );
  const normalizedStatus = String(
    item.status ?? item.review_status ?? item.gapStatus ?? item.gap_status ?? item.state ?? ""
  )
    .toLowerCase()
    .trim();
  const addressedRaw =
    item.addressed ??
    item.isAddressed ??
    item.is_addressed ??
    item.completed ??
    item.is_complete ??
    item.resolved ??
    (["addressed", "closed", "complete", "completed", "resolved", "met"].includes(normalizedStatus)
      ? true
      : normalizedStatus === "open"
      ? false
      : undefined);
  const matchPrompts = toTextList(
    item.matchPrompts,
    item.match_prompts,
    item.match_prompts_json,
    prompts.matchPrompts,
    prompts.items,
    metadata.matchPrompts
  );

  return {
    id: String(id),
    text: toText(text, `Checklist item ${index + 1}`),
    category,
    addressed: Boolean(addressedRaw),
    status: normalizedStatus || (Boolean(addressedRaw) ? "addressed" : "open"),
    gap: toText(item.gap ?? item.gap_label ?? item.measure_key),
    badge: toText(item.badge ?? metadata.badge),
    question: toText(item.question ?? item.question_text ?? text, `Checklist item ${index + 1}`),
    label: toText(item.label ?? item.gap_label ?? item.name ?? text, `Checklist item ${index + 1}`),
    notes: toText(item.notes ?? metadata.notes),
    evidence: toText(
      pickFirst(
        item.evidence,
        item.evidence_text,
        evidence.text,
        evidence.summary,
        item.reason,
        item.description
      )
    ),
    dueDate:
      pickFirst(
        item.dueDate,
        item.due_date,
        item.dueOn,
        metadata.dueDate,
        metadata.due_date
      ) ?? null,
    matchPrompts,
    isBackendSyncable: toBoolean(
      pickFirst(
        item.isBackendSyncable,
        item.is_backend_syncable,
        sync.isBackendSyncable,
        metadata.isBackendSyncable
      ),
      true
    ),
  };
};

export const fetchVbcChecklistByAppointment = async (
  appointmentId,
  { signal } = {}
) => {
  if (!appointmentId) return [];

  let lastError = null;

  for (const endpoint of getChecklistEndpoints(appointmentId)) {
    try {
      const response = await fetch(endpoint, {
        signal,
        headers: withAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        lastError = new Error(
          errorText || `Failed to load VBC checklist (${response.status})`
        );
        continue;
      }

      let data = [];
      try {
        data = await response.json();
      } catch {
        data = [];
      }

      const items = Array.isArray(data)
        ? data
        : data?.items || data?.checklist || data?.data || [];

      if (!Array.isArray(items)) return [];

      return items.map(normalizeChecklistItem).filter(Boolean);
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to load VBC checklist");
};

export const markVbcChecklistItemAddressed = async (
  appointmentId,
  checklistItemId,
  { signal } = {}
) => {
  if (!appointmentId || !checklistItemId) return;

  const payload = {
    reviewStatus: "reviewed",
    review_status: "reviewed",
    status: "reviewed",
    addressed: true,
    itemId: checklistItemId,
    checklist_item_id: checklistItemId,
    source: "transcript",
    review_source: "transcript_match",
    addressedAt: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
  };

  return sendChecklistMutation(
    getChecklistUpdateRequests(appointmentId, checklistItemId),
    { checklistItemId, ...payload },
    { signal },
    "Failed to mark checklist item addressed"
  );
};

export const saveVbcChecklistItemReview = async (
  appointmentId,
  checklistItemId,
  review = {},
  { signal } = {}
) => {
  if (!appointmentId || !checklistItemId) return;

  const reviewStatus = normalizeReviewStatus(
    review.reviewStatus ?? review.status ?? "reviewed"
  );
  const addressed =
    review.addressed ??
    ["reviewed", "completed"].includes(reviewStatus);

  const payload = {
    checklistItemId,
    itemId: checklistItemId,
    checklist_item_id: checklistItemId,
    reviewStatus,
    review_status: reviewStatus,
    status: reviewStatus,
    addressed,
    notes: review.notes ?? "",
    evidenceText: review.evidenceText ?? review.evidence ?? "",
    evidence_text: review.evidenceText ?? review.evidence ?? "",
    reasonNotCompleted: review.reasonNotCompleted ?? "",
    reason_not_completed: review.reasonNotCompleted ?? "",
    reviewedAt: review.reviewedAt ?? new Date().toISOString(),
    reviewed_at: review.reviewedAt ?? new Date().toISOString(),
    reviewSource: review.reviewSource ?? review.source ?? "doctor_manual",
    review_source: review.reviewSource ?? review.source ?? "doctor_manual",
  };

  try {
    return await sendChecklistMutation(
      getChecklistReviewRequests(appointmentId, checklistItemId),
      payload,
      { signal },
      "Failed to save checklist review"
    );
  } catch (reviewError) {
    if (!addressed) {
      throw reviewError;
    }

    return sendChecklistMutation(
      getChecklistUpdateRequests(appointmentId, checklistItemId),
      payload,
      { signal },
      "Failed to save checklist review"
    );
  }
};
