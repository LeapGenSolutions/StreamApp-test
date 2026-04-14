import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { io } from "socket.io-client";
import {
  fetchVbcChecklistByAppointment,
  saveVbcChecklistItemReview,
} from "../api/vbcChecklist";
import { fetchVbcDetailsConfig } from "../api/vbcSummary";
import { getSessionAuthToken } from "../api/auth";
import { SOS_URL } from "../constants";
import {
  getStoredVbcChecklistReviews,
  writeStoredVbcChecklistReviews,
} from "../lib/vbcChecklistReviewStore";

const POLL_INTERVAL_MS = 3000;
const ERROR_POLL_INTERVAL_MS = 15000;
const CHECKLIST_DUPLICATE_WINDOW_MS = 2200;
const AUTO_MATCH_SERVER_GRACE_MS = 450;
const EMPTY_FALLBACK_ITEMS = [];
const SOCKET_RECONNECT_ATTEMPTS = 2;
const MAX_CHECKLIST_ITEMS = Number.MAX_SAFE_INTEGER;

// ── Keyword matching helpers (client-side fallback until middleware NLP is live)
const SHORT_MEDICAL_TOKENS = new Set(["bp", "er", "ed", "ldl", "hdl", "a1c", "dm", "htn"]);
const STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","by","for","from","has","have","in","is",
  "it","of","on","or","the","to","was","were","with","you","your","any","please","today","recent",
]);
const QUESTION_PREFIXES = [
  "do you","are you","have you","can you","did you","when was","what was",
  "is your","are your","tell me","any ",
];

const toTokens = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
    .split(" ")
    .filter((t) => t && !STOP_WORDS.has(t) && (t.length > 2 || SHORT_MEDICAL_TOKENS.has(t)));

const isLikelyQuestionPrompt = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (raw.includes("?")) return true;
  const norm = raw.toLowerCase();
  return QUESTION_PREFIXES.some((p) => norm.startsWith(p));
};

const hasTokenOverlap = (questionTokens, transcriptTokenSet) => {
  if (!questionTokens?.length || !transcriptTokenSet?.size) return false;
  let hits = 0;
  for (const t of questionTokens) { if (transcriptTokenSet.has(t)) hits++; }
  if (questionTokens.length <= 3) return hits === questionTokens.length;
  if (questionTokens.length <= 5) return hits >= questionTokens.length - 1;
  return hits >= 5 && hits / questionTokens.length >= 0.75;
};

const countTokenHits = (questionTokens, transcriptTokenSet) => {
  if (!questionTokens?.length || !transcriptTokenSet?.size) return 0;
  let hits = 0;
  for (const token of questionTokens) {
    if (transcriptTokenSet.has(token)) hits += 1;
  }
  return hits;
};

const scorePromptMatch = (questionTokens, transcriptTokenSet) => {
  if (!hasTokenOverlap(questionTokens, transcriptTokenSet)) return null;

  const hits = countTokenHits(questionTokens, transcriptTokenSet);
  if (hits === 0) return null;

  const coverage = hits / questionTokens.length;
  return hits * 1000 + Math.round(coverage * 100) - questionTokens.length;
};

const getBestChecklistMatch = (normalizedChecklistById, transcriptTokenSet) => {
  let bestMatch = null;
  let hasTie = false;

  for (const [itemId, { promptTokens, isQuestion }] of Object.entries(
    normalizedChecklistById
  )) {
    if (!isQuestion || !Array.isArray(promptTokens) || promptTokens.length === 0) continue;

    const bestPromptScore = promptTokens.reduce((maxScore, questionTokens) => {
      const score = scorePromptMatch(questionTokens, transcriptTokenSet);
      if (score == null) return maxScore;
      return maxScore == null || score > maxScore ? score : maxScore;
    }, null);

    if (bestPromptScore == null) continue;

    if (!bestMatch || bestPromptScore > bestMatch.score) {
      bestMatch = { itemId, score: bestPromptScore };
      hasTie = false;
      continue;
    }

    if (bestPromptScore === bestMatch.score) {
      hasTie = true;
    }
  }

  if (!bestMatch || hasTie) return null;
  return bestMatch.itemId;
};

