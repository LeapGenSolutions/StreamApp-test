import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  UserRound,
  ChartBar,
  Plus
} from "lucide-react";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export default function ProviderWorkload() {
  const providers = useSelector((state) => state.patients.patients || []);
  const appointments = useSelector((state) => state.appointments.appointments || []);
  const workloadChartRef = useRef(null);
  const workloadChartInstance = useRef(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showError, setShowError] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log('Providers:', providers);
    console.log('Appointments:', appointments);
  }, [providers, appointments]);

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
  const providerData = providers.map((provider, idx) => {
    const count = appointments.filter(
      (appt) => appt.doctorId === provider.id || appt.providerId === provider.id
    ).length;
    return {
      id: provider.id,
      name: provider.full_name || provider.name || "Unknown",
      initials: getInitials(provider.full_name || provider.name),
      specialty: provider.specialty || "-",
      count,
    };
  }).filter((p) => p.count > 0);

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
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.1)" } },
              x: { grid: { display: false } }
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
          <div className="icon-container bg-purple-100">
            <UserRound className="text-purple-600 w-5 h-5" />
          </div>
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
                <div key={provider.id} className="provider-item">
                  <div className="provider-info">
                    <div className="provider-avatar">
                      <span className="provider-initials">
                        {provider.initials}
                      </span>
                    </div>
                    <div className="provider-details">
                      <p className="provider-name">{provider.name}</p>
                      <p className="provider-specialty">{provider.specialty}</p>
                    </div>
                  </div>
                  <div className="provider-stats">
                    <p className="appointment-count">{provider.count}</p>
                    <p className="appointment-label">appointments</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="workload-chart-container">
              <div className="chart-wrapper">
                <canvas ref={workloadChartRef} className="workload-chart"></canvas>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
