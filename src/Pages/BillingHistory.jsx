import { useEffect, useState } from "react";
import {
  Download,
  Filter,
  Search,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { PageNavigation } from "../components/ui/page-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const MOCK_BILLING_HISTORY = [
  {
    id: "INV-2025-00123",
    date: "2025-11-20",
    patient: "John Smith",
    doctor: "Dr. Anusha Yammada",
    cptCodes: ["99213", "97110"],
    amount: 220.0,
    status: "Paid",
    method: "Credit Card",
  },
  {
    id: "INV-2025-00124",
    date: "2025-11-21",
    patient: "Emily Davis",
    doctor: "Dr. Anusha Yammada",
    cptCodes: ["99214"],
    amount: 180.0,
    status: "Pending",
    method: "Insurance",
  },
  {
    id: "INV-2025-00125",
    date: "2025-11-22",
    patient: "Michael Brown",
    doctor: "Dr. Anusha Yammada",
    cptCodes: ["99406"],
    amount: 150.0,
    status: "Declined",
    method: "Credit Card",
  },
];

function getStatusBadgeClasses(status) {
  if (status === "Paid") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }
  if (status === "Pending") {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  }
  return "bg-red-50 text-red-700 border border-red-100";
}

function getStatusIcon(status) {
  if (status === "Paid") return <CheckCircle className="w-3 h-3 mr-1" />;
  if (status === "Pending") return <Clock className="w-3 h-3 mr-1" />;
  return <XCircle className="w-3 h-3 mr-1" />;
}

export default function BillingHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    document.title = "Billing History - Seismic Connect";
  }, []);

  const filteredRows = MOCK_BILLING_HISTORY.filter((row) => {
    const matchesSearch =
      search.trim().length === 0 ||
      row.id.toLowerCase().includes(search.toLowerCase()) ||
      row.patient.toLowerCase().includes(search.toLowerCase()) ||
      row.doctor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredRows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="px-4 pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageNavigation
          title="Billing History"
          subtitle="Review past invoices, payment status, and transaction details"
          showDate={true}
        />

        {/* Filters + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Filters card */}
          <Card className="lg:col-span-2 shadow-md border border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Label className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                    <Search className="w-3 h-3" />
                    Search (invoice, patient, doctor)
                  </Label>
                  <Input
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1 block">
                    Status
                  </Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  >
                    <option>All</option>
                    <option>Paid</option>
                    <option>Pending</option>
                    <option>Declined</option>
                  </select>
                </div>
                <div className="flex items-end justify-start md:justify-end">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 h-9 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary card */}
          <Card className="shadow-md border-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Summary (Filtered)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-blue-100">Total Invoices</p>
                <p className="text-2xl font-bold">
                  {filteredRows.length.toString().padStart(2, "0")}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-100">Total Amount</p>
                <p className="text-xl font-semibold">
                  ${totalAmount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing history table */}
        <Card className="shadow-lg border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-700" />
                <CardTitle className="text-base text-gray-800">
                  Invoice List
                </CardTitle>
              </div>
              <span className="text-xs text-gray-500">
                {filteredRows.length} record(s)
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Patient</th>
                    <th className="px-4 py-3 font-medium">Doctor</th>
                    <th className="px-4 py-3 font-medium">CPT Codes</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.id}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.date}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.patient}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.doctor}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.cptCodes.join(", ")}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">
                        ${row.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${getStatusBadgeClasses(
                            row.status
                          )}`}
                        >
                          {getStatusIcon(row.status)}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-blue-600 text-xs font-medium hover:text-blue-800 hover:underline"
                          // later: open InvoicePreview with this invoice id
                        >
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-6 text-center text-sm text-gray-500"
                      >
                        No billing records match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