// Standard HEDIS / VBC care-gap questions used to track quality measures.
// These mirror the gaps the backend calculates scores against.
const DEFAULT_FALLBACK_VBC_ITEMS = [
  {
    id: "vbc-diabetes-labs",
    category: "Diabetes Monitoring",
    text: "Have you had your blood sugar and kidney tests checked recently?",
    matchPrompts: [
      "Have you had your blood sugar tested recently?",
      "Have you had your kidneys checked recently?",
    ],
  },
  {
    id: "vbc-diabetes-exams",
    category: "Diabetes Preventive Exams",
    text: "Have you had your eye exam and foot check recently?",
    matchPrompts: [
      "Have you had your eye exam in the past year?",
      "Have you had your feet checked recently, or any numbness, tingling, or sores?",
    ],
  },
  {
    id: "vbc-cardiovascular",
    category: "Cardiovascular Risk Management",
    text: "Have you checked your blood pressure, and are you taking your cholesterol medicine?",
    matchPrompts: [
      "Have you checked your blood pressure recently?",
      "Are you taking your cholesterol medicine regularly?",
    ],
  },
  {
    id: "vbc-medications-lifestyle",
    category: "Medication and Lifestyle",
    text: "Are you taking your medicines regularly, and do you use tobacco?",
    matchPrompts: [
      "Are you taking your medicines as directed, or do you miss doses?",
      "Do you smoke or use tobacco products?",
    ],
  },
  {
    id: "vbc-screening-mood",
    category: "Preventive and Behavioral Health",
    text: "Are you up to date on your cancer screening, and how has your mood been lately?",
    matchPrompts: [
      "Are you up to date on your colon cancer screening?",
      "In the last 2 weeks, have you felt very down, sad, or less interested in things?",
    ],
  },
];

const normalizeForMatch = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeGapStatus = (value = "") => {
  const normalized = normalizeForMatch(value);
  if (
    ["closed", "addressed", "complete", "completed", "resolved", "met"].some((token) =>
      normalized.includes(token)
    )
  ) {
    return "closed";
  }
  return "open";
};

const getGapCategory = ({ measure = "", gap = "", badge = "" } = {}) => {
  const token = normalizeForMatch(`${measure} ${gap} ${badge}`);
  if (!token) return "General";
  if (
    ["a1c", "hba1c", "eye", "foot", "kidney", "renal", "albumin"].some((keyword) =>
      token.includes(keyword)
    )
  ) {
    return "Diabetes Monitoring";
  }
  if (
    ["blood pressure", "bp", "ldl", "statin", "lipid", "cholesterol"].some((keyword) =>
      token.includes(keyword)
    )
  ) {
    return "Cardiovascular Risk Management";
  }
  if (
    ["depression", "phq", "behavioral", "mood"].some((keyword) =>
      token.includes(keyword)
    )
  ) {
    return "Behavioral Health";
  }
  if (
    ["colorectal", "mammogram", "flu", "vaccine", "tobacco", "bmi"].some((keyword) =>
      token.includes(keyword)
    )
  ) {
    return "Preventive Care";
  }
  return "General";
};

const isDoctorFacingQuestion = (value = "") => {
  const normalized = normalizeForMatch(value);
  return [
    "can you review",
    "did you review",
    "can you confirm",
    "did you confirm",
    "can you address",
    "did you address",
    "did you perform",
    "can you discuss",
    "did you document",
  ].some((prefix) => normalized.startsWith(prefix));
};

const simplifyPatientQuestion = (value = "") =>
  String(value || "")
    .replace(/\bHbA1c\b/gi, "blood sugar")
    .replace(/\bA1c\b/gi, "blood sugar")
    .replace(/\bLDL\b/gi, "cholesterol")
    .replace(/\bstatin\b/gi, "cholesterol medicine")
    .replace(/\bPHQ-9\b/gi, "mood questionnaire")
    .replace(/\balbumin\b/gi, "kidney")
    .replace(/\bcreatinine\b/gi, "kidney")
    .replace(/\brenal\b/gi, "kidney")
    .replace(/\bdiabetic\b/gi, "diabetes-related")
    .replace(/\s+/g, " ")
    .trim();

const simplifyGapLabel = (value = "") => {
  const token = normalizeForMatch(value);
  if (token.includes("a1c") || token.includes("blood sugar")) return "your blood sugar";
  if (token.includes("blood pressure") || token === "bp") return "your blood pressure";
  if (
    token.includes("statin") ||
    token.includes("ldl") ||
    token.includes("lipid") ||
    token.includes("cholesterol")
  ) {
    return "your cholesterol medicine";
  }
  if (token.includes("kidney") || token.includes("renal") || token.includes("albumin")) {
    return "your kidney check";
  }
  if (token.includes("eye")) return "your eye exam";
  if (token.includes("foot")) return "your foot check";
  if (token.includes("depression") || token.includes("phq") || token.includes("mood")) {
    return "your mood";
  }
  if (token.includes("visit frequency") || token.includes("continuity")) {
    return "your follow-up visits";
  }
  return simplifyPatientQuestion(value);
};

