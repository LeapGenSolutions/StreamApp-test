import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  FileText,
} from "lucide-react";
import AdvancedSearch from "../components/search/AdvancedSearch";
import { format, parseISO } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchPatientsDetails } from "../redux/patient-actions";
import { fetchAppointmentDetails } from "../redux/appointment-actions"; 
import DoctorMultiSelect from "../components/DoctorMultiSelect";
import { Link } from "wouter";
import { PageNavigation } from "../components/ui/page-navigation";

function Patients() {
  const dispatch = useDispatch();
  const patients = useSelector((state) => state.patients.patients || []);
  const appointments = useSelector(
    (state) => state.appointments.appointments || []
  );

  const today = new Date().toISOString().split("T")[0]; 

  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showPatients, setShowPatients] = useState([]);
  const [appointmentFilters, setAppointmentFilters] = useState({
    selectedDoctors: [],
    startDate: today,
    endDate: today,
  });
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

  useEffect(() => {
    if (patients.length === 0) {
      dispatch(fetchPatientsDetails());
    }
    // eslint-disable-next-line
  }, [dispatch]);

  useEffect(() => {
    if (appointmentFilters.selectedDoctors.length > 0) {
      dispatch(fetchAppointmentDetails(appointmentFilters.selectedDoctors));
    } else {
      setShowPatients([]);
    }
  }, [appointmentFilters.selectedDoctors, dispatch]);

  const enrichPatients = useCallback(() => {
    const { selectedDoctors, startDate, endDate } = appointmentFilters;

    const filteredAppointments = appointments.filter((a) => {
      const matchDoctor =
        selectedDoctors.length === 0 ||
        selectedDoctors.includes(a.doctor_email);

      const apptDate = new Date(a.appointment_date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const matchDate =
        (!start || apptDate >= start) && (!end || apptDate <= end);

      return matchDoctor && matchDate;
    });

    const latestByPatient = {};

    filteredAppointments.forEach((appt) => {
      const patient = patients.find((p) => {
        const fullName = `${p.firstname} ${p.lastname}`.toLowerCase();
        return (
          appt.full_name?.toLowerCase() === fullName && appt.ssn === p.ssn
        );
      });

      if (patient) {
        const pid = patient.patient_id;
        if (
          !latestByPatient[pid] ||
          new Date(appt.appointment_date) >
            new Date(latestByPatient[pid].appointment.appointment_date)
        ) {
          latestByPatient[pid] = { patient, appointment: appt };
        }
      }
    });

    setShowPatients(
      Object.values(latestByPatient).map(({ patient, appointment }) => ({
        ...patient,
        lastVisit: parseISO(appointment.appointment_date),
        doctorName: appointment.doctor_email,
      }))
    );
  }, [patients, appointments, appointmentFilters]);

  useEffect(() => {
    if (patients.length && appointments.length) enrichPatients();
  }, [patients, appointments, enrichPatients]);

  const handleSearchChange = (e) => {
    const q = e.target.value.toLowerCase();
    setSearchQuery(q);

    if (!q) {
      enrichPatients();
      return;
    }

    setShowPatients((prev) =>
      prev.filter((p) =>
        `${p.firstname} ${p.lastname}`.toLowerCase().includes(q)
      )
    );
  };

  const advancedSearchHandler = (query) => {
    if (!query) {
      enrichPatients();
      return;
    }

    setShowPatients(
      patients.filter((p) => {
        const dobMatch = query.dateOfBirth ? p.dob === query.dateOfBirth : true;
        const emailMatch = query.email
          ? p.email?.toLowerCase().includes(query.email.toLowerCase())
          : true;
        const insIdMatch = query.insuranceId
          ? p.insurance_id?.toLowerCase().includes(query.insuranceId.toLowerCase())
          : true;
        const insProvMatch = query.insuranceProvider
          ? p.insurance_provider?.toLowerCase().includes(query.insuranceProvider.toLowerCase())
          : true;
        const phoneMatch = query.phoneNumber
          ? p.contactmobilephone?.includes(query.phoneNumber)
          : true;
        const ssnMatch = query.ssn
          ? p.ssn?.toLowerCase().includes(query.ssn.toLowerCase())
          : true;

        return (
          dobMatch &&
          emailMatch &&
          insIdMatch &&
          insProvMatch &&
          phoneMatch &&
          ssnMatch
        );
      })
    );
  };

  return (
    <div className="space-y-6">
      <PageNavigation 
        //title="Patients"
        //subtitle="View and manage patient records"
        showDate={false}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              className="flex-1"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch((s) => !s)}
            >
              Advanced Search
            </Button>
          </div>
          {showAdvancedSearch && (
            <AdvancedSearch submitHandler={advancedSearchHandler} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-1 text-sm font-medium">Doctor</label>
              <DoctorMultiSelect
                selectedDoctors={appointmentFilters.selectedDoctors}
                isDropdownOpen={isDoctorDropdownOpen}
                setDropdownOpen={setIsDoctorDropdownOpen}
                onDoctorSelect={(emails) =>
                  setAppointmentFilters((prev) => ({
                    ...prev,
                    selectedDoctors: emails,
                  }))
                }
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={appointmentFilters.startDate}
                onChange={(e) =>
                  setAppointmentFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={appointmentFilters.endDate}
                onChange={(e) =>
                  setAppointmentFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <p className="py-4 text-center text-gray-500">
                      No Patients Found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                showPatients?.map((patient) => (
                  <TableRow key={patient?.patient_id}>
                    <TableCell>{`${patient?.firstname} ${patient?.lastname}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {patient?.contactmobilephone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        {patient?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{patient?.insurance_provider}</div>
                      <div className="text-sm text-gray-500">
                        {patient?.insurance_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {patient?.lastVisit
                          ? format(parseISO(patient?.lastVisit.toISOString()), "MMM dd, yyyy")
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{patient?.doctorName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Link href={`/patients/${patient?.patient_id}`}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default Patients