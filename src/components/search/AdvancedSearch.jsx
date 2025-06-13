import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { format } from "date-fns";

function AdvancedSearch({ submitHandler }) {
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState({
    dateOfBirth: null,
    insuranceProvider: "",
    insuranceId: "",
    phoneNumber: "",
    email: "",
    ssn: "",
  });

  const onResetHandler = () => {
    const resetQuery = {
      dateOfBirth: null,
      insuranceProvider: "",
      insuranceId: "",
      phoneNumber: "",
      email: "",
      ssn: "",
    };
    setAdvancedSearchQuery(resetQuery);
    submitHandler(resetQuery); // Reset the search results
  };

  const onSubmitHandler = () => {
    const payload = {
      ...advancedSearchQuery,
      dateOfBirth: advancedSearchQuery.dateOfBirth
        ? format(new Date(advancedSearchQuery.dateOfBirth), "dd-MM-yyyy").toString()
        : null,
    };
    submitHandler(payload);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      <div>
        <Label>Date of Birth</Label>
        <Input
          type="date"
          value={
            advancedSearchQuery.dateOfBirth
              ? new Date(advancedSearchQuery.dateOfBirth)
                  .toISOString()
                  .split("T")[0]
              : ""
          }
          onChange={(e) =>
            setAdvancedSearchQuery({
              ...advancedSearchQuery,
              dateOfBirth: e.target.value,
            })
          }
        />
      </div>
      <div>
        <Label>Insurance Provider</Label>
        <Input
          placeholder="Enter insurance provider..."
          value={advancedSearchQuery.insuranceProvider || ""}
          onChange={(e) =>
            setAdvancedSearchQuery({
              ...advancedSearchQuery,
              insuranceProvider: e.target.value,
            })
          }
        />
      </div>
      <div>
        <Label>Insurance ID</Label>
        <Input
          placeholder="Enter insurance ID..."
          value={advancedSearchQuery.insuranceId || ""}
          onChange={(e) =>
            setAdvancedSearchQuery({
              ...advancedSearchQuery,
              insuranceId: e.target.value,
            })
          }
        />
      </div>
      <div>
        <Label>Phone Number</Label>
        <Input
          placeholder="Enter phone number..."
          value={advancedSearchQuery.phoneNumber || ""}
          onChange={(e) =>
            setAdvancedSearchQuery({
              ...advancedSearchQuery,
              phoneNumber: e.target.value,
            })
          }
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter email..."
          value={advancedSearchQuery.email || ""}
          onChange={(e) =>
            setAdvancedSearchQuery({
              ...advancedSearchQuery,
              email: e.target.value,
            })
          }
        />
      </div>
      <div>
        <Label>SSN</Label>
        <Input
          placeholder="Enter SSN..."
          value={advancedSearchQuery.ssn || ""}
          onChange={(e) =>
            setAdvancedSearchQuery({
              ...advancedSearchQuery,
              ssn: e.target.value,
            })
          }
        />
      </div>
      <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2">
        <Button variant="outline" onClick={onResetHandler}>
          Reset
        </Button>
        <Button onClick={onSubmitHandler}>Search</Button>
      </div>
    </div>
  );
}

export default AdvancedSearch;