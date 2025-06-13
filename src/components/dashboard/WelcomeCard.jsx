import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { Video, Calendar, FileText, Users } from "lucide-react";
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="border rounded-lg p-4 flex items-start">
              <div className="mr-4 bg-blue-100 p-2 rounded-full">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-1">
                  Video Consultations
                </h3>
                <p className="text-sm text-neutral-600">
                  Connect with patients virtually through secure,
                  HIPAA-compliant video calls.
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 flex items-start">
              <div className="mr-4 bg-blue-100 p-2 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-1">
                  Appointment Management
                </h3>
                <p className="text-sm text-neutral-600">
                  Schedule and track patient appointments with an intuitive
                  calendar interface.
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 flex items-start">
              <div className="mr-4 bg-blue-100 p-2 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-1">
                  Clinical Documentation
                </h3>
                <p className="text-sm text-neutral-600">
                  Maintain comprehensive patient notes and clinical
                  documentation.
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 flex items-start">
              <div className="mr-4 bg-blue-100 p-2 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-1">
                  Patient Management
                </h3>
                <p className="text-sm text-neutral-600">
                  Search and manage your patient database with integrated EMR
                  features.
                </p>
              </div>
            </div>
          </div>

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
