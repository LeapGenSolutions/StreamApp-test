import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PageNavigation } from "../components/ui/page-navigation";

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
      {/*<h1 className="text-2xl font-semibold">Reports</h1>*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
          </CardHeader>
          <CardContent>Coming soon...</CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Reports;
