import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { Video, Calendar } from "lucide-react";
import { Link } from "wouter";

const WelcomeCard = () => {
  const { data: user } = useQuery({
    queryKey: ["/api/users/1"],
  });

  const doctorName = user?.fullName || "Doctor";
  const firstName = doctorName.split(" ")[0];

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-semibold">Welcome to Seismic Connect</h1>
        <p className="text-blue-100 mt-2">
          Hello, {firstName}! Manage your telehealth practice with our
          integrated platform.
        </p>
      </div>
      <CardContent className="p-6">
        <div className="prose max-w-none">
          <p className="text-neutral-700 text-lg">
            Seismic Connect helps medical professionals like you deliver quality
            care through telehealth. Our platform streamlines appointment
            management, video consultations, and patient documentation in one
            place.
          </p>

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

