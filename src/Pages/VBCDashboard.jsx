import { useMemo } from "react";
import { Link, useSearchParams } from "wouter";
import { PageNavigation } from "../components/ui/page-navigation";
import PowerBIReportEmbed from "../components/powerbi/PowerBIReportEmbed";

const VBCDashboard = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = (searchParams.get("appointmentId") || "").trim();
  const patientName = (
    searchParams.get("patientName") ||
    searchParams.get("patient") ||
    ""
  ).trim();
  const date = (searchParams.get("date") || "").trim();
  const selectedMetricKey = (searchParams.get("metric") || "").trim().toLowerCase();
  const doctorEmail = (searchParams.get("doctorEmail") || "").trim();
  const doctorId = (searchParams.get("doctorId") || "").trim();
  const clinicId = (searchParams.get("clinicId") || "").trim();

  const hasAnyScope = useMemo(
    () =>
      Boolean(
        appointmentId ||
          patientName ||
          selectedMetricKey ||
          date ||
          doctorEmail ||
          doctorId ||
          clinicId
      ),
    [appointmentId, patientName, selectedMetricKey, date, doctorEmail, doctorId, clinicId]
  );

  return (
    <div className="px-4 pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageNavigation
          title="Visit Details"
          subtitle="Power BI dashboard"
          showBackButton={true}
          rightSlot={
            <Link
              href="/vbc"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Summary
            </Link>
          }
        />

        {!hasAnyScope && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Open a visit from the VBC Summary to load the Power BI dashboard here.
          </div>
        )}

        {hasAnyScope && (
          <PowerBIReportEmbed
            appointmentId={appointmentId}
            patientName={patientName}
            date={date}
            metric={selectedMetricKey}
            doctorEmail={doctorEmail}
            doctorId={doctorId}
            clinicId={clinicId}
          />
        )}
      </div>
    </div>
  );
};

export default VBCDashboard;
