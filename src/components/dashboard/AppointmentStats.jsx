import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import { fetchAppointmentDetails } from "../../redux/appointment-actions";
import { fetchVbcSummary } from "../../api/vbcSummary";

const normalizeToken = (value = "") =>
  String(value).toLowerCase().trim().replace(/[\s_-]/g, "");

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const toPriorityTier = (value = "") => {
  const normalized = normalizeToken(value);
  if (
    normalized.includes("high") ||
    normalized.includes("critical") ||
    normalized.includes("urgent")
  ) {
    return "high";
  }
  if (normalized.includes("medium") || normalized.includes("moderate")) {
    return "medium";
  }
  if (normalized.includes("low")) {
    return "low";
  }
  return "low";
};

const isCancelledStatus = (status = "") => {
  const normalized = normalizeToken(status);
  return normalized === "cancelled" || normalized === "canceled";
};

const isInPersonType = (type = "") => {
  const normalized = normalizeToken(type);
  return normalized === "inperson" || normalized === "office";
};

const isVirtualType = (type = "") => {
  const normalized = normalizeToken(type);
  return (
    normalized === "virtual" ||
    normalized === "online" ||
    normalized === "telehealth" ||
    normalized === "video"
  );
};

const toRiskTierCounts = (appointments = [], highRiskPatients = 0) => {
  const counts = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const appointment of appointments) {
    const tier = toPriorityTier(
      appointment?.priority ??
        appointment?.priorityLevel ??
        appointment?.riskLevel ??
        appointment?.risk_level
    );
    if (tier === "high") counts.high += 1;
    else if (tier === "medium") counts.medium += 1;
    else counts.low += 1;
  }

  counts.high = Math.max(counts.high, toNumber(highRiskPatients, 0));
  return counts;
};

const resolveRiskTierCounts = (summary = {}) => {
  const kpis = summary?.kpis && typeof summary.kpis === "object" ? summary.kpis : {};
  const riskTierBreakdown =
    (kpis?.riskTier && typeof kpis.riskTier === "object" ? kpis.riskTier : null) ||
    (kpis?.risk_tier && typeof kpis.risk_tier === "object" ? kpis.risk_tier : null) ||
    {};

  const highCount =
    riskTierBreakdown.high ??
    riskTierBreakdown.highCount ??
    riskTierBreakdown.highPatients ??
    riskTierBreakdown.highRiskPatients ??
    riskTierBreakdown.high_risk_patients ??
    kpis.highRiskPatients ??
    kpis.high_risk_patients;
  const mediumCount =
    riskTierBreakdown.medium ??
    riskTierBreakdown.mediumCount ??
    riskTierBreakdown.mediumPatients ??
    riskTierBreakdown.mediumRiskPatients ??
    riskTierBreakdown.medium_risk_patients ??
    riskTierBreakdown.moderate ??
    riskTierBreakdown.moderateCount ??
    riskTierBreakdown.moderatePatients ??
    kpis.mediumRiskPatients ??
    kpis.medium_risk_patients ??
    kpis.moderateRiskPatients ??
    kpis.moderate_risk_patients;
  const lowCount =
    riskTierBreakdown.low ??
    riskTierBreakdown.lowCount ??
    riskTierBreakdown.lowPatients ??
    riskTierBreakdown.lowRiskPatients ??
    riskTierBreakdown.low_risk_patients ??
    kpis.lowRiskPatients ??
    kpis.low_risk_patients;

  if ([highCount, mediumCount, lowCount].some(hasValue)) {
    return {
      high: toNumber(highCount),
      medium: toNumber(mediumCount),
      low: toNumber(lowCount),
    };
  }

  return toRiskTierCounts(summary?.appointments, kpis.highRiskPatients);
};

const buildRiskTierDonut = (riskTier) => {
  const high = toNumber(riskTier?.high);
  const medium = toNumber(riskTier?.medium);
  const low = toNumber(riskTier?.low);
  const total = high + medium + low;

  if (total <= 0) {
    return {
      total: 0,
      background: "#e2e8f0",
    };
  }

  const highPercent = (high / total) * 100;
  const mediumPercent = (medium / total) * 100;
  const highStop = highPercent;
  const mediumStop = highPercent + mediumPercent;

  return {
    total,
    background: `conic-gradient(#e11d48 0% ${highStop.toFixed(
      2
    )}%, #f59e0b ${highStop.toFixed(2)}% ${mediumStop.toFixed(
      2
    )}%, #16a34a ${mediumStop.toFixed(2)}% 100%)`,
  };
};

