import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useSelector } from "react-redux";
import { CheckCircle2, ClipboardList, ShieldAlert } from "lucide-react";
import { PageNavigation } from "../components/ui/page-navigation";
import { getSessionAuthScope } from "../api/auth";
import { fetchVbcSummary } from "../api/vbcSummary";
import {
  applyWorkflowTaskOverride,
  buildWorkflowTask,
  formatWorkflowOwner,
  getWorkflowBadgeClassName,
  getWorkflowTaskKey,
  WORKFLOW_OWNER_OPTIONS,
  WORKFLOW_STATUS_OPTIONS,
} from "../lib/vbcWorkflow";
import {
  clearVbcTaskOverride,
  getVbcTaskOverrides,
  setVbcTaskOverride,
} from "../lib/vbcTaskStore";

const normalizeToken = (value = "") =>
  String(value).toLowerCase().trim().replace(/[\s_-]/g, "");

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const pickFirst = (...values) => values.find(hasValue);

const normalizeAppointmentDate = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return "";
};

const extractClinicId = (item = {}) =>
  String(
    pickFirst(
      item.clinicId,
      item.clinic_id,
      item.practiceId,
      item.practice_id,
      item.facilityId,
      item.facility_id
    ) || ""
  ).trim();

const extractClinicLabel = (item = {}) =>
  String(
    pickFirst(
      item.clinicName,
      item.clinic_name,
      item.practiceName,
      item.practice_name,
      item.facilityName,
      item.facility_name
    ) || ""
  ).trim();

const extractDoctorEmail = (item = {}) =>
  normalizeEmail(
    pickFirst(
      item.doctorEmail,
      item.doctor_email,
      item.providerEmail,
      item.provider_email,
      item.userID,
      item.userId
    ) || ""
  );

const extractDoctorName = (item = {}) =>
  String(
    pickFirst(
      item.doctorName,
      item.doctor_name,
      item.providerName,
      item.provider_name,
      item.fullName,
      item.name
    ) || ""
  ).trim();

const isCancelledStatus = (status = "") => {
  const token = normalizeToken(status);
  return token === "cancelled" || token === "canceled";
};

const getAccessLevel = (user = {}) => {
  const tokens = [
    user.role,
    ...(Array.isArray(user.roles) ? user.roles : [user.roles]),
    user.accessLevel,
  ]
    .flat()
    .map((value) => normalizeToken(value))
    .filter(Boolean);

  if (
    tokens.some((token) =>
      ["clinic", "practice", "facility", "admin", "manager", "lead", "director"].some(
        (keyword) => token.includes(keyword)
      )
    )
  ) {
    return "clinic";
  }

  return "doctor";
};

const compareTaskRows = (left, right) => {
  const statusOrder = {
    URGENT: 0,
    OPEN: 1,
    FOLLOW_UP: 2,
    IN_PROGRESS: 3,
    READY: 4,
    COMPLETED: 5,
    DEFERRED: 6,
  };

  const statusDiff =
    (statusOrder[left.workflowTask.status] ?? 99) - (statusOrder[right.workflowTask.status] ?? 99);
  if (statusDiff !== 0) return statusDiff;

  const dueDateDiff = String(left.workflowTask.dueDate || "").localeCompare(
    String(right.workflowTask.dueDate || "")
  );
  if (dueDateDiff !== 0) return dueDateDiff;

  return String(left.patientName || "").localeCompare(String(right.patientName || ""));
};

