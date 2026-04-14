import { AlertTriangle, CheckCircle2, ClipboardList, ShieldAlert } from "lucide-react";
import {
  buildWorkflowTask,
  getWorkflowBadgeClassName,
} from "../../lib/vbcWorkflow";

const normalizeToken = (value = "") =>
  String(value).toLowerCase().trim().replace(/[\s_-]/g, "");

const riskTierClassName = (tier = "") => {
  const token = normalizeToken(tier);
  if (token === "high") return "border-red-200 bg-red-50 text-red-700";
  if (token === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const measureStatusClassName = (status = "") => {
  const token = normalizeToken(status);
  if (token === "met") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (token === "notmet") return "border-red-200 bg-red-50 text-red-700";
  return "border-gray-200 bg-gray-50 text-gray-600";
};

const formatPriorityLabel = (tier = "") => {
  const token = normalizeToken(tier);
  if (token === "high") return "High priority";
  if (token === "medium") return "Medium priority";
  return "Routine review";
};

const formatMeasureStatusLabel = (status = "") => {
  const token = normalizeToken(status);
  if (token === "met") return "Reviewed";
  if (token === "notmet") return "Needs follow-up";
  return "Review needed";
};

const formatGapStatusLabel = (status = "") => {
  const token = normalizeToken(status);
  if (token === "closed") return "Reviewed";
  return "Needs follow-up";
};

const formatDueDate = (value = "") => {
  const date = String(value || "").slice(0, 10);
  return date || "No due date";
};

const VbcPatientLifecycleCard = ({ patientVbc, patientName = "", appointmentDate = "" }) => {
  if (!patientVbc || typeof patientVbc !== "object") return null;

  const openGaps = Array.isArray(patientVbc.gapsInCare)
    ? patientVbc.gapsInCare.filter((gap) => normalizeToken(gap?.status) === "open")
    : [];
  const closedGaps = Array.isArray(patientVbc.gapsInCare)
    ? patientVbc.gapsInCare.filter((gap) => normalizeToken(gap?.status) === "closed")
    : [];
  const actions = Array.isArray(patientVbc.nextBestActions)
    ? patientVbc.nextBestActions.map((action) =>
        buildWorkflowTask(
          {
            nextBestActions: [action],
            openGapCount: openGaps.length,
            addressedGapCount: closedGaps.length,
            priority: patientVbc?.risk?.tier,
            appointmentDate,
          },
          { referenceDate: appointmentDate }
        )
      )
    : [];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold text-gray-900">
            Today&apos;s Care Review
            {patientName ? `: ${patientName}` : ""}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Simple visit summary with what was reviewed today and what still needs follow-up.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${riskTierClassName(
                patientVbc?.risk?.tier
              )}`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {formatPriorityLabel(patientVbc?.risk?.tier)}
            </span>
            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              Needs follow-up: {openGaps.length}
            </span>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Reviewed today: {closedGaps.length}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 lg:max-w-sm">
          {patientVbc?.clinicalRationale || "No visit summary is available yet."}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">What To Watch</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {(Array.isArray(patientVbc?.risk?.drivers) ? patientVbc.risk.drivers : []).length === 0 ? (
              <li className="text-gray-500">No major watch items were returned.</li>
            ) : (
              patientVbc.risk.drivers.map((driver) => (
                <li key={driver} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  {driver}
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Reviewed Today</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {(Array.isArray(patientVbc?.qualityMeasures) ? patientVbc.qualityMeasures : []).length === 0 ? (
              <li className="text-gray-500">No reviewed items were returned.</li>
            ) : (
              patientVbc.qualityMeasures.map((measure) => (
                <li
                  key={`${measure.name}-${measure.status}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <span>{measure.name}</span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${measureStatusClassName(
                      measure.status
                    )}`}
                  >
                    {formatMeasureStatusLabel(measure.status)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Needs Attention</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {patientVbc?.gapsInCare?.length ? (
              patientVbc.gapsInCare.map((gap) => {
                const isOpen = normalizeToken(gap?.status) === "open";
                return (
                  <li
                    key={`${gap.measure}-${gap.status}-${gap.evidence}`}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-900">{gap.measure}</span>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          isOpen
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {formatGapStatusLabel(gap.status)}
                      </span>
                    </div>
                    {gap.evidence && <p className="mt-1 text-xs text-gray-500">{gap.evidence}</p>}
                    <p className="mt-1 text-[11px] text-gray-400">
                      Follow up by {formatDueDate(gap.dueDate)}
                    </p>
                  </li>
                );
              })
            ) : (
              <li className="text-gray-500">No follow-up items were returned.</li>
            )}
          </ul>
        </article>
      </div>

      {actions.length > 0 && (
        <article className="mt-4 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Next Steps</h3>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {actions.map((action) => (
              <div key={`${action.action}-${action.dueDate}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="text-sm font-medium text-gray-900">{action.action}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getWorkflowBadgeClassName(action.status)}`}>
                    {String(action.status || "Ready").replace(/_/g, " ")}
                  </span>
                  <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
                    Follow up by {formatDueDate(action.dueDate)}
                  </span>
                </div>
                {action.reason && <p className="mt-2 text-xs text-gray-500">{action.reason}</p>}
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
};

export default VbcPatientLifecycleCard;
