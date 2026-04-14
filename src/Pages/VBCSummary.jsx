import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RotateCcw,
  Search,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import { PageNavigation } from "../components/ui/page-navigation";
import DoctorMultiSelect from "../components/DoctorMultiSelect";
import { fetchAppointmentDetails } from "../redux/appointment-actions";
import { fetchDoctors } from "../redux/doctors-actions";
import { getSessionAuthScope } from "../api/auth";
import { fetchVbcSummary } from "../api/vbcSummary";
import {
  applyWorkflowTaskOverride,
  buildWorkflowTask,
  formatWorkflowOwner,
  getWorkflowBadgeClassName,
  getWorkflowTaskKey,
} from "../lib/vbcWorkflow";
import { getVbcTaskOverrides } from "../lib/vbcTaskStore";

// ─── Constants ───────────────────────────────────────────────────────────────

const SUMMARY_PAGE_SIZE = 10;
const MAX_GAP_BADGES_SHOWN = 4;

const NEXT_ACTION_BY_GAP = {
  A1c: "Order HbA1c and schedule diabetic follow-up",
  BP: "Review blood pressure control and medication plan",
  Meds: "Confirm medication adherence and reconcile prescriptions",
  LDL: "Review lipid screening or statin plan",
  Eye: "Schedule retinal eye exam",
  Foot: "Schedule diabetic foot exam",
  Renal: "Order renal screening and document follow-up",
};

// ─── Pure utility helpers ─────────────────────────────────────────────────────

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeToken = (value = "") =>
  String(value).toLowerCase().trim().replace(/[\s_-]/g, "");

const normalizeType = (value = "") => normalizeToken(value);

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const pickFirst = (...values) => values.find(hasValue);

const normalizeAppointmentDate = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return format(value, "yyyy-MM-dd");
  return "";
};

// ─── Extractor helpers ────────────────────────────────────────────────────────

const extractClinicId = (item = {}) =>
  String(
    pickFirst(
      item.clinicId,
      item.clinic_id,
      item.practiceId,
      item.practice_id,
      item.facilityId,
      item.facility_id,
      item.clinic?.id,
      item.practice?.id,
      item.facility?.id
    ) || ""
  ).trim();

const extractClinicLabel = (item = {}) => {
  const label = pickFirst(
    item.clinicName,
    item.clinic_name,
    item.practiceName,
    item.practice_name,
    item.facilityName,
    item.facility_name,
    item.clinic?.name,
    item.practice?.name,
    item.facility?.name
  );
  return hasValue(label) ? String(label).trim() : "";
};

const extractDoctorEmail = (item = {}) => {
  const direct = pickFirst(
    item.doctorEmail,
    item.doctor_email,
    item.providerEmail,
    item.provider_email,
    item.userID,
    item.userId
  );
  if (hasValue(direct)) return normalizeEmail(direct);
  const fallbackId = String(item.id || "").trim();
  return fallbackId.includes("@") ? normalizeEmail(fallbackId) : "";
};

const extractDoctorName = (item = {}) => {
  const direct = pickFirst(
    item.doctorName,
    item.doctor_name,
    item.providerName,
    item.provider_name,
    item.fullName,
    item.name
  );
  if (hasValue(direct)) return String(direct).trim();
  return [item.firstName, item.lastName].filter(hasValue).join(" ").trim();
};

const extractDoctorId = (item = {}) =>
  String(
    pickFirst(item.doctorId, item.doctor_id, item.providerId, item.provider_id) || ""
  ).trim();

// ─── Formatting helpers ───────────────────────────────────────────────────────

const hasNamedClinicLabel = (clinicLabel = "", clinicId = "") =>
  hasValue(clinicLabel) && normalizeToken(clinicLabel) !== normalizeToken(clinicId);

const formatClinicOptionLabel = (clinicLabel = "", clinicId = "") => {
  if (hasNamedClinicLabel(clinicLabel, clinicId)) return String(clinicLabel).trim();
  if (hasValue(clinicId)) return `Clinic ${String(clinicId).trim()}`;
  return "Unknown clinic";
};

const getClinicDisplayName = (clinicLabel = "", clinicId = "") => {
  if (hasNamedClinicLabel(clinicLabel, clinicId)) return String(clinicLabel).trim();
  if (hasValue(clinicId)) return String(clinicId).trim();
  return "Unknown clinic";
};

const formatReadableLabel = (value = "", fallback = "-") => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return fallback;
  const normalized = normalizeToken(rawValue);
  if (normalized === "inperson") return "In-person";
  if (normalized === "awv") return "AWV";
  if (normalized === "telehealth") return "Telehealth";
  return rawValue
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const buildWorklistSearchText = (row = {}) =>
  [
    row.patientName,
    row.doctorName,
    row.doctorEmail,
    row.clinicName,
    row.priority,
    row.type,
    row.status,
    ...(Array.isArray(row.gapBadges) ? row.gapBadges : []),
    row.workflowTask?.action,
    row.workflowTask?.reason,
    formatWorkflowOwner(row.workflowTask?.owner),
  ]
    .filter(hasValue)
    .map((value) => normalizeToken(value))
    .join(" ");

const flattenValues = (value) =>
  Array.isArray(value)
    ? value.flatMap((item) => flattenValues(item))
    : value !== undefined && value !== null
    ? [value]
    : [];

const extractRoleTokens = (user = {}) =>
  [
    ...flattenValues(user.role),
    ...flattenValues(user.roles),
    ...flattenValues(user.accessLevel),
    ...flattenValues(user.scope),
  ]
    .map((value) => normalizeToken(value))
    .filter(Boolean);

const getVbcAccessLevel = (user = {}) => {
  const roleTokens = extractRoleTokens(user);
  const hasClinicLevelRole = roleTokens.some((token) =>
    ["clinic", "practice", "facility", "admin", "manager", "lead", "director"].some(
      (keyword) => token.includes(keyword)
    )
  );

  const hasDoctorLevelRole = roleTokens.some((token) =>
    ["doctor", "provider", "physician", "clinician"].some((keyword) =>
      token.includes(keyword)
    )
  );

  if (hasClinicLevelRole) return "clinic";
  if (hasDoctorLevelRole) return "doctor";
  return "clinic";
};

