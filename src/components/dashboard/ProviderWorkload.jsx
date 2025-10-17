import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  ChartBar,
  Plus
} from "lucide-react";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { fetchDoctorsFromHistory } from "../../api/callHistory";
import { getColorFromName } from "../../constants/colors";


Chart.register(...registerables);

function getInitials(name) {
  if (!name) return "?";
  const parts = name
    .replace(/^Dr\.?\s+/i, "") // remove "Dr." or "Dr " prefix if present
    .trim()
    .split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export default function ProviderWorkload() {
  //const providers = useSelector((state) => state.patients.patients || []);
  //const appointments = useSelector((state) => state.appointments.appointments || []);
  const [providers, setProviders] = useState([]);
  const appointments = useSelector(
    (state) =>
      state.appointment?.appointments ||
      state.appointments?.appointments ||
      []
  );
  const workloadChartRef = useRef(null);
  const workloadChartInstance = useRef(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showError, setShowError] = useState(false);

  // Debug logs
  //useEffect(() => {
    //console.log('Providers:', providers);
    //console.log('Appointments:', appointments);
    //console.log("Sample appointment:", appointments[0]);

  //}, [providers, appointments]);

  // Fetch doctors directly from backend since Redux cannot be changed
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await fetchDoctorsFromHistory();
        setProviders(data || []);
      } catch (err) {
        console.error("Failed to fetch doctors from history:", err);
      }
    };
    loadProviders();
  }, []);

  // Robust loading/error handling
  useEffect(() => {
    const spinnerTimeout = setTimeout(() => setShowSpinner(true), 2000); // 2s
    const errorTimeout = setTimeout(() => setShowError(true), 10000); // 10s
    return () => {
      clearTimeout(spinnerTimeout);
      clearTimeout(errorTimeout);
    };
  }, []);

  // Calculate workload data
  // New logic: derive workload directly from appointment data
  const workloadMap = {};

  appointments.forEach((appt) => {
    const doctorKey = appt.doctor_email || appt.doctor_id || appt.doctor_name;
    if (!doctorKey) return;

    if (!workloadMap[doctorKey]) {
      const doctorColor = getColorFromName(doctorKey); // Consistent color with DoctorMultiSelect

      workloadMap[doctorKey] = {
        id: appt.doctor_id || doctorKey,
        name: appt.doctor_name || "Unknown",
        initials: getInitials(appt.doctor_name || ""),
        specialty: appt.specialization || "-",
        color: doctorColor, // Add color field
        count: 0,
      };
    }
    workloadMap[doctorKey].count += 1;
  });

  const providerData = Object.values(workloadMap);

  useEffect(() => {
    if (!providerData.length) return;

    if (workloadChartRef.current) {
      if (workloadChartInstance.current) {
        workloadChartInstance.current.destroy();
      }

      const ctx = workloadChartRef.current.getContext("2d");
      if (ctx) {
        workloadChartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: providerData.map((p) => p.name),
            datasets: [
              {
                data: providerData.map((p) => p.count),
                backgroundColor: [
                  "hsl(207, 90%, 54%)",
                  "hsl(168, 94%, 40%)",
                  "hsl(0, 79%, 49%)",
                  "hsl(36, 98%, 50%)",
                  "hsl(270, 95%, 60%)"
                ],
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `Appointments: ${context.parsed.y}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: "rgba(0,0,0,0.05)" },
                ticks: { color: "#4b5563" }
              },
              x: {
                grid: { display: false },
                ticks: { color: "#4b5563", font: { size: 12 } }
              }
            }
          }
        });
      }
    }

    return () => {
      if (workloadChartInstance.current) {
        workloadChartInstance.current.destroy();
      }
    };
  }, [providerData]);

  if (showError && (!providers.length || !appointments.length)) {
    return (
      <Card className="provider-workload-card">
        <CardContent className="p-6">
          <div className="text-red-500 text-center font-semibold py-8">
            Failed to load provider workload data. Please check your connection or try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  if ((!providers.length || !appointments.length) && showSpinner) {
    return (
      <Card className="provider-workload-card">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <div className="text-gray-500">Loading provider workload…</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!providers.length) {
    return (
      <Card className="provider-workload-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="provider-workload-card card-hover animate-fade-in shadow-sm">
      <CardContent className="p-6">
        <div className="provider-workload-header">
          <h3 className="text-lg font-semibold text-gray-900">Provider Workload</h3>
          {/*<div className="icon-container bg-purple-100">
            <UserRound className="text-purple-600 w-5 h-5" />
          </div>*/}
        </div>

        {!providerData.length ? (
          <div className="no-data-state">
            <div className="no-data-icon">
              <ChartBar className="text-gray-400 w-6 h-6" />
            </div>
            <p className="no-data-title">No workload data available</p>
            <p className="no-data-subtitle">Data will appear when appointments are scheduled</p>
            <Button variant="outline" className="add-provider-btn">
              <Plus className="w-4 h-4 mr-1" />
              Add Provider
            </Button>
          </div>
        ) : (
          <>
            <div className="provider-list">
              {providerData.map((provider, index) => (
                //<div key={provider.id} className="provider-item">
                <div key={provider.id || provider.email || index} className="provider-item">
                  <div className="provider-info">
                    <div
                      className="provider-avatar w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold text-sm"
                      style={{ backgroundColor: provider.color || "#6B7280" }}
                    >
                      {provider.initials}
                    </div>
                    <div className="provider-details">
                      <p className="provider-name">{provider.name}</p>
                      <p className="text-gray-900 text-base mt-1">
                        Specialty: <span className="text-blue-700">{provider.specialty || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="provider-stats">
                    <p className="text-gray-900 text-base mt-1">
                      Total Appointments with SEISMIC: <span className="text-blue-700">{provider.count}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="workload-chart-container mt-4">
              <div className="chart-wrapper">
                <canvas ref={workloadChartRef} className="workload-chart"></canvas>
              </div>
              <p className="w-full text-center text-gray-600 text-sm mt-3">
                Appointments per provider
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}