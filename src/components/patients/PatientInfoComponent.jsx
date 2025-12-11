import {
  User,
  Phone,
  Mail,
  IdCard,
  Calendar,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

const PatientInfoComponent = ({
  firstName,
  lastName,
  phone,
  email,
  insuranceProvider,
  insuranceId,
  lastVisit,
  totalAppointments,
  dob, 
}) => {
  const displayDob = dob || "Not Available";

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 w-full">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">
        Patient Information
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-gray-800">
        <p className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <strong>First Name:</strong> {firstName}
        </p>

        <p className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <strong>Last Name:</strong> {lastName}
        </p>

        <p className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <strong>Date of Birth:</strong> {displayDob}
        </p>

        <p className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-500" />
          <strong>Phone:</strong> {phone}
        </p>

        <p className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          <strong>Email:</strong> {email}
        </p>

        <p className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-500" />
          <strong>Insurance Provider:</strong> {insuranceProvider}
        </p>

        <p className="flex items-center gap-2">
          <IdCard className="w-4 h-4 text-gray-500" />
          <strong>Insurance ID:</strong> {insuranceId}
        </p>

        <p className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <strong>Last Visit:</strong> {lastVisit}
        </p>

        <p className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          <strong>Total Visits:</strong> {totalAppointments}
        </p>
      </div>
    </div>
  );
};

export default PatientInfoComponent