const buildQuestionForGap = (gap = {}, backendItem = {}) => {
  const backendQuestion = [backendItem?.question, backendItem?.text]
    .map((value) => String(value || "").trim())
    .find((value) => value && isLikelyQuestionPrompt(value));
  if (backendQuestion && !isDoctorFacingQuestion(backendQuestion)) {
    return simplifyPatientQuestion(backendQuestion);
  }

  const token = normalizeForMatch(
    `${gap?.measure || ""} ${gap?.evidence || ""} ${backendItem?.gap || ""} ${backendItem?.badge || ""}`
  );
  if (token.includes("a1c")) {
    return "Have you had your blood sugar checked recently?";
  }
  if (token.includes("kidney") || token.includes("renal") || token.includes("albumin")) {
    return "Have you had your kidneys checked recently?";
  }
  if (token.includes("blood pressure") || token.includes("bp")) {
    return "Have you checked your blood pressure recently?";
  }
  if (
    token.includes("statin") ||
    token.includes("ldl") ||
    token.includes("lipid") ||
    token.includes("cholesterol")
  ) {
    return "Are you taking your cholesterol medicine regularly?";
  }
  if (token.includes("eye")) {
    return "Have you had your eye exam in the last year?";
  }
  if (token.includes("foot")) {
    return "Have you had your feet checked recently, or any numbness, tingling, or sores?";
  }
  if (
    token.includes("depression") ||
    token.includes("phq") ||
    token.includes("behavioral") ||
    token.includes("mood")
  ) {
    return "In the last 2 weeks, have you felt very down, sad, or less interested in things?";
  }
  if (token.includes("visit frequency") || token.includes("continuity")) {
    return "When was your last follow-up visit, and are you able to come in regularly for care?";
  }

  const measure = simplifyGapLabel(gap?.measure || backendItem?.label || backendItem?.gap || "");
  if (measure) {
    return `Have you completed or discussed ${measure}?`;
  }
  return "Have you completed or discussed this care gap?";
};

const sortGapsForChecklist = (left = {}, right = {}) => {
  const leftStatus = normalizeGapStatus(left?.status);
  const rightStatus = normalizeGapStatus(right?.status);
  if (leftStatus !== rightStatus) {
    return leftStatus === "open" ? -1 : 1;
  }

  const leftDueDate = String(left?.dueDate || "").slice(0, 10);
  const rightDueDate = String(right?.dueDate || "").slice(0, 10);
  if (leftDueDate && rightDueDate && leftDueDate !== rightDueDate) {
    return leftDueDate.localeCompare(rightDueDate);
  }

  return String(left?.measure || "").localeCompare(String(right?.measure || ""));
};

const getBackendMatchTokens = (item = {}) =>
  [item.gap, item.badge, item.label, item.text, item.question]
    .map((value) => normalizeForMatch(value))
    .filter(Boolean);

const findMatchingBackendItem = (gap = {}, backendItems = [], usedBackendIds = new Set()) => {
  const gapTokens = [gap.measure, gap.evidence]
    .map((value) => normalizeForMatch(value))
    .filter(Boolean);

  if (gapTokens.length === 0) return null;

  return (
    backendItems.find((item) => {
      const itemId = String(item?.id || "");
      if (!itemId || usedBackendIds.has(itemId)) return false;

      const itemTokens = getBackendMatchTokens(item);
      return gapTokens.some((gapToken) =>
        itemTokens.some(
          (itemToken) =>
            itemToken === gapToken ||
            itemToken.includes(gapToken) ||
            gapToken.includes(itemToken)
        )
      );
    }) || null
  );
};

const isLikelyDoctorSpeaker = (speaker, doctorName, doctorEmail) => {
  const normalizedSpeaker = normalizeForMatch(speaker);
  if (!normalizedSpeaker) return true;
  if (
    normalizedSpeaker.includes("patient") ||
    normalizedSpeaker.includes("member") ||
    normalizedSpeaker.includes("caller")
  ) {
    return false;
  }
  if (
    normalizedSpeaker.includes("doctor") ||
    normalizedSpeaker.includes("provider") ||
    normalizedSpeaker.includes("clinician") ||
    normalizedSpeaker.includes("physician") ||
    normalizedSpeaker.includes("speaker")
  ) {
    return true;
  }

  const doctorIdentifiers = [doctorName, doctorEmail]
    .map((identifier) => normalizeForMatch(identifier))
    .filter(Boolean);

  if (doctorIdentifiers.length === 0) return true;

  const hasDirectDoctorMatch = doctorIdentifiers.some(
    (identifier) =>
      normalizedSpeaker.includes(identifier) ||
      identifier.includes(normalizedSpeaker)
  );
  if (hasDirectDoctorMatch) return true;

  // If we have clinician identity and speaker does not match, avoid false positives.
  if (doctorIdentifiers.length > 0) return false;
  return true;
};


