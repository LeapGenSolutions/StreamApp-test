import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { format } from "date-fns";

function AdvancedSearch({ submitHandler }) {
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState({
    dateOfBirth: null,
    phoneNumber: "",
    email: "",
  });

  const onResetHandler = () => {
    const resetQuery = {
      dateOfBirth: null,
      phoneNumber: "",
      email: "",
    };
    setAdvancedSearchQuery(resetQuery);
    submitHandler(resetQuery); 
  };

  const onSubmitHandler = () => {
    const payload = {
      ...advancedSearchQuery,
      dateOfBirth: advancedSearchQuery.dateOfBirth
        ? format(new Date(advancedSearchQuery.dateOfBirth), "yyyy-MM-dd")
        : null,
    };
    submitHandler(payload);
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">

      {/* Header + Close Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Advanced Search
        </h3>

        <button
          type="button"
          onClick={() => submitHandler(null, "close")}
          className="text-sm text-blue-600 hover:underline"
        >
          Close Advanced Search
        </button>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
          <Label>Phone Number</Label>
          <Input
            placeholder="Enter phone number..."
            value={advancedSearchQuery.phoneNumber}
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
            placeholder="Enter email..."
            type="email"
            value={advancedSearchQuery.email}
            onChange={(e) =>
              setAdvancedSearchQuery({
                ...advancedSearchQuery,
                email: e.target.value,
              })
            }
          />
        </div>

      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onResetHandler}>
          Reset
        </Button>
        <Button onClick={onSubmitHandler}>Search</Button>
      </div>
    </div>
  );
}

export default AdvancedSearch