const getDoctorScopeDisplayName = (selectedDoctorEmails = [], doctorOptions = []) => {
  if (selectedDoctorEmails.length === 0) return "Whole clinic";

  const names = selectedDoctorEmails.map(
    (email) =>
      doctorOptions.find((doctor) => doctor.email === email)?.name || email
  );

  if (names.length === 1) return names[0];
  return `${names.length} doctors selected`;
};

// ─── Priority helpers ─────────────────────────────────────────────────────────

const isCancelledStatus = (status = "") => {
  const n = normalizeToken(status);
  return n === "cancelled" || n === "canceled";
};

const isHighPriority = (priority = "") => {
  const n = normalizeToken(priority);
  return n.includes("high") || n.includes("critical") || n.includes("urgent");
};

const getPriorityBadgeClassName = (priority = "") => {
  const n = String(priority).toLowerCase();
  if (n === "high") return "bg-red-100 text-red-700 border border-red-200";
  if (n === "medium") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
};

// ─── Action helpers ───────────────────────────────────────────────────────────

const getNextBestAction = (row = {}) => {
  const firstAction = Array.isArray(row.nextBestActions) ? row.nextBestActions[0] : null;
  const explicitAction = firstAction?.label || firstAction?.action;
  if (explicitAction) return explicitAction;
  const badges = Array.isArray(row.gapBadges) ? row.gapBadges : [];
  for (const badge of badges) {
    if (NEXT_ACTION_BY_GAP[badge]) return NEXT_ACTION_BY_GAP[badge];
  }
  if (isHighPriority(row.priority)) return "Review chart before visit and close open care gaps";
  if (toNumber(row.openGapCount) > 0) return "Review preventive care needs before the appointment";
  if (toNumber(row.addressedGapCount) > 0) return "Confirm documentation and patient follow-up";
  return "Prepare the visit agenda and verify care plan";
};

