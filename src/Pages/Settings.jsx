import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PageNavigation } from "../components/ui/page-navigation";

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
      {/*<h1 className="text-2xl font-semibold">Settings</h1>*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>Coming soon...</CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Settings;
