import { useEffect, useState } from "react";
import { PageNavigation } from "../components/ui/page-navigation";
import { Skeleton } from "../components/ui/skeleton";
import ProfileTab from "../components/profile/ProfileTab";
import PreferencesTab from "../components/profile/PreferencesTab";
import LegalTab from "../components/profile/LegalTab";
import { useSelector } from "react-redux";
import { resolveUserNameParts } from "../lib/userName";

const TAB_OPTIONS = [
  { id: "profile", label: "My Profile" },
  { id: "preferences", label: "Preferences & Notifications" },
  { id: "legal", label: "Legal Acknowledgements" },
];

export default function ProfileSettings() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const me = useSelector((state) => state.me.me);

  useEffect(() => {
    document.title = "Profile & Settings - Seismic Connect";

    if (me && Object.keys(me).length > 0) {
      setLoading(true);
      setTimeout(() => {
        const { firstName, lastName, fullName } = resolveUserNameParts(me);

        setProfileData({
          id: me.doctor_id || me.id || "user-dynamic",
          firstName: firstName || fullName || "",
          middleName: "",
          lastName: lastName,
          primaryEmail: me.email || "",
          secondaryEmail: me.secondaryEmail || "",
          role: me.role || "Doctor",
          accountType: "Clinic",
          npiNumber: me.npiNumber || "",
          specialty: me.specialization || me.specialty || "",
          subSpecialty: "",
          statesOfLicense: me.statesOfLicense || [],
          licenseNumber: me.licenseNumber || "",
          clinicName: me.clinicName || "Unknown Clinic",
          clinicAddress: me.clinicAddress || "",
          clinicId: me.clinicId || "",
          createdAt: me.createdAt || me.created_at || new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          notifications: me.notifications || { email: true, sms: false },
          timeZone: me.timeZone || "America/Los_Angeles",
          security: {
            authenticationMethod: "Single sign-on",
            passwordManagedBy: "Clinic identity provider",
            sessionProtection: "Audit-safe controls enabled",
          }
        });
        setLoading(false);
      }, 400);
    }
  }, [me]);

  if (loading) {
    return (
      <div className="space-y-4 px-2 pb-4">
        <PageNavigation title="My Profile" />
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 pb-4">
      <PageNavigation
        title="Profile & Settings"
        subtitle="Review your registered details and configure system preferences."
      />

      <div className="mb-6 flex space-x-6 border-b border-gray-200">
        {TAB_OPTIONS.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer border-b-2 px-1 pb-4 text-sm font-medium ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="focus-visible:outline-none focus-visible:ring-0">
        {activeTab === "profile" && <ProfileTab profileData={profileData} setProfileData={setProfileData} />}
        {activeTab === "preferences" && <PreferencesTab profileData={profileData} setProfileData={setProfileData} />}
        {activeTab === "legal" && <LegalTab profileData={profileData} />}
      </div>
    </div>
  );
}
