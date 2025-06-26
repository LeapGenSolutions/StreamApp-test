import { User, Fingerprint, UserRound, Calendar, ClipboardList } from "lucide-react";

const PatientInfoComponent = ({ firstName, lastName, maskedSSN, patient, lastVisit, filteredAppointments }) => (
  <div className="bg-white border border-gray-300 rounded-xl shadow p-6 mb-6 w-full">
    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Patient Info</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-gray-800">
      <p className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /><strong>First Name:</strong> {firstName}</p>
      <p className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /><strong>Last Name:</strong> {lastName}</p>
      <p className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-gray-500" /><strong>SSN:</strong> {maskedSSN}</p>
      <p className="flex items-center gap-2"><UserRound className="w-4 h-4 text-gray-500" /><strong>Full Name:</strong> {firstName+" "+lastName}</p>
      <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /><strong>Last Visit:</strong> {lastVisit}</p>
      <p className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-500" /><strong>Total Appointments:</strong> {filteredAppointments.length}</p>
    </div>
  </div>
);

export default PatientInfoComponent;