const toFallbackChecklistItems = (fallbackItems = []) =>
  fallbackItems.slice(0, MAX_CHECKLIST_ITEMS).map((item, index) => {
    const text =
      typeof item === "string"
        ? item
        : item?.text || `Checklist item ${index + 1}`;
    const id =
      typeof item === "string"
        ? `fallback-${index + 1}`
        : item?.id || `fallback-${index + 1}`;
    const category =
      typeof item === "string"
        ? "General"
        : item?.category || item?.group || item?.domain || "General";

    return {
      id: String(id),
      text: String(text),
      question: String(text),
      gapLabel: String(text),
      category: String(category),
      addressed: false,
      status: "open",
      matchPrompts: Array.isArray(item?.matchPrompts)
        ? item.matchPrompts.map((prompt) => String(prompt)).filter(Boolean)
        : [],
      isFallbackItem: true,
      isBackendSyncable: false,
    };
  });

const getSyncErrorMessage = (error) => {
  if (!error) return "Unable to sync with middleware";
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return "Unable to sync with middleware";
};

const normalizeReviewStatus = (value = "") => {
  const normalized = String(value).toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (!normalized) return "";
  if (["reviewed", "addressed"].includes(normalized)) return "reviewed";
  if (["completed", "complete", "closed"].includes(normalized)) return "completed";
  if (
    ["still_open", "open", "needs_follow_up", "follow_up", "needsfollowup"].includes(
      normalized
    )
  ) {
    return "still_open";
  }
  if (["deferred", "defer"].includes(normalized)) return "deferred";
  return normalized;
};

const isAddressedReviewStatus = (status = "") =>
  ["reviewed", "completed"].includes(normalizeReviewStatus(status));

const getDefaultReviewStatus = (item = {}) =>
  item?.addressed || normalizeGapStatus(item?.status) === "closed"
    ? "completed"
    : "still_open";


const pruneMapByIds = (map, validIdSet) => {
  const next = {};
  let changed = false;

  for (const [key, value] of Object.entries(map)) {
    if (!validIdSet.has(String(key))) {
      changed = true;
      continue;
    }
    next[key] = value;
  }

  return changed ? next : map;
};


const buildChecklistItems = ({
  patientVbc,
  backendItems,
  fallbackChecklistItems,
}) => {
  const normalizedBackendItems = Array.isArray(backendItems) ? backendItems : [];
  const selectedItems = [];
  const usedBackendIds = new Set();
  const openVbcGaps = Array.isArray(patientVbc?.gapsInCare)
    ? [...patientVbc.gapsInCare]
        .filter((gap) => normalizeGapStatus(gap?.status) === "open")
        .sort(sortGapsForChecklist)
    : [];

  if (openVbcGaps.length > 0) {
    openVbcGaps.forEach((gap, index) => {
      if (selectedItems.length >= MAX_CHECKLIST_ITEMS) return;

      const backendItem = findMatchingBackendItem(gap, normalizedBackendItems, usedBackendIds);
      if (backendItem?.id) {
        usedBackendIds.add(String(backendItem.id));
      }

      const question = buildQuestionForGap(gap, backendItem);
      const gapLabel = String(gap?.measure || backendItem?.label || backendItem?.gap || `Open gap ${index + 1}`);

      const prompts = Array.from(
        new Set(
          [
            ...(Array.isArray(backendItem?.matchPrompts) ? backendItem.matchPrompts : []),
            backendItem?.question,
            backendItem?.text,
            question,
            gap?.measure,
            gap?.evidence,
          ]
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        )
      );

      selectedItems.push({
        id: backendItem?.id || `patient-vbc-${index + 1}`,
        text: question,
        category:
          backendItem?.category ||
          getGapCategory({
            measure: gap?.measure,
            gap: backendItem?.gap,
            badge: backendItem?.badge,
          }),
        addressed:
          normalizeGapStatus(gap?.status) === "closed" || Boolean(backendItem?.addressed),
        status:
          normalizeGapStatus(gap?.status) === "closed" || Boolean(backendItem?.addressed)
            ? "addressed"
            : "open",
        gap: String(backendItem?.gap || ""),
        badge: String(backendItem?.badge || ""),
        question,
        label: gapLabel,
        gapLabel,
        evidence: String(gap?.evidence || backendItem?.evidence || ""),
        dueDate: gap?.dueDate || backendItem?.dueDate || null,
        matchPrompts: prompts,
        isBackendSyncable: Boolean(backendItem?.isBackendSyncable),
        isPatientVbcItem: true,
      });
    });
  }

  normalizedBackendItems.forEach((item) => {
    if (selectedItems.length >= MAX_CHECKLIST_ITEMS) return;
    if (item?.id && usedBackendIds.has(String(item.id))) return;

    const question = String(item?.question || item?.text || `Checklist item ${selectedItems.length + 1}`);
    const gapLabel = String(item?.label || item?.gap || item?.category || `Checklist item ${selectedItems.length + 1}`);

    selectedItems.push({
      ...item,
      text: question,
      question,
      gapLabel,
      category: item?.category || getGapCategory(item),
      matchPrompts: Array.isArray(item?.matchPrompts)
        ? item.matchPrompts
        : [item?.question, item?.text].filter(Boolean),
      isBackendSyncable: Boolean(item?.isBackendSyncable),
    });
  });

  if (selectedItems.length === 0) {
    return fallbackChecklistItems.slice(0, MAX_CHECKLIST_ITEMS);
  }

  return selectedItems.slice(0, MAX_CHECKLIST_ITEMS);
};