const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

const AppointmentStats = ({ date: propDate }) => {
  const loggedInDoctor = useSelector((state) => state.me.me);
  const appointments = useSelector((state) => state.appointments.appointments);
  const dispatch = useDispatch();

  const [stats, setStats] = useState({
    totalAppointments: 0,
    inPersonAppointments: 0,
    virtualAppointments: 0,
  });
  const [vbcMetric, setVbcMetric] = useState({
    highRiskPatients: 0,
    riskTier: {
      high: 0,
      medium: 0,
      low: 0,
    },
    lastUpdatedAt: null,
    isLoading: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const doctorEmail = loggedInDoctor?.email || loggedInDoctor?.doctor_email || null;
  const doctorUniqueId =
    loggedInDoctor?.doctor_id || loggedInDoctor?.id || loggedInDoctor?.oid || null;
  const clinicId =
    loggedInDoctor?.clinic_id ||
    loggedInDoctor?.clinicId ||
    loggedInDoctor?.practice_id ||
    loggedInDoctor?.practiceId ||
    null;
  const clinicName = loggedInDoctor?.clinicName || loggedInDoctor?.clinic_name || "";

  const localTodayKey = new Date().toLocaleDateString("en-CA");
  const utcTodayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (doctorEmail) {
      dispatch(fetchAppointmentDetails(doctorEmail, clinicName));
    }
  }, [dispatch, doctorEmail, clinicName]);

  const todayKey =
    typeof propDate === "string"
      ? propDate === utcTodayKey && localTodayKey !== utcTodayKey
        ? localTodayKey
        : propDate
      : propDate instanceof Date
      ? format(propDate, "yyyy-MM-dd")
      : localTodayKey;

  useEffect(() => {
    const controller = new AbortController();

    const loadVbcMetric = async () => {
      setVbcMetric((current) => ({ ...current, isLoading: true }));

      try {
        const summary = await fetchVbcSummary(
          {
            date: todayKey,
            clinicId,
            doctorEmail,
            doctorId: doctorUniqueId,
          },
          { signal: controller.signal }
        );

        const highRiskPatients = toNumber(summary?.kpis?.highRiskPatients);
        const riskTier = resolveRiskTierCounts(summary);

        setVbcMetric({
          highRiskPatients,
          riskTier,
          lastUpdatedAt: new Date(),
          isLoading: false,
        });
      } catch (error) {
        if (error?.name !== "AbortError") {
          // eslint-disable-next-line no-console
          console.warn("VBC summary fetch failed:", error?.status, error?.url, error);
          setVbcMetric({
            highRiskPatients: 0,
            riskTier: {
              high: 0,
              medium: 0,
              low: 0,
            },
            lastUpdatedAt: new Date(),
            isLoading: false,
          });
        }
      }
    };

    loadVbcMetric();
    return () => controller.abort();
  }, [todayKey, clinicId, doctorEmail, doctorUniqueId]);

  let formattedDate = "";
  {
    const [year, month, day] = todayKey.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    formattedDate = format(localDate, "MMMM d, yyyy");
  }

  useEffect(() => {
    setIsLoading(true);

    if (!Array.isArray(appointments) || (!doctorEmail && !doctorUniqueId)) {
      setStats({
        totalAppointments: 0,
        inPersonAppointments: 0,
        virtualAppointments: 0,
      });
      setIsLoading(false);
      return;
    }

    const normalizedDoctorId = String(doctorUniqueId ?? "").trim();
    const normalizedDoctorEmail = String(doctorEmail ?? "").trim().toLowerCase();
    const normalizedClinicName = normalizeText(clinicName);

    const todayAppointments = appointments.filter((app) => {
      let appDateKey = app.appointment_date ?? app.appointmentDate ?? app.date ?? "";

      if (typeof appDateKey === "string") {
        appDateKey = appDateKey.slice(0, 10);
      } else if (appDateKey instanceof Date) {
        appDateKey = format(appDateKey, "yyyy-MM-dd");
      } else {
        appDateKey = "";
      }

      const appDoctorIdValues = [app.doctorId, app.doctor_id]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);
      const appDoctorEmailValues = [app.doctorEmail, app.doctor_email]
        .map((value) => String(value ?? "").trim().toLowerCase())
        .filter(Boolean);

      const appClinicName = normalizeText(
        app.clinicName ||
          app.clinic_name ||
          app.details?.clinicName ||
          app.details?.clinic_name ||
          app.original_json?.clinicName ||
          app.original_json?.clinic_name ||
          app.original_json?.details?.clinicName ||
          app.original_json?.details?.clinic_name
      );

      const isSameDoctorById =
        normalizedDoctorId && appDoctorIdValues.includes(normalizedDoctorId);
      const isSameDoctorByEmail =
        normalizedDoctorEmail && appDoctorEmailValues.includes(normalizedDoctorEmail);

      const matchesClinic = !normalizedClinicName || appClinicName === normalizedClinicName;

      return (
        appDateKey === todayKey &&
        Boolean(isSameDoctorById || isSameDoctorByEmail) &&
        matchesClinic &&
        !isCancelledStatus(app.status ?? app.appointment_status ?? app.appointmentStatus)
      );
    });

    const inPersonAppointments = todayAppointments.filter((app) =>
      isInPersonType(app.type ?? app.appointment_type ?? app.appointmentType)
    ).length;

    const virtualAppointments = todayAppointments.filter((app) =>
      isVirtualType(app.type ?? app.appointment_type ?? app.appointmentType)
    ).length;

    setStats({
      totalAppointments: todayAppointments.length,
      inPersonAppointments,
      virtualAppointments,
    });
    setIsLoading(false);
  }, [appointments, todayKey, doctorEmail, doctorUniqueId, clinicName]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[260px] animate-pulse">
        <div className="h-6 w-1/3 bg-neutral-200 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="h-16 bg-neutral-200 rounded"></div>
          <div className="h-16 bg-neutral-200 rounded"></div>
          <div className="h-16 bg-neutral-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-24 bg-neutral-200 rounded"></div>
          <div className="h-14 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { totalAppointments, inPersonAppointments, virtualAppointments } = stats;
  const refreshTimeLabel = vbcMetric.lastUpdatedAt
    ? vbcMetric.lastUpdatedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";
  const { total: totalRiskPatients, background: riskTierDonutBackground } =
    buildRiskTierDonut(vbcMetric.riskTier);

  const buildMetricHref = (metricKey) =>
    `/vbc/details?date=${encodeURIComponent(todayKey)}&metric=${encodeURIComponent(
      metricKey
    )}`;
  const viewDashboardHref = `/vbc?date=${encodeURIComponent(todayKey)}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold text-gray-800">Today's Schedule</div>
          <div className="text-sm text-gray-500">{formattedDate}</div>
        </div>
        <div className="bg-sky-100 p-3 rounded-full">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="8" fill="#3b82f6" opacity="0.15" />
            <path d="M8 7h8M8 11h8M8 15h4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="min-h-[84px] rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
            Total Visits
          </div>
          <div className="mt-1 text-2xl font-bold text-violet-800">{totalAppointments}</div>
        </div>
        <div className="min-h-[84px] rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            In-Person
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">{inPersonAppointments}</div>
        </div>
        <div className="min-h-[84px] rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            Virtual
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-800">{virtualAppointments}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              VBC Dashboard
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-800">
              Patients by Risk Tier
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Last refresh: {refreshTimeLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={buildMetricHref("risk-tier")}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Details
            </Link>
            <Link
              href={viewDashboardHref}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          {vbcMetric.isLoading ? (
            <div className="h-[230px] w-full animate-pulse rounded bg-slate-200" />
          ) : (
            <Link
              href={buildMetricHref("risk-tier")}
              className="block rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative mx-auto h-28 w-28 shrink-0 sm:mx-0">
                  <div
                    className="h-full w-full rounded-full border border-slate-200"
                    style={{ background: riskTierDonutBackground }}
                  />
                  <div className="absolute inset-[20%] flex flex-col items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </span>
                    <span className="text-lg font-bold text-slate-800">{totalRiskPatients}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-rose-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                      High
                    </span>
                    <span className="font-semibold text-rose-800">{vbcMetric.riskTier.high}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-amber-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      Medium
                    </span>
                    <span className="font-semibold text-amber-800">{vbcMetric.riskTier.medium}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-emerald-700">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      Low
                    </span>
                    <span className="font-semibold text-emerald-800">{vbcMetric.riskTier.low}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentStats;
