import { useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Stethoscope,
  User,
  Calendar,
  DollarSign,
  Download,
} from "lucide-react";
import { PageNavigation } from "../components/ui/page-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function InvoicePreview() {
  // Later: you can read invoiceId from route params
  const invoiceId = "INV-2025-00123";

  useEffect(() => {
    document.title = `Invoice ${invoiceId} - Seismic Connect`;
  }, []);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="space-y-6">
      <PageNavigation
        title={`Invoice ${invoiceId}`}
        subtitle="Preview of billing details and charges for this encounter"
        showDate={true}
      />

      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Billing History
        </Button>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      <Card className="shadow-lg border border-gray-100 max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Invoice Summary
                </CardTitle>
                <p className="text-xs text-slate-200 mt-1">
                  Seismic Connect · Healthcare Billing
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-200">
              <p>Invoice ID: {invoiceId}</p>
              <p>Date: 2025-11-20</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6 bg-white">
          {/* Header info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <User className="w-4 h-4" />
                Patient
              </div>
              <p className="text-gray-900">John Smith</p>
              <p className="text-gray-500 text-xs">MRN: 123456789</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Stethoscope className="w-4 h-4" />
                Provider
              </div>
              <p className="text-gray-900">Dr. Anusha Yammada</p>
              <p className="text-gray-500 text-xs">General Medicine</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Calendar className="w-4 h-4" />
                Visit Date
              </div>
              <p className="text-gray-900">2025-11-18</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-700 font-semibold">Billing Status</p>
              <p className="text-emerald-700 bg-emerald-50 inline-flex items-center px-2 py-1 rounded-full text-xs border border-emerald-100">
                Paid
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-700 font-semibold">Payment Method</p>
              <p className="text-gray-900">Credit Card (•••• 4242)</p>
            </div>
          </div>

          {/* Line items */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              CPT Line Items
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                    <th className="py-2 px-3 font-medium">CPT Code</th>
                    <th className="py-2 px-3 font-medium">Description</th>
                    <th className="py-2 px-3 font-medium">Units</th>
                    <th className="py-2 px-3 font-medium">Rate</th>
                    <th className="py-2 px-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b last:border-0 border-gray-100">
                    <td className="py-2 px-3 text-gray-900 font-medium">
                      99213
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      Office/outpatient visit, established patient
                    </td>
                    <td className="py-2 px-3 text-gray-700">1</td>
                    <td className="py-2 px-3 text-gray-700">$120.00</td>
                    <td className="py-2 px-3 text-gray-900 font-semibold">
                      $120.00
                    </td>
                  </tr>
                  <tr className="border-b last:border-0 border-gray-100">
                    <td className="py-2 px-3 text-gray-900 font-medium">
                      97110
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      Therapeutic exercises, 15 minutes
                    </td>
                    <td className="py-2 px-3 text-gray-700">2</td>
                    <td className="py-2 px-3 text-gray-700">$50.00</td>
                    <td className="py-2 px-3 text-gray-900 font-semibold">
                      $100.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col items-end space-y-1 text-sm">
              <div className="flex justify-between w-full md:w-1/2">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-semibold">$220.00</span>
              </div>
              <div className="flex justify-between w-full md:w-1/2">
                <span className="text-gray-600">Adjustments / Discounts</span>
                <span className="text-gray-900 font-semibold">-$0.00</span>
              </div>
              <div className="flex justify-between w-full md:w-1/2 border-t border-gray-200 pt-2 mt-1">
                <span className="text-gray-800 font-semibold flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Total Billed
                </span>
                <span className="text-gray-900 font-bold text-lg">
                  $220.00
                </span>
              </div>
            </div>
          </div>

          {/* Footer notice */}
          <div className="mt-6 text-[11px] text-gray-500 border-t border-dashed border-gray-200 pt-3">
            This invoice is generated by Seismic Connect for demonstration.
            Actual billing logic, insurance adjustments, and AMA-based rates
            will come from the backend integration.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
