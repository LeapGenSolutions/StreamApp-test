import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const AppointmentStatus = ({ date = format(new Date(), "yyyy-MM-dd") }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/stats/appointments/${date}`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Appointment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-1"></div>
                <div className="h-2 bg-neutral-200 rounded w-full mb-3"></div>
              </div>
              <div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-1"></div>
                <div className="h-2 bg-neutral-200 rounded w-full mb-3"></div>
              </div>
              <div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-1"></div>
                <div className="h-2 bg-neutral-200 rounded w-full mb-3"></div>
              </div>
              <div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-1"></div>
                <div className="h-2 bg-neutral-200 rounded w-full mb-3"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAppointments = stats?.totalAppointments || 0;
  const completed = stats?.statusBreakdown?.completed || 0;
  const inProgress = stats?.statusBreakdown?.inProgress || 0;
  const waiting = stats?.statusBreakdown?.waiting || 0;
  const noShow = stats?.statusBreakdown?.noShow || 0;

  const completedPercentage =
    totalAppointments > 0 ? (completed / totalAppointments) * 100 : 0;
  const inProgressPercentage =
    totalAppointments > 0 ? (inProgress / totalAppointments) * 100 : 0;
  const waitingPercentage =
    totalAppointments > 0 ? (waiting / totalAppointments) * 100 : 0;
  const noShowPercentage =
    totalAppointments > 0 ? (noShow / totalAppointments) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Appointment Status</CardTitle>
          <span className="text-sm font-medium text-neutral-500">
            Real-time
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-neutral-600 text-sm">Completed</span>
              <span className="text-neutral-800 font-semibold">
                {completed}
              </span>
            </div>
            <Progress
              value={completedPercentage}
              className="h-2 mb-3 bg-neutral-200"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-neutral-600 text-sm">In Progress</span>
              <span className="text-neutral-800 font-semibold">
                {inProgress}
              </span>
            </div>
            <Progress
              value={inProgressPercentage}
              className="h-2 mb-3 bg-neutral-200"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-neutral-600 text-sm">Waiting</span>
              <span className="text-neutral-800 font-semibold">{waiting}</span>
            </div>
            <Progress
              value={waitingPercentage}
              className="h-2 mb-3 bg-neutral-200"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-neutral-600 text-sm">No-Show</span>
              <span className="text-neutral-800 font-semibold">{noShow}</span>
            </div>
            <Progress
              value={noShowPercentage}
              className="h-2 mb-3 bg-neutral-200"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentStatus;
