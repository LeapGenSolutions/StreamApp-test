import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Video, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useSelector } from "react-redux";

const WelcomeCard = () => {
  // Use the same user source as Header
  const user = useSelector((state) => state.me.me);

  const doctorName =
    user?.fullName ||
    user?.name ||
    `${user?.given_name || ""} ${user?.family_name || ""}`.trim() ||
    user?.given_name ||
    user?.email?.split("@")[0] ||
    "Doctor";

  return (
    <Card className="mb-6 overflow-hidden">
      {/* Header Section */}
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-semibold">Welcome to SEISMIC Connect!</h1>
        <p className="text-blue-100 mt-2">
          Hello {doctorName}, we are here to support the way you practice care
        </p>
      </div>

      {/* Body Section */}
      <CardContent className="p-6">
        <div className="prose max-w-none">
          <p className="text-neutral-700 text-lg leading-relaxed">
            SEISMIC Connect helps you focus on what truly matters: your patients. Your time is meant for patients, not paperwork. With automated intake, reduced documentation burden, real-time clinical decision support, and tools that elevate emotional connection, SEISMIC ensures you spend less time clicking and more time caring.
          </p>

          

          {/* Buttons */}
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/appointments">
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4" />
                View Appointments
              </Button>
            </Link>

            <Link href="/video-call">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Video className="h-4 w-4" />
                Start Video Call
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