const VBCWorkQueue = () => {
  const me = useSelector((state) => state.me.me || {});
  const sessionScope = useMemo(() => getSessionAuthScope(), []);
  const providerEmail = normalizeEmail(
    me.email || me.doctor_email || sessionScope.doctorEmail || ""
  );
  const accessLevel = useMemo(
    () => getAccessLevel({ ...sessionScope.claims, ...sessionScope, ...me }),
    [me, sessionScope]
  );
  const clinicId = extractClinicId(me) || sessionScope.clinicId;
  const clinicLabel =
    extractClinicLabel(me) || sessionScope.clinicName || clinicId || "Current clinic";
  const todayKey = new Date().toLocaleDateString("en-CA");

  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState(accessLevel === "doctor" ? "provider" : "ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [taskOverrides, setTaskOverrides] = useState(() => getVbcTaskOverrides());

  useEffect(() => {
    if (accessLevel === "doctor") {
      setOwnerFilter("provider");
    }
  }, [accessLevel]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const data = await fetchVbcSummary({
          date: todayKey,
          clinicId,
          doctorEmail: accessLevel === "doctor" ? providerEmail : "",
        });

        if (isMounted) {
          setSummaryData(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setSummaryData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [accessLevel, clinicId, providerEmail, todayKey]);

  const queueRows = useMemo(
    () =>
      (Array.isArray(summaryData?.appointments) ? summaryData.appointments : [])
        .filter((row) => !isCancelledStatus(row.status))
        .map((row) => {
          const baseTask = buildWorkflowTask(row, {
            referenceDate: row.appointmentDate || todayKey,
          });
          const taskKey = getWorkflowTaskKey(row, baseTask);
          const workflowTask = applyWorkflowTaskOverride(baseTask, taskOverrides[taskKey]);
          return {
            ...row,
            taskKey,
            workflowTask,
          };
        })
        .sort(compareTaskRows),
    [summaryData, taskOverrides, todayKey]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = normalizeToken(searchFilter);

    return queueRows.filter((row) => {
      if (ownerFilter !== "ALL" && normalizeToken(row.workflowTask.owner) !== ownerFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && row.workflowTask.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) return true;

      const haystack = normalizeToken(
        `${row.patientName} ${extractDoctorName(row)} ${row.workflowTask.action} ${row.workflowTask.reason}`
      );
      return haystack.includes(normalizedSearch);
    });
  }, [ownerFilter, queueRows, searchFilter, statusFilter]);

  const queueCounts = useMemo(
    () =>
      queueRows.reduce(
        (totals, row) => {
          const status = row.workflowTask.status;
          if (status === "URGENT") totals.urgent += 1;
          if (status === "COMPLETED") totals.completed += 1;
          if (status === "FOLLOW_UP") totals.followUp += 1;
          if (status === "OPEN") totals.open += 1;
          return totals;
        },
        { urgent: 0, completed: 0, followUp: 0, open: 0 }
      ),
    [queueRows]
  );

  const handleTaskPatch = (taskKey, patch) => {
    setVbcTaskOverride(taskKey, patch);
    setTaskOverrides(getVbcTaskOverrides());
  };

  const handleReset = (taskKey) => {
    clearVbcTaskOverride(taskKey);
    setTaskOverrides(getVbcTaskOverrides());
  };

  return (
    <div className="px-4 pb-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageNavigation
          title="My Work Queue"
          subtitle={`Task-oriented VBC workflow for ${clinicLabel}`}
          showBackButton={true}
          rightSlot={
            <Link
              href="/vbc"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Summary
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-sm font-semibold">Urgent</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-red-800">{queueCounts.urgent}</p>
          </article>
          <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <ClipboardList className="h-4 w-4" />
              <span className="text-sm font-semibold">Open</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-amber-800">{queueCounts.open}</p>
          </article>
          <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <ClipboardList className="h-4 w-4" />
              <span className="text-sm font-semibold">Follow-up</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-blue-800">{queueCounts.followUp}</p>
          </article>
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-semibold">Completed</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-emerald-800">{queueCounts.completed}</p>
          </article>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs font-medium text-gray-600">
                Search
                <input
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder="Patient, provider, or action"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                />
              </label>

              <label className="text-xs font-medium text-gray-600">
                Owner
                <select
                  value={ownerFilter}
                  onChange={(event) => setOwnerFilter(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="ALL">All owners</option>
                  {WORKFLOW_OWNER_OPTIONS.map((owner) => (
                    <option key={owner} value={owner}>
                      {formatWorkflowOwner(owner)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-gray-600">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="ALL">All statuses</option>
                  {WORKFLOW_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Patient", "Provider", "Action", "Status", "Owner", "Due", "Details"].map(
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
                {!isLoading && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                      No tasks match the current filters.
                    </td>
                  </tr>
                )}

                {filteredRows.map((row) => (
                  <tr key={row.taskKey}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{row.patientName}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        Open {Number(row.openGapCount || 0)} | Addressed {Number(row.addressedGapCount || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{extractDoctorName(row) || extractDoctorEmail(row) || "-"}</div>
                      {row.doctorEmail && <div className="mt-1 text-xs text-gray-500">{row.doctorEmail}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{row.workflowTask.action}</div>
                      {row.workflowTask.reason && (
                        <div className="mt-1 text-xs text-gray-500">{row.workflowTask.reason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <select
                        value={row.workflowTask.status}
                        onChange={(event) =>
                          handleTaskPatch(row.taskKey, { status: event.target.value })
                        }
                        className={`rounded-lg border px-3 py-2 text-sm font-medium ${getWorkflowBadgeClassName(
                          row.workflowTask.status
                        )}`}
                      >
                        {WORKFLOW_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <select
                        value={normalizeToken(row.workflowTask.owner)}
                        onChange={(event) =>
                          handleTaskPatch(row.taskKey, { owner: event.target.value })
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        {WORKFLOW_OWNER_OPTIONS.map((owner) => (
                          <option key={owner} value={owner}>
                            {formatWorkflowOwner(owner)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={normalizeAppointmentDate(row.workflowTask.dueDate)}
                          onChange={(event) =>
                            handleTaskPatch(row.taskKey, { dueDate: event.target.value })
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleReset(row.taskKey)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <Link
                        href={`/vbc/details?date=${encodeURIComponent(
                          todayKey
                        )}&appointmentId=${encodeURIComponent(row.id)}&patientName=${encodeURIComponent(
                          row.patientName || ""
                        )}`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VBCWorkQueue;
