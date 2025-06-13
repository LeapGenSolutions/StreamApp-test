import { useEffect, useState } from "react";
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
import { Badge } from "../components/ui/badge";
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  FileText,
} from "lucide-react";
import AdvancedSearch from "../components/search/AdvancedSearch";
import { format } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchPatientsDetails } from "../redux/patient-actions";
import { Link } from "wouter";
import { navigate } from "wouter/use-browser-location";

function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const dispatch = useDispatch();
  const patients = useSelector((state) => state.patients.patients);
  const [showPatients, setShowPatients] = useState([]);

  useEffect(() => {
    dispatch(fetchPatientsDetails());
  }, [dispatch]);

  useEffect(() => {
    setShowPatients(patients);
  }, [patients]);

  useEffect(() => {
    document.title = "Patients - Seismic Connect";
  }, []);

  // Patient Search Logic
  const handleSearchChange = (e) => {
  const query = e.target.value;
  setSearchQuery(query);
  filterPatients(query);
};


  const filterPatients = (query) => {
  if (query === "") {
    setShowPatients(patients);
    return;
  }
  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(query.toLowerCase());
  });
  setShowPatients(filteredPatients);
};


  const advancedSearchHandler = (query) => {
    if (!query) { 
      filterPatients();
      return;
    }
      setShowPatients(
        patients.filter((p) => {
          // currently, the dateOfBirth, insurance Provider, insurance id, phone number, email is will not filter and show no partients found
          // because they are not provided in the patients object
          const dob = query?.dateOfBirth
            ? p?.date_of_birth
              ? p?.date_of_birth ===
                query.dateOfBirth
              : false
            : true;
          const email = query?.email
            ? p?.email
              ? p?.email.includes(query?.email.toLowerCase())
              : false
            : true;
          const insuranceId = query?.insuranceId
            ? p.insurance_id
              ? p?.insurance_id
                  .toLowerCase()
                  .includes(query?.insuranceId.toLowerCase())
              : false
            : true;
          const insuranceProvider = query?.insuranceProvider
            ? p?.insurance_provider
              ? p?.insurance_provider
                  .toLowerCase()
                  .includes(query.insuranceProvider.toLowerCase())
              : false
            : true;
          const phoneNumber = query.phoneNumber
            ? p?.phone_number
              ? p?.phone_number.includes(query.phoneNumber)
              : false
            : true;
          const ssn = query.ssn
            ? p?.ssn
              ? p?.ssn.toLowerCase().includes(query.ssn.toLowerCase())
              : false
            : true;

          return (
            dob &&
            email &&
            insuranceId &&
            insuranceProvider &&
            phoneNumber &&
            ssn
          );
        })
      );
  };

  return (
    <div className="space-y-6">
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
            <div className="flex-1">
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <p className="text-center text-gray-500 py-4">
                      No Patients Found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                showPatients?.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      {patient.first_name} {patient.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {patient.phone_number}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        {patient.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{patient.insurance_provider}</div>
                      <div className="text-sm text-gray-500">
                        {patient.insurance_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(
                          new Date(),
                          "MMM dd, yyyy"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          patient.insuranceVerified ? "success" : "warning"
                        }
                      >
                        {patient.insuranceVerified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Link href={`/patients/${patient.id}`}>
                          <Button
                            onClick={() => {
                              navigate(`/patients/${patient.id}`);
                            }}
                            variant="ghost"
                            size="icon"
                          >
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

export default Patients;