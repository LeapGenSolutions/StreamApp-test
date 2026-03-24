import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PageNavigation } from "../components/ui/page-navigation";
import {
  Stethoscope,
  Clock,
  BarChart3,
  DollarSign,
} from "lucide-react";

function BillingReports() {
  useEffect(() => {
    document.title = "Billing Reports - Seismic Connect";
  }, []);

  // --- Filters ---
  const [activeFilter, setActiveFilter] = useState("This Year");
  const filters = ["This Week", "This Month", "This Quarter", "This Year", "Custom Range"];

  // --- Data ---
  const cptData = [
    { name: "97110", value: 5 },
    { name: "99213", value: 3 },
    { name: "99214", value: 4 },
    { name: "99397", value: 2 },
    { name: "99406", value: 3 },
  ];
  const COLORS = ["#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#E53935"];

  const kpiCards = [
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Total Revenue",
      value: "$550.00",
      subtitle: "This month’s earnings",
      color: "blue",
    },
    {
      icon: <Stethoscope className="w-5 h-5" />,
      title: "Most Active Doctor",
      value: "Dr. Anusha Yammada",
      subtitle: "3 sessions this week",
      color: "green",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Most Billed Specialty",
      value: "General Medicine",
      subtitle: "$220.00 total billed",
      color: "purple",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Avg Session Duration",
      value: "28 min",
      subtitle: "Per patient session",
      color: "orange",
    },
  ];

  return (
    <div className="px-4 pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageNavigation
          title="Billing Reports"
          subtitle="Review billing activity and insights"
          showDate={true}
        />

        {/* --- Filters --- */}
        <div className="flex flex-wrap gap-3">
          {filters.map((label) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                ${
                  activeFilter === label
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* --- KPI Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpiCards.map((kpi, idx) => (
            <div
              key={idx}
              className={`
                flex items-center gap-4 p-5 rounded-2xl border border-gray-100 
                bg-${kpi.color}-50 text-gray-900 shadow-sm transition-all duration-300 
                hover:bg-${kpi.color}-100 hover:shadow-lg hover:scale-[1.02] cursor-pointer
              `}
            >
              <div className={`p-3 rounded-xl bg-white text-${kpi.color}-600 shadow-sm`}>
                {kpi.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">{kpi.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-500 mt-1">{kpi.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* --- Billing Details --- */}
        <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Billing Details
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3">Doctor Name</th>
                  <th className="pb-3">Total Sessions</th>
                  <th className="pb-3">Total Time (min)</th>
                  <th className="pb-3">Total Billed</th>
                  <th className="pb-3">Billing Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Dr. Anusha Yammada",
                    sessions: 3,
                    time: 84,
                    billed: "$550.00",
                    status: "Paid",
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-0 border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="py-3 text-gray-700">{row.sessions}</td>
                    <td className="py-3 text-gray-700">{row.time}</td>
                    <td className="py-3 text-green-600 font-semibold">
                      {row.billed}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                <td className="py-3">
                  <button
                      className="text-blue-600 font-medium text-sm relative group
                      transition-all duration-200 cursor-pointer
                    hover:text-blue-800 active:scale-[0.97]"
                  >
                      <span className="inline-flex items-center">
                      View Details
                      <span
                          className="absolute bottom-0 left-0 w-0 h-[1px] bg-blue-600 
                          transition-all duration-300 group-hover:w-full"
                          ></span>
                          </span>
                      </button>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- CPT Code Frequency Chart --- */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            CPT Code Frequency
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cptData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  fill="#8884d8"
                  label
                >
                  {cptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingReports
