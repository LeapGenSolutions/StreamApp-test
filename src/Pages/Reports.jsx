import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PageNavigation } from "../components/ui/page-navigation";
import { Link } from "wouter";
import HasPermission from "../components/auth/HasPermission";

function Reports() {
  useEffect(() => {
    document.title = "Reports - Seismic Connect";
  }, []);

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Reports"
        subtitle="View and download reports"
        showDate={true}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <HasPermission required="reports.billing_analytics" level="read">
          <Card>
            <CardHeader>
              <CardTitle>Billing Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Review revenue and billing performance trends.
              </p>
              <Link href="/reports/billing-analytics" className="text-sm font-medium text-blue-600 hover:underline">
                Open analytics
              </Link>
            </CardContent>
          </Card>
        </HasPermission>

        <HasPermission required="reports.billing_history" level="read">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                View invoice history and payment statuses.
              </p>
              <Link href="/reports/billing-history" className="text-sm font-medium text-blue-600 hover:underline">
                Open history
              </Link>
            </CardContent>
          </Card>
        </HasPermission>

        <HasPermission required="reports.estimated_billing" level="read">
          <Card>
            <CardHeader>
              <CardTitle>Estimated Billing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Estimated billing views will plug into this report area next.
            </CardContent>
          </Card>
        </HasPermission>
      </div>
    </div>
  );
}

export default Reports;
