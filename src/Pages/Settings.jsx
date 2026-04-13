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

function Settings() {
  useEffect(() => {
    document.title = "Settings - Seismic Connect";
  }, []);

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Settings"
        //subtitle="View and download reports"
        //showDate={true}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Manage your personal information, clinic access, notifications, compliance, and account preferences.
            </p>
            <Link href="/settings/profile" className="text-sm font-medium text-blue-600 hover:underline">
              Open profile settings
            </Link>
          </CardContent>
        </Card>

        <HasPermission required="settings.ehr_integration" level="read">
          <Card>
            <CardHeader>
              <CardTitle>EHR Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Manage Athena and EHR connectivity for clinical workflows.
              </p>
              <Link href="/settings/ehr-integration" className="text-sm font-medium text-blue-600 hover:underline">
                Open integration settings
              </Link>
            </CardContent>
          </Card>
        </HasPermission>

        <HasPermission required="settings.payment_billing" level="read">
          <Card>
            <CardHeader>
              <CardTitle>Payment & Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Review payment methods and billing preferences.
              </p>
              <Link href="/settings/payment-billing" className="text-sm font-medium text-blue-600 hover:underline">
                Open billing settings
              </Link>
            </CardContent>
          </Card>
        </HasPermission>

        <HasPermission required="admin.manage_rbac" level="read">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Review role defaults and apply explicit permission overrides to users.
              </p>
              <Link href="/admin/rbac" className="text-sm font-medium text-blue-600 hover:underline">
                Open admin settings
              </Link>
            </CardContent>
          </Card>
        </HasPermission>
      </div>
    </div>
  );
}

export default Settings;