const VBCChecklist = ({
  appointmentId,
  fallbackItems,
  doctorName = "",
  doctorEmail = "",
  patientVbc = null,
}) => {
  const providedFallbackItems =
    Array.isArray(fallbackItems) && fallbackItems.length > 0
      ? fallbackItems
      : EMPTY_FALLBACK_ITEMS;
  const resolvedFallbackItems =
    providedFallbackItems.length > 0
      ? providedFallbackItems
      : DEFAULT_FALLBACK_VBC_ITEMS;
  const fallbackChecklistItems = useMemo(
    () => toFallbackChecklistItems(resolvedFallbackItems),
    [resolvedFallbackItems]
  );
  const [items, setItems] = useState([]);
  const patientLifecycleRef = useRef(
    patientVbc && typeof patientVbc === "object" ? patientVbc : null
  );
  const [manualReviewsById, setManualReviewsById] = useState(() =>
    appointmentId ? getStoredVbcChecklistReviews(appointmentId) : {}
  );
  const normalizedChecklistById = useMemo(() => {
    const map = {};
    for (const item of items) {
      const basePrompts =
        Array.isArray(item.matchPrompts) && item.matchPrompts.length > 0
          ? item.matchPrompts
          : [item.question || item.text];
      const prompts = basePrompts
        .map((prompt) => String(prompt || "").trim())
        .filter(Boolean);
      const questionPrompts = prompts.filter((prompt) => isLikelyQuestionPrompt(prompt));
      const promptsForMatching =
        questionPrompts.length > 0 ? questionPrompts : prompts;

      map[String(item.id)] = {
        promptTokens: promptsForMatching
          .map((prompt) => toTokens(prompt))
          .filter((tokens) => tokens.length > 0),
        isQuestion:
          questionPrompts.length > 0 ||
          prompts.some((prompt) => isLikelyQuestionPrompt(prompt)),
      };
    }
    return map;
  }, [items]);
  const [autoDetectedReviewById, setAutoDetectedReviewById] = useState({});
  const [, setSyncStatusById] = useState({});
  const [, setSyncErrorById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const inFlightRequestRef = useRef(null);
  const syncAbortControllersRef = useRef(new Map());
  const socketRef = useRef(null);
  const itemsRef = useRef([]);
  const lastTranscriptRef = useRef({ text: "", timestamp: 0 });
  const lastServerDetectionAtRef = useRef(0);
  const pendingFallbackTimeoutRef = useRef(null);

  useEffect(() => {
    patientLifecycleRef.current =
      patientVbc && typeof patientVbc === "object" ? patientVbc : null;
  }, [patientVbc]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    setManualReviewsById(appointmentId ? getStoredVbcChecklistReviews(appointmentId) : {});
  }, [appointmentId]);

  const mergedItems = useMemo(
    () =>
      items.map((item) => {
        const itemId = String(item.id);
        const manualReview = manualReviewsById[itemId] || {};
        const reviewStatus =
          normalizeReviewStatus(manualReview.reviewStatus) || getDefaultReviewStatus(item);
        return {
          ...item,
          addressed: isAddressedReviewStatus(reviewStatus),
          reviewStatus,
        };
      }),
    [items, manualReviewsById]
  );

  const addressedCount = useMemo(
    () => mergedItems.filter((item) => isAddressedReviewStatus(item.reviewStatus)).length,
    [mergedItems]
  );
  const completionPercent =
    mergedItems.length > 0 ? Math.round((addressedCount / mergedItems.length) * 100) : 0;
  const categoryProgress = useMemo(() => {
    const progressMap = new Map();

    for (const item of mergedItems) {
      const category = String(item.category || "General");
      const existing = progressMap.get(category) || { total: 0, addressed: 0 };
      existing.total += 1;
      if (isAddressedReviewStatus(item.reviewStatus)) {
        existing.addressed += 1;
      }
      progressMap.set(category, existing);
    }

    return Array.from(progressMap.entries()).map(([category, value]) => ({
      category,
      total: value.total,
      addressed: value.addressed,
    }));
  }, [mergedItems]);
  const shouldShowLoadError = hasError && fallbackChecklistItems.length === 0;

  useEffect(() => {
    const detail = {
      appointmentId: appointmentId || "",
      totals: {
        total: mergedItems.length,
        addressed: addressedCount,
        completionPercent,
      },
      categories: categoryProgress,
      items: mergedItems.map((item) => ({
        id: item.id,
        category: item.category || "General",
        text: item.text,
        status: item.reviewStatus,
      })),
    };

    window.dispatchEvent(
      new CustomEvent("vbc-checklist-analysis", {
        detail,
      })
    );
  }, [
    appointmentId,
    mergedItems,
    addressedCount,
    completionPercent,
    categoryProgress,
  ]);

  const loadChecklist = useCallback(
    async (showLoader = false) => {
      if (!appointmentId) {
        setItems(
          buildChecklistItems({
            patientVbc: patientLifecycleRef.current,
            backendItems: [],
            fallbackChecklistItems,
          })
        );
        setHasError(false);
        setIsLoading(false);
        return true;
      }

      if (showLoader) {
        setIsLoading(true);
      }

      const controller = new AbortController();
      inFlightRequestRef.current?.abort();
      inFlightRequestRef.current = controller;

      try {
        const [checklistResult, detailsResult] = await Promise.allSettled([
          fetchVbcChecklistByAppointment(appointmentId, {
            signal: controller.signal,
          }),
          fetchVbcDetailsConfig(
            { appointmentId },
            { signal: controller.signal }
          ),
        ]);

        const backendItems =
          checklistResult.status === "fulfilled" && Array.isArray(checklistResult.value)
            ? [...checklistResult.value].sort(
                (left, right) =>
                  Number(Boolean(left?.addressed)) - Number(Boolean(right?.addressed))
              )
            : [];
        const resolvedPatientVbc =
          detailsResult.status === "fulfilled" && detailsResult.value?.patientVbc
            ? detailsResult.value.patientVbc
            : patientLifecycleRef.current;

        if (resolvedPatientVbc && typeof resolvedPatientVbc === "object") {
          patientLifecycleRef.current = resolvedPatientVbc;
        }

        const selectedItems = buildChecklistItems({
          patientVbc: resolvedPatientVbc,
          backendItems,
          fallbackChecklistItems,
        });

        setItems(selectedItems);
        setHasError(
          checklistResult.status === "rejected" &&
            detailsResult.status === "rejected"
        );
        return checklistResult.status === "fulfilled" || detailsResult.status === "fulfilled";
      } catch (error) {
        if (error?.name === "AbortError") return null;
        setItems(
          buildChecklistItems({
            patientVbc: patientLifecycleRef.current,
            backendItems: [],
            fallbackChecklistItems,
          })
        );
        setHasError(true);
        return false;
      } finally {
        if (inFlightRequestRef.current === controller) {
          inFlightRequestRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [appointmentId, fallbackChecklistItems]
  );

  const updateLocalReview = useCallback(
    (itemId, patch = {}) => {
      const normalizedId = String(itemId);
      setManualReviewsById((previous) => {
        const nextValue = {
          ...previous,
          [normalizedId]: {
            ...(previous[normalizedId] || {}),
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        };
        if (appointmentId) {
          writeStoredVbcChecklistReviews(appointmentId, nextValue);
        }
        return nextValue;
      });
    },
    [appointmentId]
  );

  const persistReview = useCallback(
    async (itemId, reviewPatch = {}, { reloadAfterSave = false } = {}) => {
      const normalizedId = String(itemId);
      const checklistItem = itemsRef.current.find(
        (item) => String(item.id) === normalizedId
      );
      const currentReview = manualReviewsById[normalizedId] || {};
      const reviewStatus =
        normalizeReviewStatus(
          reviewPatch.reviewStatus ?? currentReview.reviewStatus
        ) || getDefaultReviewStatus(checklistItem || {});

      const nextReview = {
        ...currentReview,
        ...reviewPatch,
        reviewStatus,
        notes: String(reviewPatch.notes ?? currentReview.notes ?? ""),
        evidenceText: String(
          reviewPatch.evidenceText ??
            currentReview.evidenceText ??
            checklistItem?.evidence ??
            ""
        ),
        reasonNotCompleted: String(
          reviewPatch.reasonNotCompleted ?? currentReview.reasonNotCompleted ?? ""
        ),
        reviewedAt: reviewPatch.reviewedAt ?? new Date().toISOString(),
        reviewSource:
          reviewPatch.reviewSource ??
          currentReview.reviewSource ??
          "doctor_manual",
      };

      updateLocalReview(normalizedId, nextReview);

      if (!appointmentId || !checklistItem?.isBackendSyncable) {
        setSyncStatusById((previous) => ({ ...previous, [normalizedId]: "local" }));
        return true;
      }

      syncAbortControllersRef.current.get(normalizedId)?.abort();
      const controller = new AbortController();
      syncAbortControllersRef.current.set(normalizedId, controller);

      setSyncStatusById((previous) => ({ ...previous, [normalizedId]: "pending" }));
      setSyncErrorById((previous) => {
        if (!previous[normalizedId]) return previous;
        const next = { ...previous };
        delete next[normalizedId];
        return next;
      });

      try {
        await saveVbcChecklistItemReview(
          appointmentId,
          normalizedId,
          {
            ...nextReview,
            addressed: isAddressedReviewStatus(reviewStatus),
          },
          { signal: controller.signal }
        );

        setSyncStatusById((previous) => ({ ...previous, [normalizedId]: "synced" }));
        if (reloadAfterSave) {
          loadChecklist(false);
        }
        return true;
      } catch (error) {
        if (error?.name === "AbortError") return null;
        setSyncStatusById((previous) => ({ ...previous, [normalizedId]: "failed" }));
        setSyncErrorById((previous) => ({
          ...previous,
          [normalizedId]: getSyncErrorMessage(error),
        }));
        return false;
      } finally {
        if (syncAbortControllersRef.current.get(normalizedId) === controller) {
          syncAbortControllersRef.current.delete(normalizedId);
        }
      }
    },
    [appointmentId, loadChecklist, manualReviewsById, updateLocalReview]
  );

  const applyAutoDetectedReview = useCallback(
    (itemId) => {
      const normalizedId = String(itemId);
      if (autoDetectedReviewById[normalizedId]) return;
      if (normalizeReviewStatus(manualReviewsById[normalizedId]?.reviewStatus)) return;

      setAutoDetectedReviewById((previous) => ({
        ...previous,
        [normalizedId]: true,
      }));

      void persistReview(
        normalizedId,
        {
          reviewStatus: "reviewed",
          reviewSource: "transcript_match",
        },
        { reloadAfterSave: false }
      );
    },
    [autoDetectedReviewById, manualReviewsById, persistReview]
  );

  useEffect(() => {
    setAutoDetectedReviewById({});
    setSyncStatusById({});
    setSyncErrorById({});
    lastServerDetectionAtRef.current = 0;
    if (pendingFallbackTimeoutRef.current) {
      window.clearTimeout(pendingFallbackTimeoutRef.current);
      pendingFallbackTimeoutRef.current = null;
    }
    for (const controller of syncAbortControllersRef.current.values()) {
      controller.abort();
    }
    syncAbortControllersRef.current.clear();
  }, [appointmentId]);


  useEffect(
    () => () => {
      if (pendingFallbackTimeoutRef.current) {
        window.clearTimeout(pendingFallbackTimeoutRef.current);
        pendingFallbackTimeoutRef.current = null;
      }
      for (const controller of syncAbortControllersRef.current.values()) {
        controller.abort();
      }
      syncAbortControllersRef.current.clear();
    },
    []
  );

  // ── Socket.io: connect to middleware for server-side NLP gap detection ───────
  useEffect(() => {
    if (!appointmentId || !SOS_URL) return;

    const authToken = getSessionAuthToken();
    const socket = io(SOS_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: SOCKET_RECONNECT_ATTEMPTS,
      timeout: 4000,
      auth: authToken ? { token: authToken } : undefined,
    });
    socketRef.current = socket;

    socket.emit("join-session", { apptId: appointmentId, authToken });

    // Middleware detected a gap being addressed — mark the matching item
    socket.on("vbc-gap-detected", ({ itemId, badge }) => {
      lastServerDetectionAtRef.current = Date.now();

      const matchedId = (() => {
        if (itemId) return String(itemId);
        // fallback: match by badge label against item text
        const found = itemsRef.current.find((item) =>
          badge && normalizeForMatch(item.text).includes(normalizeForMatch(badge))
        );
        return found ? String(found.id) : null;
      })();

      if (!matchedId) return;

      applyAutoDetectedReview(matchedId);
    });

    return () => {
      socket.emit("end-session", { apptId: appointmentId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appointmentId, applyAutoDetectedReview]);

  // ── Forward live transcript to socket.io + client-side keyword matching ──────
  useEffect(() => {
    const handleTranscript = (event) => {
      const transcript = event?.detail?.text;
      const speaker = event?.detail?.speaker;
      const isFinal = event?.detail?.is_final !== false;

      if (!transcript) return;
      if (!isLikelyDoctorSpeaker(speaker, doctorName, doctorEmail)) return;

      // Forward to middleware if connected
      if (socketRef.current?.connected) {
        socketRef.current.emit("transcript-chunk", {
          apptId: appointmentId,
          text: transcript,
          speaker,
          isFinal,
          authToken: getSessionAuthToken(),
        });
      }

      // Client-side keyword matching fallback (always runs)
      if (!isFinal) return;

      const now = Date.now();
      const prev = lastTranscriptRef.current;
      if (
        transcript === prev.text &&
        now - prev.timestamp < CHECKLIST_DUPLICATE_WINDOW_MS
      )
        return;
      lastTranscriptRef.current = { text: transcript, timestamp: now };

      const transcriptTokenSet = new Set(toTokens(transcript));
      if (transcriptTokenSet.size === 0) return;

      const transcriptReceivedAt = now;
      const runClientFallback = () => {
        if (lastServerDetectionAtRef.current >= transcriptReceivedAt) return;

        const matchedItemId = getBestChecklistMatch(
          normalizedChecklistById,
          transcriptTokenSet
        );
        if (!matchedItemId) return;

        applyAutoDetectedReview(matchedItemId);
      };

      if (pendingFallbackTimeoutRef.current) {
        window.clearTimeout(pendingFallbackTimeoutRef.current);
        pendingFallbackTimeoutRef.current = null;
      }

      if (socketRef.current?.connected) {
        pendingFallbackTimeoutRef.current = window.setTimeout(() => {
          pendingFallbackTimeoutRef.current = null;
          runClientFallback();
        }, AUTO_MATCH_SERVER_GRACE_MS);
        return;
      }

      runClientFallback();
    };

    window.addEventListener("realtime-transcript", handleTranscript);
    return () => {
      window.removeEventListener("realtime-transcript", handleTranscript);
      if (pendingFallbackTimeoutRef.current) {
        window.clearTimeout(pendingFallbackTimeoutRef.current);
        pendingFallbackTimeoutRef.current = null;
      }
    };
  }, [appointmentId, doctorEmail, doctorName, normalizedChecklistById, applyAutoDetectedReview]);

  useEffect(() => {
    let timeoutId = null;
    let isDisposed = false;

    const scheduleNextLoad = (delay) => {
      timeoutId = window.setTimeout(async () => {
        if (isDisposed) return;
        if (document.visibilityState === "hidden") {
          scheduleNextLoad(delay);
          return;
        }

        const didLoadSucceed = await loadChecklist(false);
        const nextDelay =
          didLoadSucceed === false ? ERROR_POLL_INTERVAL_MS : POLL_INTERVAL_MS;
        scheduleNextLoad(nextDelay);
      }, delay);
    };

    loadChecklist(true).then((didLoadSucceed) => {
      if (isDisposed) return;
      const nextDelay =
        didLoadSucceed === false ? ERROR_POLL_INTERVAL_MS : POLL_INTERVAL_MS;
      scheduleNextLoad(nextDelay);
    });

    return () => {
      isDisposed = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      inFlightRequestRef.current?.abort();
    };
  }, [loadChecklist]);

  useEffect(() => {
    const validIds = new Set(items.map((item) => String(item.id)));

    setAutoDetectedReviewById((previous) => pruneMapByIds(previous, validIds));
    setSyncStatusById((previous) => pruneMapByIds(previous, validIds));
    setSyncErrorById((previous) => pruneMapByIds(previous, validIds));
    setManualReviewsById((previous) => {
      const nextValue = pruneMapByIds(previous, validIds);
      if (appointmentId && nextValue !== previous) {
        writeStoredVbcChecklistReviews(appointmentId, nextValue);
      }
      return nextValue;
    });
  }, [items, appointmentId]);

  return (
    <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Checklist Questions</h2>
      </div>
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="animate-pulse rounded-lg border border-gray-200 p-3"
            >
              <div className="mb-2 h-4 w-5/6 rounded bg-gray-200" />
              <div className="h-3 w-1/3 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && shouldShowLoadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load visit review items from middleware.
          <button
            onClick={() => loadChecklist(true)}
            className="ml-2 font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && mergedItems.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          No open VBC gaps are available for this appointment.
        </div>
      )}

      {!isLoading && mergedItems.length > 0 && (
        <div className="space-y-2">
          {mergedItems.map((item) => (
            <article
              key={item.id}
              className={`rounded-lg border px-3 py-3 transition-colors ${
                item.addressed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    item.addressed
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-red-600 bg-red-600 text-white"
                  }`}
                  aria-hidden="true"
                >
                  {item.addressed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-6 text-gray-900" title={item.question || item.text}>
                    {item.question || item.text || "Checklist item"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
};

export default VBCChecklist;
