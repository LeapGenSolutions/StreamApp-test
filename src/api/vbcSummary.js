import { BACKEND_URL, SOS_URL } from "../constants";
import { resolveVbcRequestScope, withAuthHeaders } from "./auth";

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
const apiForBase = (base, path) =>
  `${String(base || "").trim().replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeType = (value = "") =>
  String(value).toLowerCase().replace(/[\s_-]/g, "");

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const pickFirst = (...values) => values.find(hasValue);

const isObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isPatientVbcLike = (value) => {
  if (!isObject(value)) return false;
  return (
    Array.isArray(value.gapsInCare) ||
    Array.isArray(value.gaps_in_care) ||
    Array.isArray(value.nextBestActions) ||
    Array.isArray(value.next_best_actions) ||
    Array.isArray(value.qualityMeasures) ||
    Array.isArray(value.quality_measures) ||
    isObject(value.risk)
  );
};

const extractPatientVbc = (payload) => {
  if (isPatientVbcLike(payload)) return payload;
  if (!isObject(payload)) return null;

  const dataRoot = isObject(payload.data) ? payload.data : payload;
  const candidates = [
    dataRoot.patientVbc,
    dataRoot.patient_vbc,
    dataRoot.vbcPatient,
    dataRoot.vbc_patient,
    dataRoot.vbc,
    payload.patientVbc,
    payload.patient_vbc,
    payload.vbc,
    payload.fabricOutput,
    payload.fabric_output,
    payload.fabricAgentOutput,
    payload.fabric_agent_output,
    dataRoot.fabricOutput,
    dataRoot.fabric_output,
    dataRoot.fabricAgentOutput,
    dataRoot.fabric_agent_output,
  ];

  for (const candidate of candidates) {
    if (isPatientVbcLike(candidate)) return candidate;
  }

  return null;
};

const toTextArray = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry || "").trim()).filter(Boolean);
    }
  }
  return [];
};

const getAppointmentRecord = (item = {}) =>
  isObject(item.appointment)
    ? item.appointment
    : isObject(item.appointmentRecord)
    ? item.appointmentRecord
    : isObject(item.appointment_record)
    ? item.appointment_record
    : item;

const getPatientRecord = (item = {}) =>
  isObject(item.patient)
    ? item.patient
    : isObject(item.patientRecord)
    ? item.patientRecord
    : isObject(item.patient_record)
    ? item.patient_record
    : {};

const getProviderRecord = (item = {}) =>
  isObject(item.provider)
    ? item.provider
    : isObject(item.doctor)
    ? item.doctor
    : isObject(item.providerRecord)
    ? item.providerRecord
    : isObject(item.provider_record)
    ? item.provider_record
    : {};

const getPracticeRecord = (item = {}) =>
  isObject(item.practice)
    ? item.practice
    : isObject(item.clinic)
    ? item.clinic
    : isObject(item.facility)
    ? item.facility
    : isObject(item.practiceRecord)
    ? item.practiceRecord
    : isObject(item.practice_record)
    ? item.practice_record
    : {};

const toText = (value = "") => (hasValue(value) ? String(value).trim() : "");

const getSnapshotRecord = (item = {}) =>
  isObject(item.snapshot)
    ? item.snapshot
    : isObject(item.patientSnapshot)
    ? item.patientSnapshot
    : isObject(item.patient_snapshot)
    ? item.patient_snapshot
    : isObject(item.vbcPatientSnapshot)
    ? item.vbcPatientSnapshot
    : isObject(item.vbc_patient_snapshot)
    ? item.vbc_patient_snapshot
    : isObject(item.vbcSnapshot)
    ? item.vbcSnapshot
    : isObject(item.vbc_snapshot)
    ? item.vbc_snapshot
    : {};

const getGapSummaryRecord = (item = {}) =>
  isObject(item.gapSummary)
    ? item.gapSummary
    : isObject(item.gap_summary)
    ? item.gap_summary
    : isObject(item.gapsSummary)
    ? item.gapsSummary
    : isObject(item.gaps_summary)
    ? item.gaps_summary
    : {};

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
      item.facility?.id,
      getPracticeRecord(item).id,
      getPracticeRecord(item).practice_id,
      getPracticeRecord(item).facility_id,
      getAppointmentRecord(item).practice_id,
      getAppointmentRecord(item).clinic_id,
      getAppointmentRecord(item).facility_id,
      getProviderRecord(item).practice_id,
      getPatientRecord(item).practice_id
    ) || ""
  ).trim();

const extractClinicName = (item = {}) => {
  const practice = getPracticeRecord(item);
  const label = pickFirst(
    item.clinicName,
    item.clinic_name,
    item.practiceName,
    item.practice_name,
    item.facilityName,
    item.facility_name,
    item.clinic?.name,
    item.practice?.name,
    item.facility?.name,
    practice.display_name,
    practice.name
  );

  if (hasValue(label)) {
    return String(label).trim();
  }

  return extractClinicId(item);
};

const extractDoctorEmail = (item = {}) => {
  const provider = getProviderRecord(item);
  const appointment = getAppointmentRecord(item);
  const direct = pickFirst(
    item.doctorEmail,
    item.doctor_email,
    item.providerEmail,
    item.provider_email,
    item.userID,
    item.userId,
    appointment.doctor_email,
    appointment.provider_email,
    provider.doctor_email,
    provider.provider_email,
    provider.email
  );

  if (hasValue(direct)) {
    return normalizeEmail(direct);
  }

  const fallbackId = String(item.id || "").trim();
  return fallbackId.includes("@") ? normalizeEmail(fallbackId) : "";
};

const extractDoctorName = (item = {}) => {
  const provider = getProviderRecord(item);
  const appointment = getAppointmentRecord(item);
  const direct = pickFirst(
    item.doctorName,
    item.doctor_name,
    item.providerName,
    item.provider_name,
    item.fullName,
    item.name,
    appointment.doctor_name,
    appointment.provider_name,
    provider.doctor_name,
    provider.provider_name,
    provider.full_name,
    provider.name
  );

  if (hasValue(direct)) {
    return String(direct).trim();
  }

  return [provider.first_name, provider.last_name, item.firstName, item.lastName]
    .filter(hasValue)
    .join(" ")
    .trim();
};

const extractDoctorId = (item = {}) =>
  String(
    pickFirst(
      item.doctorId,
      item.doctor_id,
      item.providerId,
      item.provider_id,
      getAppointmentRecord(item).doctor_id,
      getAppointmentRecord(item).provider_id,
      getProviderRecord(item).id,
      getProviderRecord(item).provider_id,
      getProviderRecord(item).doctor_id
    ) || ""
  ).trim();

const getChecklistPayload = (dataRoot = {}) => {
  const candidate = pickFirst(
    dataRoot.checklist,
    dataRoot.patientChecklist,
    dataRoot.patient_checklist,
    dataRoot.checklistItems,
    dataRoot.checklist_items
  );

  if (Array.isArray(candidate)) {
    return candidate;
  }

  if (isObject(candidate)) {
    if (Array.isArray(candidate.items)) return candidate.items;
    if (Array.isArray(candidate.checklist)) return candidate.checklist;
  }

  return candidate ?? null;
};

const normalizeDetailsEmbedContract = (dataRoot = {}, visualRoot = {}) => {
  const reportRoot = isObject(dataRoot.report)
    ? dataRoot.report
    : isObject(dataRoot.reportConfig)
    ? dataRoot.reportConfig
    : {};
  const embedRoot = isObject(dataRoot.embed)
    ? dataRoot.embed
    : isObject(dataRoot.embedConfig)
    ? dataRoot.embedConfig
    : {};

  const reportEmbedUrl = toText(
    pickFirst(
      dataRoot.reportEmbedUrl,
      dataRoot.report_embed_url,
      dataRoot.reportUrl,
      dataRoot.report_url,
      reportRoot.embedUrl,
      reportRoot.embed_url,
      reportRoot.url,
      embedRoot.reportEmbedUrl,
      embedRoot.report_embed_url,
      embedRoot.reportUrl,
      embedRoot.report_url
    )
  );
  const visualEmbedUrl = toText(
    pickFirst(
      dataRoot.visualEmbedUrl,
      dataRoot.visual_embed_url,
      dataRoot.visualUrl,
      dataRoot.visual_url,
      dataRoot.riskTierVisualEmbedUrl,
      dataRoot.risk_tier_visual_embed_url,
      visualRoot.embedUrl,
      visualRoot.embed_url,
      visualRoot.url,
      visualRoot.visualEmbedUrl,
      visualRoot.visual_embed_url,
      embedRoot.visualEmbedUrl,
      embedRoot.visual_embed_url
    )
  );
  const embedUrl = toText(
    pickFirst(
      dataRoot.embedUrl,
      dataRoot.embed_url,
      dataRoot.scopedEmbedUrl,
      dataRoot.scoped_embed_url,
      embedRoot.embedUrl,
      embedRoot.embed_url,
      embedRoot.url,
      visualEmbedUrl,
      reportEmbedUrl
    )
  );
  const filter = toText(
    pickFirst(
      dataRoot.filter,
      dataRoot.reportFilter,
      dataRoot.report_filter,
      dataRoot.powerBiFilter,
      dataRoot.power_bi_filter,
      reportRoot.filter,
      reportRoot.reportFilter,
      visualRoot.filter,
      embedRoot.filter
    )
  );

  return {
    embedUrl,
    reportEmbedUrl,
    visualEmbedUrl,
    filter,
    type:
      embedUrl && embedUrl === visualEmbedUrl
        ? "visual"
        : embedUrl && embedUrl === reportEmbedUrl
        ? "report"
        : embedUrl
        ? "scoped"
        : "",
  };
};

const toGapBadgeLabel = (value = "") => {
  const normalized = String(value).toLowerCase().trim();
  if (!normalized) return "";

  if (normalized.includes("blood pressure") || normalized === "bp") return "BP";
  if (
    normalized.includes("medication") ||
    normalized.includes("meds") ||
    normalized === "med"
  ) {
    return "Meds";
  }
  if (normalized.includes("a1c") || normalized.includes("hba1c")) return "A1c";
  if (normalized.includes("ldl") || normalized.includes("lipid")) return "LDL";
  if (normalized.includes("eye")) return "Eye";
  if (normalized.includes("foot")) return "Foot";
  if (normalized.includes("renal") || normalized.includes("kidney")) return "Renal";

  const cleaned = String(value).replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.length > 10 ? `${cleaned.slice(0, 10)}...` : cleaned;
};

const normalizePriority = (rawValue, openGapCount) => {
  const normalized = String(rawValue || "")
    .toLowerCase()
    .trim();

  if (
    normalized.includes("critical") ||
    normalized.includes("urgent") ||
    normalized.includes("high")
  ) {
    return "high";
  }
  if (normalized.includes("medium") || normalized.includes("moderate")) {
    return "medium";
  }
  if (normalized.includes("low")) {
    return "low";
  }

  if (openGapCount >= 3) return "high";
  if (openGapCount > 0) return "medium";
  return "low";
};

const extractGapBadges = (item = {}, gaps = []) => {
  const sources = [];
  const listCandidates = [
    item.gapBadges,
    item.gap_badges,
    item.gapIndicators,
    item.gap_indicators,
    item.gapCodes,
    item.gap_codes,
    item.gapsInCare,
    item.gaps_in_care,
    item.vbc_gap_instances,
    item.gapInstances,
    item.gap_instances,
    gaps,
  ];

  for (const candidate of listCandidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      sources.push(...candidate);
      break;
    }
  }

  const badgeSet = new Set();
  for (const source of sources) {
    if (badgeSet.size >= 4) break;

    let rawLabel = "";
    if (typeof source === "string") {
      rawLabel = source;
    } else if (source && typeof source === "object") {
      rawLabel =
        source.code ??
        source.label ??
        source.name ??
        source.type ??
        source.gap ??
        "";
    }

    const badgeLabel = toGapBadgeLabel(rawLabel);
    if (badgeLabel) {
      badgeSet.add(badgeLabel);
    }
  }

  return Array.from(badgeSet);
};

const normalizeAppointmentSummary = (item = {}, index = 0) => {
  const appointment = getAppointmentRecord(item);
  const patient = getPatientRecord(item);
  const snapshot = getSnapshotRecord(item);
  const gapSummary = getGapSummaryRecord(item);
  const gaps = [
    ...(Array.isArray(item.gaps) ? item.gaps : []),
    ...(Array.isArray(item.gapsInCare) ? item.gapsInCare : []),
    ...(Array.isArray(item.gaps_in_care) ? item.gaps_in_care : []),
    ...(Array.isArray(item.gapInstances) ? item.gapInstances : []),
    ...(Array.isArray(item.gap_instances) ? item.gap_instances : []),
    ...(Array.isArray(item.vbc_gap_instances) ? item.vbc_gap_instances : []),
  ];
  const addressedGaps = toNumber(
    item.addressedGapCount ??
      item.gapsAddressed ??
      item.addressedGaps ??
      item.addressed_gaps ??
      item.closedGapCount ??
      item.closed_gaps ??
      gapSummary.addressedGapCount ??
      gapSummary.addressed ??
      gapSummary.closedGapCount ??
      gapSummary.closed ??
      snapshot.closed_gap_count ??
      snapshot.addressed_gap_count ??
      gaps.filter((gap) => Boolean(gap?.addressed)).length,
    0
  );
  const directOpenGapCount = toNumber(
    item.openGapCount ??
      item.openGaps ??
      item.open_gaps ??
      gapSummary.openGapCount ??
      gapSummary.open ??
      snapshot.open_gap_count ??
      item.gapCountOpen ??
      item.gap_count_open,
    Number.NaN
  );
  const totalGaps = toNumber(
    item.totalGapCount ??
      item.totalGaps ??
      item.gapCount ??
      item.total_gaps ??
      item.gaps_total ??
      gapSummary.totalGapCount ??
      gapSummary.total ??
      snapshot.total_gap_count ??
      (hasValue(snapshot.open_gap_count) || hasValue(snapshot.closed_gap_count)
        ? toNumber(snapshot.open_gap_count) + toNumber(snapshot.closed_gap_count)
        : undefined) ??
      (Number.isFinite(directOpenGapCount) ? directOpenGapCount + addressedGaps : undefined) ??
      gaps.length,
    0
  );
  const openGapCount = Math.max(
    Number.isFinite(directOpenGapCount) ? directOpenGapCount : totalGaps - addressedGaps,
    0
  );
  const priority = normalizePriority(
    item.priority ??
      item.priorityLevel ??
      item.riskLevel ??
      item.risk_level ??
      item.riskTier ??
      item.risk_tier ??
      item.risk?.tier ??
      snapshot.risk_tier ??
      snapshot.riskTier ??
      snapshot.priority,
    openGapCount
  );
  const gapBadges = extractGapBadges(item, gaps);
  const patientName =
    pickFirst(
      item.patientName,
      item.full_name,
      item.patient_name,
      patient.full_name,
      patient.patient_name,
      patient.name,
      [patient.first_name, patient.last_name].filter(hasValue).join(" ").trim()
    ) || "Unknown";
  const riskScore = toNumber(
    item.riskScore ??
      item.risk_score ??
      item.risk?.score ??
      snapshot.risk_score ??
      snapshot.riskScore,
    0
  );
  const riskDrivers = toTextArray(
    item.riskDrivers,
    item.risk_drivers,
    item.risk?.drivers,
    snapshot.riskDrivers,
    snapshot.risk_drivers,
    snapshot.risk_drivers_json
  );

  return {
    id: String(
      pickFirst(
        item.id,
        item.appointmentId,
        item.appointment_id,
        appointment.id,
        appointment.appointment_id,
        appointment.athena_appointment_id,
        index + 1
      )
    ),
    patientName: String(patientName),
    appointmentDate: String(
      pickFirst(
        item.appointmentDate,
        item.appointment_date,
        appointment.appointmentDate,
        appointment.appointment_date,
        appointment.date,
        ""
      )
    ),
    appointmentTime: String(
      pickFirst(
        item.appointmentTime,
        item.time,
        appointment.appointmentTime,
        appointment.appointment_time,
        appointment.time,
        ""
      )
    ),
    type: String(
      pickFirst(
        item.type,
        item.appointmentType,
        item.appointment_type,
        appointment.type,
        appointment.appointment_type,
        "unknown"
      )
    ),
    status: String(pickFirst(item.status, appointment.status, "scheduled")),
    doctorId: extractDoctorId(item),
    doctorEmail: extractDoctorEmail(item),
    doctorName: extractDoctorName(item),
    clinicId: extractClinicId(item),
    clinicName: extractClinicName(item),
    totalGapCount: totalGaps,
    addressedGapCount: addressedGaps,
    openGapCount,
    gapBadges,
    priority,
    riskScore,
    riskDrivers,
    qualityMeasures: Array.isArray(item.qualityMeasures)
      ? item.qualityMeasures
      : Array.isArray(item.quality_measures)
      ? item.quality_measures
      : [],
    gapsInCare: Array.isArray(item.gapsInCare)
      ? item.gapsInCare
      : Array.isArray(item.gaps_in_care)
      ? item.gaps_in_care
      : Array.isArray(item.vbc_gap_instances)
      ? item.vbc_gap_instances
      : [],
    nextBestActions: Array.isArray(item.nextBestActions)
      ? item.nextBestActions
      : Array.isArray(item.next_best_actions)
      ? item.next_best_actions
      : Array.isArray(item.vbc_next_best_actions)
      ? item.vbc_next_best_actions
      : [],
    clinicalRationale: String(
      pickFirst(
        item.clinicalRationale,
        item.clinical_rationale,
        snapshot.clinical_rationale,
        snapshot.clinicalRationale,
        ""
      )
    ),
  };
};

const normalizeSummaryPayload = (payload = {}) => {
  const appointmentSource = Array.isArray(payload)
    ? payload
    : payload?.appointments ?? payload?.patients ?? payload?.rows ?? payload?.data ?? [];
  const appointments = Array.isArray(appointmentSource)
    ? appointmentSource.map(normalizeAppointmentSummary)
    : [];

  const computedTotalAppointments = appointments.length;
  const computedOpenGaps = appointments.reduce(
    (total, row) => total + row.openGapCount,
    0
  );
  const computedAddressedGaps = appointments.reduce(
    (total, row) => total + row.addressedGapCount,
    0
  );
  const computedVirtualAppointments = appointments.filter((row) =>
    ["virtual", "online"].includes(normalizeType(row.type))
  ).length;
  const computedInPersonAppointments = appointments.filter(
    (row) => normalizeType(row.type) === "inperson"
  ).length;
  const computedHighRiskPatients = appointments.filter((row) =>
    normalizePriority(row.priority, row.openGapCount) === "high"
  ).length;
  const computedRiskTier = appointments.reduce(
    (counts, row) => {
      const tier = normalizePriority(row.priority, row.openGapCount);
      if (tier === "high") counts.high += 1;
      else if (tier === "medium") counts.medium += 1;
      else counts.low += 1;
      return counts;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const rawKpis =
    (payload?.kpis && typeof payload.kpis === "object" ? payload.kpis : null) ||
    (payload?.summary && typeof payload.summary === "object" ? payload.summary : null) ||
    (payload && typeof payload === "object" ? payload : {});
  const rawRiskTier =
    (isObject(rawKpis.riskTier) && rawKpis.riskTier) ||
    (isObject(rawKpis.risk_tier) && rawKpis.risk_tier) ||
    (isObject(rawKpis.patientsByRiskTier) && rawKpis.patientsByRiskTier) ||
    (isObject(rawKpis.patients_by_risk_tier) && rawKpis.patients_by_risk_tier) ||
    (isObject(rawKpis.priorityBreakdown) && rawKpis.priorityBreakdown) ||
    (isObject(rawKpis.priority_breakdown) && rawKpis.priority_breakdown) ||
    {};
  const riskTier = {
    high: toNumber(
      pickFirst(
        rawRiskTier.high,
        rawRiskTier.highCount,
        rawRiskTier.highPatients,
        rawRiskTier.highRiskPatients,
        rawRiskTier.high_risk_patients,
        rawKpis.highRiskPatients,
        rawKpis.high_risk_patients
      ),
      computedRiskTier.high
    ),
    medium: toNumber(
      pickFirst(
        rawRiskTier.medium,
        rawRiskTier.mediumCount,
        rawRiskTier.mediumPatients,
        rawRiskTier.mediumRiskPatients,
        rawRiskTier.medium_risk_patients,
        rawRiskTier.moderate,
        rawRiskTier.moderateCount,
        rawRiskTier.moderatePatients,
        rawKpis.mediumRiskPatients,
        rawKpis.medium_risk_patients,
        rawKpis.moderateRiskPatients,
        rawKpis.moderate_risk_patients
      ),
      computedRiskTier.medium
    ),
    low: toNumber(
      pickFirst(
        rawRiskTier.low,
        rawRiskTier.lowCount,
        rawRiskTier.lowPatients,
        rawRiskTier.lowRiskPatients,
        rawRiskTier.low_risk_patients,
        rawKpis.lowRiskPatients,
        rawKpis.low_risk_patients
      ),
      computedRiskTier.low
    ),
  };

  return {
    kpis: {
      totalAppointments: toNumber(
        rawKpis.totalAppointments ?? rawKpis.total_appointments,
        computedTotalAppointments
      ),
      openGaps: toNumber(rawKpis.openGaps ?? rawKpis.open_gaps, computedOpenGaps),
      addressedGaps: toNumber(
        rawKpis.addressedGaps ?? rawKpis.addressed_gaps,
        computedAddressedGaps
      ),
      highRiskPatients: toNumber(
        rawKpis.highRiskPatients ?? rawKpis.high_risk_patients,
        computedHighRiskPatients
      ),
      virtualAppointments: toNumber(
        rawKpis.virtualAppointments ?? rawKpis.virtual_appointments,
        computedVirtualAppointments
      ),
      inPersonAppointments: toNumber(
        rawKpis.inPersonAppointments ?? rawKpis.in_person_appointments,
        computedInPersonAppointments
      ),
      riskTier,
    },
    appointments,
  };
};

export const fetchVbcSummary = async (
  { date, clinicId, doctorEmail, doctorId } = {},
  { signal } = {}
) => {
  const requestScope = resolveVbcRequestScope({
    clinicId,
    doctorEmail,
    doctorId,
  });
  const query = new URLSearchParams();
  if (date) query.set("date", date);
  if (requestScope.clinicId) query.set("clinicId", requestScope.clinicId);
  if (requestScope.doctorEmail) {
    query.set("doctorEmail", normalizeEmail(requestScope.doctorEmail));
  }
  if (requestScope.doctorId) query.set("doctorId", requestScope.doctorId);
  const queryString = query.toString();

  const summaryPaths = [
    `/api/vbc/summary${queryString ? `?${queryString}` : ""}`,
    `/api/vbc-summary${queryString ? `?${queryString}` : ""}`,
    `/api/vbc/dashboard/summary${queryString ? `?${queryString}` : ""}`,
    `/api/vbc-dashboard/summary${queryString ? `?${queryString}` : ""}`,
  ];

  const bases = [BASE];
  const sosBase = String(SOS_URL || "").trim().replace(/\/+$/, "");
  if (sosBase && !bases.some((base) => String(base || "").replace(/\/+$/, "") === sosBase)) {
    bases.push(sosBase);
  }

  const endpoints = bases.flatMap((base) => summaryPaths.map((path) => apiForBase(base, path)));

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        signal,
        headers: withAuthHeaders(),
      });
      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        const text = await response.text().catch(() => "");
        const message =
          contentType.includes("text/html") && text
            ? text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240)
            : text;
        const error = new Error(message || `Failed with status ${response.status}`);
        error.status = response.status;
        error.url = endpoint;
        lastError = error;
        continue;
      }

      const payload = await response.json().catch(() => ({}));
      return normalizeSummaryPayload(payload);
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch VBC summary");
};

export const fetchVbcDetailsConfig = async (
  { appointmentId, date, metric, patientName, clinicId, doctorEmail, doctorId } = {},
  { signal } = {}
) => {
  const requestScope = resolveVbcRequestScope({
    clinicId,
    doctorEmail,
    doctorId,
  });
  const query = new URLSearchParams();
  if (appointmentId) query.set("appointmentId", appointmentId);
  if (date) query.set("date", date);
  if (metric) query.set("metric", metric);
  if (requestScope.clinicId) query.set("clinicId", requestScope.clinicId);
  if (requestScope.doctorEmail) {
    query.set("doctorEmail", normalizeEmail(requestScope.doctorEmail));
  }
  if (requestScope.doctorId) query.set("doctorId", requestScope.doctorId);
  if (patientName) {
    query.set("patientName", patientName);
    query.set("patient", patientName);
  }
  const queryString = query.toString();

  const endpoints = [
    api(`/api/vbc/details${queryString ? `?${queryString}` : ""}`),
    api(`/api/vbc/details-config${queryString ? `?${queryString}` : ""}`),
    api(`/api/vbc/dashboard/details${queryString ? `?${queryString}` : ""}`),
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        signal,
        headers: withAuthHeaders(),
      });

      if (!response.ok) {
        lastError = new Error(`Failed with status ${response.status}`);
        continue;
      }

      const payload = await response.json().catch(() => ({}));
      if (payload && typeof payload === "object") {
        const dataRoot =
          payload.data && typeof payload.data === "object" ? payload.data : payload;
        const visualRoot =
          dataRoot.visual && typeof dataRoot.visual === "object"
            ? dataRoot.visual
            : dataRoot.visualConfig && typeof dataRoot.visualConfig === "object"
            ? dataRoot.visualConfig
            : {};
        const embed = normalizeDetailsEmbedContract(dataRoot, visualRoot);

        return {
          embed,
          embedUrl: embed.embedUrl,
          reportEmbedUrl: embed.reportEmbedUrl,
          visualEmbedUrl: embed.visualEmbedUrl,
          filter: embed.filter,
          patientName:
            dataRoot.patientName ??
            dataRoot.full_name ??
            dataRoot.patient_name ??
            dataRoot.patient?.name ??
            patientName ??
            "",
          checklist: getChecklistPayload(dataRoot),
          patientVbc: extractPatientVbc(payload),
        };
      }
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch VBC details config");
};
