import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const ProviderWorkload = ({ date = format(new Date(), "yyyy-MM-dd") }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/stats/appointments/${date}`],
  });

  const { data: providers, isLoading: isProvidersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  if (isLoading || isProvidersLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Provider Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="space-y-4">
              <div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-neutral-200 rounded w-full"></div>
              </div>
              <div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-neutral-200 rounded w-full"></div>
              </div>
              <div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-neutral-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const workload = stats?.providerWorkload || [];
  const maxPatients = Math.max(...workload.map((w) => w.patientCount), 0);

  const getProviderName = (providerId) => {
    const provider = providers?.find((p) => p.id === providerId);
    return provider?.fullName || `Provider #${providerId}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Provider Workload</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary-500">
            View All
            <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workload.map((item) => (
            <div key={item.providerId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-neutral-600 text-sm">
                  {getProviderName(item.providerId)}
                </span>
                <span className="text-neutral-800 font-semibold">
                  {item.patientCount} patients
                </span>
              </div>
              <Progress
                value={
                  maxPatients > 0 ? (item.patientCount / maxPatients) * 100 : 0
                }
                className="h-2 bg-neutral-200"
              />
            </div>
          ))}

          {workload.length === 0 && (
            <div className="text-center text-sm text-neutral-500 py-4">
              No provider workload data available for this date.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderWorkload;