const getActionToneClassName = (row = {}) => {
  const firstAction = Array.isArray(row.nextBestActions) ? row.nextBestActions[0] : null;
  const explicitPriority = normalizeToken(firstAction?.priority);
  if (["high", "urgent", "critical"].some((token) => explicitPriority.includes(token))) {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (explicitPriority.includes("medium")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (isHighPriority(row.priority)) return "border-red-200 bg-red-50 text-red-800";
  if (toNumber(row.openGapCount) > 0) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
};

const WORKLIST_STATUS_ORDER = {
  URGENT: 0,
  OPEN: 1,
  FOLLOW_UP: 2,
  IN_PROGRESS: 3,
  READY: 4,
  COMPLETED: 5,
  DEFERRED: 6,
};

const WORKLIST_DUE_ORDER = {
  OVERDUE: 0,
  TODAY: 1,
  THIS_WEEK: 2,
  LATER: 3,
  UNSCHEDULED: 4,
};

const addDaysToDateKey = (dateKey, days) => {
  const parsed = new Date(`${String(dateKey || "").slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + days);
  return format(parsed, "yyyy-MM-dd");
};

const getWorklistGapState = (row = {}) => {
  if (toNumber(row.openGapCount) > 0) return "OPEN";
  if (toNumber(row.addressedGapCount) > 0) return "CLOSED";
  return "NO_GAPS";
};

const getWorklistDueBucket = (dueDate, { todayKey, weekEndKey }) => {
  const dueKey = normalizeAppointmentDate(dueDate) || String(dueDate || "").slice(0, 10);
  if (!dueKey) return "UNSCHEDULED";
  if (dueKey < todayKey) return "OVERDUE";
  if (dueKey === todayKey) return "TODAY";
  if (dueKey <= weekEndKey) return "THIS_WEEK";
  return "LATER";
};

const compareWorkflowRows = (left, right) => {
  const statusDiff =
    (WORKLIST_STATUS_ORDER[left.worklistStatus] ?? 99) -
    (WORKLIST_STATUS_ORDER[right.worklistStatus] ?? 99);
  if (statusDiff !== 0) return statusDiff;

  const dueBucketDiff =
    (WORKLIST_DUE_ORDER[left.worklistDueBucket] ?? 99) -
    (WORKLIST_DUE_ORDER[right.worklistDueBucket] ?? 99);
  if (dueBucketDiff !== 0) return dueBucketDiff;

  const dueDateDiff = String(left.workflowTask?.dueDate || "").localeCompare(
    String(right.workflowTask?.dueDate || "")
  );
  if (dueDateDiff !== 0) return dueDateDiff;

  const gapDiff = toNumber(right.openGapCount) - toNumber(left.openGapCount);
  if (gapDiff !== 0) return gapDiff;

  const priorityDiff = Number(isHighPriority(right.priority)) - Number(isHighPriority(left.priority));
  if (priorityDiff !== 0) return priorityDiff;

  const timeDiff = String(left.appointmentTime || "").localeCompare(String(right.appointmentTime || ""));
  if (timeDiff !== 0) return timeDiff;

  return String(left.patientName || "").localeCompare(String(right.patientName || ""));
};

// ─── selectSourceRows (extracted logic) ──────────────────────────────────────

const selectSourceRows = ({ mergedRows, apiRows, localRows, hasClinicScope, apiRowsSupportScopeFiltering }) => {
  if (
    mergedRows.length > 0 &&
    (!hasClinicScope || apiRowsSupportScopeFiltering || localRows.length > 0)
  ) {
    return mergedRows;
  }
  if (apiRows.length > 0 && (!hasClinicScope || apiRowsSupportScopeFiltering)) {
    return apiRows;
  }
  return localRows;
};

// ─── Custom hooks ─────────────────────────────────────────────────────────────

/**
 * Builds clinic/doctor directory from all available data sources.
 */
const useClinicDoctorScope = ({
  apiRows,
  appointments,
  rawDoctors,
  viewerClinicId,
  viewerClinicLabel,
  providerEmail,
  me,
}) => {
  const clinicDirectory = useMemo(() => {
    const byId = new Map();

    const registerClinic = (source = {}) => {
      const clinicId = extractClinicId(source);
      if (!clinicId) return;
      const clinicLabel = extractClinicLabel(source);
      const next = {
        id: clinicId,
        label: formatClinicOptionLabel(clinicLabel, clinicId),
        hasNamedLabel: hasNamedClinicLabel(clinicLabel, clinicId),
      };
      const existing = byId.get(clinicId);
      if (!existing || (!existing.hasNamedLabel && next.hasNamedLabel)) {
        byId.set(clinicId, next);
      }
    };

    if (viewerClinicId) {
      registerClinic({ clinic_id: viewerClinicId, clinic_name: viewerClinicLabel });
    }
    rawDoctors.forEach(registerClinic);
    appointments.forEach(registerClinic);
    apiRows.forEach(registerClinic);

    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [apiRows, appointments, rawDoctors, viewerClinicId, viewerClinicLabel]);

  const clinicLabelsById = useMemo(() => {
    const map = new Map();
    clinicDirectory.forEach((c) => map.set(c.id, c.label));
    return map;
  }, [clinicDirectory]);

  const doctorClinicLookup = useMemo(() => {
    const map = new Map();
    [...apiRows, ...appointments].forEach((source) => {
      const email = extractDoctorEmail(source);
      const clinicId = extractClinicId(source);
      if (!email || !clinicId || map.has(email)) return;
      map.set(email, {
        clinicId,
        clinicLabel:
          clinicLabelsById.get(clinicId) ||
          formatClinicOptionLabel(extractClinicLabel(source), clinicId),
      });
    });
    return map;
  }, [apiRows, appointments, clinicLabelsById]);

  const normalizedDoctorSeed = useMemo(
    () =>
      rawDoctors.map((doctor) => {
        const email = extractDoctorEmail(doctor);
        const inferred = doctorClinicLookup.get(email);
        const clinicId =
          extractClinicId(doctor) ||
          inferred?.clinicId ||
          (email === providerEmail ? viewerClinicId : "");
        const clinicName =
          extractClinicLabel(doctor) ||
          clinicLabelsById.get(clinicId) ||
          inferred?.clinicLabel ||
          (email === providerEmail ? viewerClinicLabel : "");
        return { ...doctor, clinic_id: clinicId, clinic_name: clinicName };
      }),
    [clinicLabelsById, doctorClinicLookup, providerEmail, rawDoctors, viewerClinicId, viewerClinicLabel]
  );

  const doctorDirectory = useMemo(() => {
    const byKey = new Map();

    const register = (source = {}) => {
      const email = extractDoctorEmail(source);
      const name = extractDoctorName(source);
      const clinicId = extractClinicId(source);
      const clinicLabel =
        clinicLabelsById.get(clinicId) ||
        formatClinicOptionLabel(extractClinicLabel(source), clinicId);
      const doctorId = extractDoctorId(source);

      if (!email && !name && !clinicId) return;

      const key = email || `${clinicId}:${name || doctorId || "unknown"}`;
      const existing = byKey.get(key);
      byKey.set(key, {
        doctorEmail: email || existing?.doctorEmail || "",
        doctorName: name || existing?.doctorName || email || "Unknown doctor",
        doctorId: doctorId || existing?.doctorId || "",
        clinicId: clinicId || existing?.clinicId || "",
        clinicLabel: clinicLabel || existing?.clinicLabel || "Unknown clinic",
      });
    };

    normalizedDoctorSeed.forEach(register);
    appointments.forEach(register);
    apiRows.forEach(register);

    if (providerEmail) {
      register({
        doctor_email: providerEmail,
        doctor_name: me.doctor_name || me.name || me.fullName,
        doctor_id: me.doctor_id || me.id || me.oid,
        clinic_id: viewerClinicId,
        clinic_name: viewerClinicLabel,
      });
    }

    return Array.from(byKey.values()).sort((a, b) =>
      a.doctorName.localeCompare(b.doctorName)
    );
  }, [
    apiRows,
    appointments,
    clinicLabelsById,
    me.doctor_id,
    me.doctor_name,
    me.fullName,
    me.id,
    me.name,
    me.oid,
    normalizedDoctorSeed,
    providerEmail,
    viewerClinicId,
    viewerClinicLabel,
  ]);

  return { clinicDirectory, clinicLabelsById, doctorClinicLookup, doctorDirectory };
};

/**
 * Fetches VBC summary from the API with abort controller cleanup.
 */
const useVbcSummaryData = ({ activeClinicId, activeDoctorEmails, todayKey }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const singleDoctorEmail =
    Array.isArray(activeDoctorEmails) && activeDoctorEmails.length === 1
      ? activeDoctorEmails[0]
      : "";

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoadingSummary(true);
      setSummaryError("");
      try {
        const data = await fetchVbcSummary(
          { date: todayKey, clinicId: activeClinicId, doctorEmail: singleDoctorEmail },
          { signal: controller.signal }
        );
        setSummaryData(data);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setSummaryError("");
          setSummaryData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSummary(false);
          setLastUpdatedAt(new Date());
        }
      }
    };

    load();
    return () => controller.abort();
  }, [activeClinicId, singleDoctorEmail, todayKey]);

  return { summaryData, isLoadingSummary, summaryError, lastUpdatedAt };
};

// ─── Main component ───────────────────────────────────────────────────────────

const VBCSummary = () => {
  const dispatch = useDispatch();
  const me = useSelector((state) => state.me.me || {});
  const appointments = useSelector((state) => state.appointments.appointments || []);
  const rawDoctors = useSelector((state) => state.doctors?.doctors || []);
  const sessionScope = useMemo(() => getSessionAuthScope(), []);

  const providerEmail = normalizeEmail(
    me.email || me.doctor_email || sessionScope.doctorEmail || ""
  );
  const viewerClinicId = extractClinicId(me) || sessionScope.clinicId;
  const viewerClinicLabel =
    extractClinicLabel(me) || sessionScope.clinicName || viewerClinicId || "N/A";
  const accessLevel = useMemo(
    () => getVbcAccessLevel({ ...sessionScope.claims, ...sessionScope, ...me }),
    [me, sessionScope]
  );
  const hasClinicLevelAccess = accessLevel === "clinic";
  const todayKey = new Date().toLocaleDateString("en-CA");
  const [selectedDoctorEmails, setSelectedDoctorEmails] = useState([]);
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const effectiveDoctorEmails = useMemo(() => {
    if (selectedDoctorEmails.length > 0) {
      return selectedDoctorEmails;
    }
    return providerEmail ? [providerEmail] : [];
  }, [providerEmail, selectedDoctorEmails]);

  // ── Fetch doctors once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (rawDoctors.length === 0) dispatch(fetchDoctors());
  }, [dispatch, rawDoctors.length]);

  // ── VBC summary data (fetched early with viewerClinicId as seed) ───────────
  const { summaryData, isLoadingSummary, summaryError, lastUpdatedAt } = useVbcSummaryData({
    activeClinicId: viewerClinicId,
    activeDoctorEmails: effectiveDoctorEmails,
    todayKey,
  });

  // ── API summary rows ────────────────────────────────────────────────────────
  const apiRows = useMemo(
    () =>
      (Array.isArray(summaryData?.appointments)
        ? summaryData.appointments
        : []
      ).filter((row) => !isCancelledStatus(row.status)),
    [summaryData]
  );

  // ── Clinic / doctor directory ───────────────────────────────────────────────
  const { clinicDirectory, clinicLabelsById, doctorClinicLookup, doctorDirectory } =
    useClinicDoctorScope({
      apiRows,
      appointments,
      rawDoctors,
      viewerClinicId,
      viewerClinicLabel,
      providerEmail,
      me,
    });

  // ── Resolved active clinic ──────────────────────────────────────────────────
  const clinicOptions = useMemo(
    () => clinicDirectory.map((c) => ({ id: c.id, label: c.label })),
    [clinicDirectory]
  );
  const lockedClinicOption = useMemo(
    () =>
      clinicOptions.find((c) => c.id === viewerClinicId) ||
      (clinicOptions.length === 1 ? clinicOptions[0] : null),
    [clinicOptions, viewerClinicId]
  );
  const activeClinicId = lockedClinicOption?.id || viewerClinicId || "";
  const activeClinicLabel =
    lockedClinicOption?.label || formatClinicOptionLabel(viewerClinicLabel, viewerClinicId);
  const activeClinicDisplayName = getClinicDisplayName(activeClinicLabel, activeClinicId);

  // ── Doctor options for active clinic ───────────────────────────────────────
  const doctorOptions = useMemo(() => {
    const byEmail = new Map();

    doctorDirectory.forEach((doctor) => {
      if (!doctor.doctorEmail) return;
      if (activeClinicId && doctor.clinicId !== activeClinicId) return;
      if (!byEmail.has(doctor.doctorEmail)) {
        byEmail.set(doctor.doctorEmail, {
          email: doctor.doctorEmail,
          fullName: doctor.doctorName || doctor.doctorEmail,
          name: doctor.doctorName || doctor.doctorEmail,
          doctorId: doctor.doctorId,
        });
      }
    });

    appointments.forEach((appt) => {
      const clinicId = extractClinicId(appt);
      const email = extractDoctorEmail(appt);
      if (!email) return;
      if (activeClinicId && clinicId !== activeClinicId) return;
      if (!byEmail.has(email)) {
        byEmail.set(email, {
          email,
          fullName: extractDoctorName(appt) || email,
          name: extractDoctorName(appt) || email,
          doctorId: extractDoctorId(appt),
        });
      }
    });

    return Array.from(byEmail.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeClinicId, appointments, doctorDirectory]);

  useEffect(() => {
    if (!hasClinicLevelAccess) {
      if (providerEmail) {
        setSelectedDoctorEmails((current) =>
          current.length === 1 && current[0] === providerEmail ? current : [providerEmail]
        );
      }
      return;
    }

    const validDoctorEmails = new Set(doctorOptions.map((doctor) => doctor.email));
    setSelectedDoctorEmails((current) => {
      const next = current.filter((email) => validDoctorEmails.has(email));
      return next.length === current.length ? current : next;
    });
  }, [doctorOptions, hasClinicLevelAccess, providerEmail]);

  useEffect(() => {
    if (selectedDoctorEmails.length > 0) return;

    const defaultDoctorEmail =
      doctorOptions.find((doctor) => doctor.email === providerEmail)?.email ||
      doctorOptions[0]?.email ||
      "";

    if (defaultDoctorEmail) {
      setSelectedDoctorEmails([defaultDoctorEmail]);
    }
  }, [
    doctorOptions,
    providerEmail,
    selectedDoctorEmails.length,
  ]);

  // ── Stable email sets for dispatch (use refs to avoid infinite loops) ──────
  const allDoctorEmailsRef = useRef([]);
  const clinicDoctorEmailsRef = useRef([]);

  const allDoctorEmailsKey = useMemo(() => {
    const emails = new Set();
    doctorDirectory.forEach((d) => { if (d.doctorEmail) emails.add(d.doctorEmail); });
    appointments.forEach((a) => { const e = extractDoctorEmail(a); if (e) emails.add(e); });
    apiRows.forEach((r) => { const e = extractDoctorEmail(r); if (e) emails.add(e); });
    const arr = Array.from(emails);
    allDoctorEmailsRef.current = arr;
    return arr.slice().sort().join(",");
  }, [apiRows, appointments, doctorDirectory]);

  const clinicDoctorEmailsKey = useMemo(() => {
    const arr = Array.from(new Set(doctorOptions.map((d) => d.email).filter(Boolean)));
    clinicDoctorEmailsRef.current = arr;
    return arr.slice().sort().join(",");
  }, [doctorOptions]);

  // ── Fetch appointments when email scope changes ────────────────────────────
  useEffect(() => {
    const emails = !hasClinicLevelAccess && providerEmail
      ? [providerEmail]
      : activeClinicId
      ? clinicDoctorEmailsRef.current
      : allDoctorEmailsRef.current.length > 0
      ? allDoctorEmailsRef.current
      : providerEmail
      ? [providerEmail]
      : [];

    if (emails.length === 0) return;
    dispatch(fetchAppointmentDetails(emails));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeClinicId,
    clinicDoctorEmailsKey,
    allDoctorEmailsKey,
    dispatch,
    hasClinicLevelAccess,
    providerEmail,
  ]);

  // ── Local rows from Redux appointments ─────────────────────────────────────
  const localRows = useMemo(() => {
    if (!Array.isArray(appointments)) return [];

    return appointments
      .filter((appt) => {
        const dateKey = normalizeAppointmentDate(
          appt.appointment_date || appt.appointmentDate
        );
        return dateKey === todayKey && !isCancelledStatus(appt.status);
      })
      .map((appt) => {
        const date = normalizeAppointmentDate(appt.appointment_date || appt.appointmentDate);
        const email = extractDoctorEmail(appt);
        const inferred = doctorClinicLookup.get(email);
        const clinicId =
          extractClinicId(appt) ||
          inferred?.clinicId ||
          (email === providerEmail ? viewerClinicId : "");
        const clinicLabel =
          clinicLabelsById.get(clinicId) ||
          extractClinicLabel(appt) ||
          inferred?.clinicLabel ||
          (email === providerEmail ? viewerClinicLabel : "");

        return {
          id: String(
            pickFirst(appt.id, appt.appointment_id, appt.appointmentId, appt.callId) ||
              `${email}-${date}-${appt.time || ""}`
          ),
          patientName: appt.full_name || appt.patient_name || "Unknown",
          appointmentDate: date,
          appointmentTime: appt.time || appt.appointmentTime || "",
          type: appt.type || appt.appointment_type || "unknown",
          status: appt.status || "scheduled",
          doctorId: extractDoctorId(appt),
          doctorEmail: email,
          doctorName: extractDoctorName(appt),
          clinicId,
          clinicName: formatClinicOptionLabel(clinicLabel, clinicId),
          totalGapCount: 0,
          addressedGapCount: 0,
          openGapCount: 0,
          gapBadges: [],
          priority: "low",
        };
      });
  }, [
    appointments,
    clinicLabelsById,
    doctorClinicLookup,
    providerEmail,
    todayKey,
    viewerClinicId,
    viewerClinicLabel,
  ]);

  // ── Merge local + API rows ─────────────────────────────────────────────────
  const mergedRows = useMemo(() => {
    const byId = new Map();
    localRows.forEach((row) => byId.set(String(row.id), row));
    apiRows.forEach((row) => {
      const key = String(row.id);
      const existing = byId.get(key);
      byId.set(key, existing ? { ...existing, ...row } : row);
    });
    return Array.from(byId.values());
  }, [apiRows, localRows]);

  // ── Source row selection ───────────────────────────────────────────────────
  const hasClinicScope = Boolean(activeClinicId);
  const apiRowsSupportScopeFiltering = apiRows.some(
    (row) => Boolean(extractClinicId(row) || extractDoctorEmail(row))
  );

  const sourceRows = selectSourceRows({
    mergedRows,
    apiRows,
    localRows,
    hasClinicScope,
    apiRowsSupportScopeFiltering,
  });

  // ── Filter to active clinic ────────────────────────────────────────────────
  // If none of the source rows have a clinicId, skip clinic filtering so the
  // table isn't blank just because the data source doesn't carry clinic info.
  const anyRowHasClinicId = useMemo(
    () => sourceRows.some((row) => Boolean(extractClinicId(row))),
    [sourceRows]
  );

  const clinicScopedRows = useMemo(
    () =>
      sourceRows.filter((row) => {
        if (!activeClinicId || !anyRowHasClinicId) return true;
        const rowClinicId = extractClinicId(row);
        return !rowClinicId || rowClinicId === activeClinicId;
      }),
    [activeClinicId, anyRowHasClinicId, sourceRows]
  );

  const selectedDoctorEmailSet = useMemo(
    () => new Set(effectiveDoctorEmails.map((email) => normalizeEmail(email)).filter(Boolean)),
    [effectiveDoctorEmails]
  );

  const summaryRows = useMemo(
    () =>
      clinicScopedRows.filter((row) => {
        if (selectedDoctorEmailSet.size === 0) return true;
        const rowDoctorEmail = extractDoctorEmail(row);
        return rowDoctorEmail ? selectedDoctorEmailSet.has(normalizeEmail(rowDoctorEmail)) : false;
      }),
    [clinicScopedRows, selectedDoctorEmailSet]
  );

  const doctorScopeLabel = useMemo(
    () => getDoctorScopeDisplayName(effectiveDoctorEmails, doctorOptions),
    [doctorOptions, effectiveDoctorEmails]
  );
  const uniquePatientCount = useMemo(
    () =>
      new Set(
        summaryRows
          .map((row) => String(row.patientName || "").trim().toLowerCase())
          .filter(Boolean)
      ).size,
    [summaryRows]
  );
  const scopeAppointmentCount = summaryRows.length;
  const scopePatientCount = uniquePatientCount;

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const patientsNeedingAttention = useMemo(
    () =>
      summaryRows.filter(
        (row) => isHighPriority(row.priority) || toNumber(row.openGapCount) > 0
      ).length,
    [summaryRows]
  );

  const totalTrackedGaps = useMemo(
    () =>
      summaryRows.reduce(
        (total, row) => total + toNumber(row.openGapCount) + toNumber(row.addressedGapCount),
        0
      ),
    [summaryRows]
  );

  const gapClosureRate = useMemo(() => {
    if (totalTrackedGaps === 0) return 0;
    const addressed = summaryRows.reduce(
      (total, row) => total + toNumber(row.addressedGapCount),
      0
    );
    return Math.round((addressed / totalTrackedGaps) * 100);
  }, [summaryRows, totalTrackedGaps]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const fallbackKpis = useMemo(() => {
    const totalAppointments = summaryRows.length;
    const virtualAppointments = summaryRows.filter((row) =>
      ["virtual", "online"].includes(normalizeType(row.type))
    ).length;
    const inPersonAppointments = summaryRows.filter(
      (row) => normalizeType(row.type) === "inperson"
    ).length;
    const openGaps = summaryRows.reduce((t, row) => t + toNumber(row.openGapCount), 0);
    const addressedGaps = summaryRows.reduce((t, row) => t + toNumber(row.addressedGapCount), 0);
    const highRiskPatients = summaryRows.filter((row) => isHighPriority(row.priority)).length;
    return { totalAppointments, openGaps, addressedGaps, highRiskPatients, virtualAppointments, inPersonAppointments };
  }, [summaryRows]);

  const shouldUseComputedKpis =
    hasClinicScope ||
    mergedRows.length > apiRows.length ||
    effectiveDoctorEmails.length > 0;

  const kpis = shouldUseComputedKpis
    ? fallbackKpis
    : {
        ...fallbackKpis,
        // Only merge known KPI keys to avoid unexpected overrides
        ...(summaryData?.kpis
          ? (({ totalAppointments, openGaps, addressedGaps, highRiskPatients, virtualAppointments, inPersonAppointments }) => ({
              ...(totalAppointments !== undefined && { totalAppointments }),
              ...(openGaps !== undefined && { openGaps }),
              ...(addressedGaps !== undefined && { addressedGaps }),
              ...(highRiskPatients !== undefined && { highRiskPatients }),
              ...(virtualAppointments !== undefined && { virtualAppointments }),
              ...(inPersonAppointments !== undefined && { inPersonAppointments }),
            }))(summaryData.kpis)
          : {}),
      };

  const kpiCards = [
    {
      label: "Today's Appointments",
      value: scopeAppointmentCount,
      description: `${scopePatientCount} patients in scope`,
      icon: CalendarDays,
      iconClassName: "bg-blue-50 text-blue-600",
      valueClassName: "text-blue-700",
    },
    {
      label: "Open Care Gaps",
      value: toNumber(kpis.openGaps),
      description:
        toNumber(kpis.openGaps) > 0
          ? `${patientsNeedingAttention} patients need review`
          : "No open gaps in scope",
      icon: AlertTriangle,
      iconClassName: "bg-red-50 text-red-600",
      valueClassName: "text-red-700",
    },
    {
      label: "Addressed Gaps",
      value: toNumber(kpis.addressedGaps),
      description:
        totalTrackedGaps > 0
          ? `${gapClosureRate}% closure rate`
          : "No addressed gaps yet",
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-600",
      valueClassName: "text-emerald-700",
    },
    {
      label: "High-Priority Patients",
      value: toNumber(kpis.highRiskPatients),
      description:
        toNumber(kpis.highRiskPatients) > 0
          ? "Escalate before today's visits"
          : "No high-priority patients",
      icon: ShieldAlert,
      iconClassName: "bg-amber-50 text-amber-600",
      valueClassName: "text-amber-700",
    },
    {
      label: "Virtual Visits",
      value: toNumber(kpis.virtualAppointments),
      description: "Telehealth visits today",
      icon: Activity,
      iconClassName: "bg-cyan-50 text-cyan-600",
      valueClassName: "text-cyan-700",
    },
    {
      label: "In-Person Visits",
      value: toNumber(kpis.inPersonAppointments),
      description: "In-office visits today",
      icon: Stethoscope,
      iconClassName: "bg-indigo-50 text-indigo-600",
      valueClassName: "text-indigo-700",
    },
  ];

  const weekEndKey = useMemo(() => addDaysToDateKey(todayKey, 7), [todayKey]);
  const taskOverrides = useMemo(() => getVbcTaskOverrides(), []);

  const workflowRows = useMemo(
    () =>
      summaryRows
        .map((row) => {
          const baseWorkflowTask = buildWorkflowTask(row, {
            referenceDate: row.appointmentDate || todayKey,
          });
          const taskKey = getWorkflowTaskKey(row, baseWorkflowTask);
          const workflowTask = applyWorkflowTaskOverride(
            baseWorkflowTask,
            taskOverrides[taskKey]
          );
          const worklistStatus = String(workflowTask.status || "READY").toUpperCase();
          const worklistOwner = normalizeToken(workflowTask.owner);
          return {
            ...row,
            taskKey,
            workflowTask,
            worklistStatus,
            worklistOwner,
            worklistGapState: getWorklistGapState(row),
            worklistDueBucket: getWorklistDueBucket(workflowTask.dueDate, {
              todayKey,
              weekEndKey,
            }),
          };
        })
        .sort(compareWorkflowRows),
    [summaryRows, taskOverrides, todayKey, weekEndKey]
  );

  const [worklistGapFilter, setWorklistGapFilter] = useState("ALL");
  const [worklistStatusFilter, setWorklistStatusFilter] = useState("ALL");
  const [worklistOwnerFilter, setWorklistOwnerFilter] = useState("ALL");
  const [worklistDueFilter, setWorklistDueFilter] = useState("ALL");
  const [worklistSearch, setWorklistSearch] = useState("");
  const normalizedWorklistSearch = useMemo(
    () => normalizeToken(worklistSearch),
    [worklistSearch]
  );

  const worklistOwnerOptions = useMemo(
    () =>
      Array.from(new Set(workflowRows.map((row) => row.worklistOwner).filter(Boolean))).sort((a, b) =>
        formatWorkflowOwner(a).localeCompare(formatWorkflowOwner(b))
      ),
    [workflowRows]
  );

  const worklistCounts = useMemo(
    () =>
      workflowRows.reduce(
        (totals, row) => {
          if (row.worklistGapState === "OPEN") totals.open += 1;
          if (row.worklistGapState === "CLOSED") totals.closed += 1;
          if (row.worklistStatus === "URGENT") totals.urgent += 1;
          if (row.worklistStatus === "FOLLOW_UP") totals.followUp += 1;
          if (row.worklistDueBucket === "TODAY") totals.dueToday += 1;
          if (row.worklistDueBucket === "OVERDUE") totals.overdue += 1;
          return totals;
        },
        { open: 0, closed: 0, urgent: 0, followUp: 0, dueToday: 0, overdue: 0 }
      ),
    [workflowRows]
  );

  const filteredWorklistRows = useMemo(
    () =>
      workflowRows.filter((row) => {
        if (worklistGapFilter !== "ALL" && row.worklistGapState !== worklistGapFilter) {
          return false;
        }
        if (worklistStatusFilter !== "ALL" && row.worklistStatus !== worklistStatusFilter) {
          return false;
        }
        if (worklistOwnerFilter !== "ALL" && row.worklistOwner !== worklistOwnerFilter) {
          return false;
        }
        if (worklistDueFilter !== "ALL" && row.worklistDueBucket !== worklistDueFilter) {
          return false;
        }
        if (
          normalizedWorklistSearch &&
          !buildWorklistSearchText(row).includes(normalizedWorklistSearch)
        ) {
          return false;
        }
        return true;
      }),
    [
      normalizedWorklistSearch,
      workflowRows,
      worklistDueFilter,
      worklistGapFilter,
      worklistOwnerFilter,
      worklistStatusFilter,
    ]
  );

  const hasActiveWorklistFilters = Boolean(
    worklistSearch.trim() ||
      worklistGapFilter !== "ALL" ||
      worklistStatusFilter !== "ALL" ||
      worklistOwnerFilter !== "ALL" ||
      worklistDueFilter !== "ALL"
  );
  const activeWorklistFilterCount = [
    Boolean(worklistSearch.trim()),
    worklistGapFilter !== "ALL",
    worklistStatusFilter !== "ALL",
    worklistOwnerFilter !== "ALL",
    worklistDueFilter !== "ALL",
  ].filter(Boolean).length;

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredWorklistRows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredWorklistRows.length / SUMMARY_PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(
    () =>
      filteredWorklistRows.slice(
        (activePage - 1) * SUMMARY_PAGE_SIZE,
        activePage * SUMMARY_PAGE_SIZE
      ),
    [filteredWorklistRows, activePage]
  );

  const rowStartIndex =
    filteredWorklistRows.length === 0 ? 0 : (activePage - 1) * SUMMARY_PAGE_SIZE + 1;
  const rowEndIndex = Math.min(activePage * SUMMARY_PAGE_SIZE, filteredWorklistRows.length);

  // ── Details link ───────────────────────────────────────────────────────────
  const detailsHref = useMemo(() => {
    const query = new URLSearchParams();
    query.set("date", todayKey);
    if (activeClinicId) query.set("clinicId", activeClinicId);
    return `/vbc/details?${query.toString()}`;
  }, [activeClinicId, todayKey]);

  const getRowDetailsHref = useCallback(
    (row = {}) => {
      const query = new URLSearchParams();
      query.set("date", row.appointmentDate || todayKey);

      const clinicId = String(row.clinicId || activeClinicId || "").trim();
      if (clinicId) query.set("clinicId", clinicId);

      const appointmentId = String(row.id || "").trim();
      if (appointmentId) query.set("appointmentId", appointmentId);

      const patientName = String(row.patientName || "").trim();
      if (patientName) {
        query.set("patientName", patientName);
      }

      const doctorId = String(row.doctorId || "").trim();
      if (doctorId) query.set("doctorId", doctorId);

      const doctorEmail = normalizeEmail(row.doctorEmail || "");
      if (doctorEmail) query.set("doctorEmail", doctorEmail);

      return `/vbc/details?${query.toString()}`;
    },
    [activeClinicId, todayKey]
  );

  const resetWorklistFilters = () => {
    setWorklistSearch("");
    setWorklistGapFilter("ALL");
    setWorklistStatusFilter("ALL");
    setWorklistOwnerFilter("ALL");
    setWorklistDueFilter("ALL");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // Show a loading screen on initial load (no cached data yet)
  if (isLoadingSummary && !summaryData && summaryRows.length === 0) {
    return (
      <div className="px-4 pb-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <PageNavigation
            title="VBC Summary"
            subtitle="Seismic-native value-based care overview"
            showBackButton={true}
          />
          <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm" style={{ minHeight: "60vh" }}>
            <div className="text-center">
              <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-gray-600">Loading VBC Summary...</p>
              <p className="mt-1 text-xs text-gray-400">Fetching appointments and care gap data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <div className="mx-auto max-w-6xl space-y-6">
          <PageNavigation
            title="VBC Summary"
            subtitle="Daily value-based care overview"
            showBackButton={true}
            rightSlot={
              <div className="flex items-center gap-2">
                <Link
                  href="/vbc/work-queue"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  My Work Queue
                </Link>
                <Link
                  href={detailsHref}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  View Details
                </Link>
              </div>
            }
          />

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 shadow-sm">
          <div className="grid gap-px bg-slate-200 md:grid-cols-2 xl:grid-cols-4">
            <article className="flex items-start gap-3 bg-white px-4 py-4">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clinic</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {activeClinicDisplayName}
                </p>
                <p className="mt-1 text-xs text-slate-500">Current VBC summary scope</p>
              </div>
            </article>

            <article className="flex items-start gap-3 bg-white px-4 py-4">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor Scope</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {doctorScopeLabel}
                </p>
                <p className="mt-1 text-xs text-slate-500">Selected providers in view</p>
              </div>
            </article>

            <article className="flex items-start gap-3 bg-white px-4 py-4">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {scopeAppointmentCount} visits · {scopePatientCount} patients
                </p>
                <p className="mt-1 text-xs text-slate-500">{todayKey}</p>
              </div>
            </article>

            <article className="flex items-start gap-3 bg-white px-4 py-4">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                <Clock3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Refresh Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingSummary
                    ? "Refreshing data..."
                    : lastUpdatedAt
                    ? `Updated ${format(lastUpdatedAt, "h:mm a")}`
                    : "Waiting for refresh"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Middleware-backed summary state</p>
              </div>
            </article>
          </div>
        </section>

        {summaryError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {summaryError}
          </div>
        )}

        {hasClinicLevelAccess && (
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Doctor filter</p>
                <p className="text-sm text-gray-500">
                  Showing appointments for {activeClinicDisplayName}.
                </p>
              </div>
              <div className="w-full max-w-md">
                <DoctorMultiSelect
                  className="w-full"
                  selectedDoctors={selectedDoctorEmails}
                  onDoctorSelect={(emails) =>
                    setSelectedDoctorEmails(emails.map(normalizeEmail))
                  }
                  isDropdownOpen={isDoctorDropdownOpen}
                  setDropdownOpen={setIsDoctorDropdownOpen}
                  doctorOptionsOverride={doctorOptions}
                  disableAutoPreselect={true}
                  emptySelectionLabel="Select doctors"
                />
              </div>
            </div>
          </section>
        )}

        {/* KPI grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className="group flex h-full min-h-[140px] flex-col rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {card.label}
                    </p>
                    <p className={`mt-2 text-2xl font-semibold ${card.valueClassName}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`rounded-xl p-2.5 shadow-sm ${card.iconClassName}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-auto min-h-[2.5rem] pt-3 text-xs leading-5 text-slate-500">
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>

        {/* Visit worklist table */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Visit Worklist</h2>
              <p className="text-sm text-gray-500">
                Actionable VBC view for {activeClinicDisplayName} with {doctorScopeLabel.toLowerCase()} scope.
              </p>
              <p className="text-sm text-gray-500">
                {filteredWorklistRows.length} visits match the current worklist filters
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveWorklistFilters && (
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {activeWorklistFilterCount} active filter{activeWorklistFilterCount === 1 ? "" : "s"}
                </span>
              )}
              {isLoadingSummary && (
                <span className="text-xs font-medium text-gray-500">Refreshing...</span>
              )}
            </div>
          </header>

          <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    {worklistCounts.urgent} urgent
                  </span>
                  <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    {worklistCounts.open} open gap visits
                  </span>
                  <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {worklistCounts.followUp} follow-up
                  </span>
                  <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                    {worklistCounts.overdue} overdue
                  </span>
                  <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                    {worklistCounts.dueToday} due today
                  </span>
                </div>

                <label className="block max-w-xl text-xs font-medium text-gray-600">
                  Search visits
                  <div className="relative mt-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={worklistSearch}
                      onChange={(event) => setWorklistSearch(event.target.value)}
                      placeholder="Patient, provider, gap, or action"
                      className="block w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <label className="text-xs font-medium text-gray-600">
                  Gap state
                  <select
                    value={worklistGapFilter}
                    onChange={(event) => setWorklistGapFilter(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="ALL">All visits</option>
                    <option value="OPEN">Open gaps</option>
                    <option value="CLOSED">Closed only</option>
                    <option value="NO_GAPS">No tracked gaps</option>
                  </select>
                </label>

                <label className="text-xs font-medium text-gray-600">
                  Workflow status
                  <select
                    value={worklistStatusFilter}
                    onChange={(event) => setWorklistStatusFilter(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="URGENT">Urgent</option>
                    <option value="OPEN">Open</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="READY">Ready</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DEFERRED">Deferred</option>
                  </select>
                </label>

                <label className="text-xs font-medium text-gray-600">
                  Owner
                  <select
                    value={worklistOwnerFilter}
                    onChange={(event) => setWorklistOwnerFilter(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="ALL">All owners</option>
                    {worklistOwnerOptions.map((owner) => (
                      <option key={owner} value={owner}>
                        {formatWorkflowOwner(owner)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-gray-600">
                  Due date
                  <select
                    value={worklistDueFilter}
                    onChange={(event) => setWorklistDueFilter(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="ALL">All due dates</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="TODAY">Due today</option>
                    <option value="THIS_WEEK">Due this week</option>
                    <option value="LATER">Due later</option>
                    <option value="UNSCHEDULED">No due date</option>
                  </select>
                </label>
              </div>
            </div>

            {hasActiveWorklistFilters && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={resetWorklistFilters}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset filters
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Patient", "Visit", "Provider", "Priority", "Care Gaps", "Next Best Action", "Details"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      {workflowRows.length === 0
                        ? "No appointments found for today in the selected clinic and doctor scope."
                        : hasActiveWorklistFilters
                        ? "No patients match the current search or worklist filters."
                        : "No patients match the current worklist filters."}
                    </td>
                  </tr>
                )}
                {paginatedRows.map((row) => (
                  <tr key={row.id} className="align-top transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div>{row.patientName}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {getClinicDisplayName(row.clinicName, row.clinicId) ||
                          activeClinicDisplayName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">
                        {row.appointmentTime || "No time"}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {formatReadableLabel(row.type)}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {formatReadableLabel(row.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{extractDoctorName(row) || extractDoctorEmail(row) || "-"}</div>
                      {(row.doctorEmail || row.doctorId) && (
                        <div className="mt-1 text-xs text-gray-500">
                          {row.doctorEmail || row.doctorId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm align-top">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityBadgeClassName(
                          row.priority
                        )}`}
                      >
                        {formatReadableLabel(row.priority, "Low")}
                      </span>
                      <div className="mt-2 text-xs text-gray-500">
                        {isHighPriority(row.priority)
                          ? "Escalate before visit"
                          : toNumber(row.openGapCount) > 0
                          ? "Review chart before visit"
                          : "Routine review"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm align-top">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(row.gapBadges) ? row.gapBadges : [])
                          .slice(0, MAX_GAP_BADGES_SHOWN)
                          .map((badge) => (
                            <span
                              key={`${row.id}-${badge}`}
                              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                            >
                              {badge}
                            </span>
                          ))}
                        {(!Array.isArray(row.gapBadges) || row.gapBadges.length === 0) && (
                          <span className="text-xs text-gray-400">No named gaps</span>
                        )}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        Open {toNumber(row.openGapCount)} | Addressed{" "}
                        {toNumber(row.addressedGapCount)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm align-top">
                      {(() => {
                        const workflowTask = row.workflowTask || buildWorkflowTask(row, {
                          referenceDate: row.appointmentDate || todayKey,
                        });
                        return (
                          <>
                      <div
                        className={`inline-flex max-w-xs items-start gap-2 rounded-xl border px-3 py-2 text-sm ${getActionToneClassName(
                          row
                        )}`}
                      >
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{workflowTask.action || getNextBestAction(row)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getWorkflowBadgeClassName(
                            workflowTask.status
                          )}`}
                        >
                          {workflowTask.status}
                        </span>
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {formatWorkflowOwner(workflowTask.owner)}
                        </span>
                        <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          Due {workflowTask.dueDate || "TBD"}
                        </span>
                      </div>
                      {workflowTask.reason && (
                        <div className="mt-1 text-[11px] text-gray-500">{workflowTask.reason}</div>
                      )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm align-top">
                      <Link
                        href={getRowDetailsHref(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View Details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWorklistRows.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">
                Showing {rowStartIndex}–{rowEndIndex} of {filteredWorklistRows.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={activePage <= 1}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {activePage}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={activePage >= totalPages}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default VBCSummary;
