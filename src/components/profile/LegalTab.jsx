import { Scale, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export default function LegalTab({ profileData }) {
  // Use mock dates if user is a legacy user without explicit tracked agreements,
  // or use the real Cosmos DB 'createdAt' / 'updatedAt'
  const defaultAccepted = profileData?.createdAt || "2026-01-15T09:00:00Z";

  // Legal texts generally align with when they registered using CIAM
  const acceptedAgreements = [
    {
      title: "Terms & Conditions",
      acceptedOn: profileData?.agreements?.terms?.acceptedOn || defaultAccepted,
      version: profileData?.agreements?.terms?.version || "v2.3",
      status: "Accepted",
    },
    {
      title: "Privacy Policy",
      acceptedOn: profileData?.agreements?.privacy?.acceptedOn || defaultAccepted,
      version: profileData?.agreements?.privacy?.version || "v4.1",
      status: "Accepted",
    },
    {
      title: "AI Usage Acknowledgement",
      acceptedOn: profileData?.agreements?.ai?.acceptedOn || defaultAccepted,
      version: profileData?.agreements?.ai?.version || "v1.8",
      status: "Accepted",
    },
    {
      title: "Clinical Responsibility Acknowledgement",
      acceptedOn: profileData?.agreements?.clinical?.acceptedOn || defaultAccepted,
      version: profileData?.agreements?.clinical?.version || "v3.0",
      status: "Accepted",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Agreements & Acknowledgements</CardTitle>
          </div>
          <CardDescription>
            A read-only log of the legal terms and policies you agreed to during enrollment or updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {acceptedAgreements.map((agreement, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{agreement.title}</p>
                    <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3" />
                      {agreement.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Version: {agreement.version}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Accepted on:</span>{" "}
                    {new Date(agreement.acceptedOn).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
