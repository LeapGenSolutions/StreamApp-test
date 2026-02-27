import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "../../hooks/use-toast";

const sanitizePhoneInput = (value) => (value || "").replace(/\D/g, "").slice(0, 10);

function AdvancedSearch({ submitHandler }) {
  const { toast } = useToast();
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState({
    dateOfBirth: null,
    phoneNumber: "",
    email: "",
  });
  const [phoneError, setPhoneError] = useState("");

  const onResetHandler = () => {
    const resetQuery = {
      dateOfBirth: null,
      phoneNumber: "",
      email: "",
    };
    setPhoneError("");
    setAdvancedSearchQuery(resetQuery);
    submitHandler(resetQuery); 
  };

  const onSubmitHandler = () => {
    if (
      advancedSearchQuery.phoneNumber &&
      advancedSearchQuery.phoneNumber.length !== 10
    ) {
      const errorMessage = "Please enter a valid 10-digit phone number.";
      setPhoneError(errorMessage);
      toast({
        title: "Invalid phone number",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setPhoneError("");
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
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="Enter phone number..."
            value={advancedSearchQuery.phoneNumber}
            onChange={(e) =>
              {
                const sanitizedPhone = sanitizePhoneInput(e.target.value);
                setAdvancedSearchQuery({
                  ...advancedSearchQuery,
                  phoneNumber: sanitizedPhone,
                });
                if (!sanitizedPhone || sanitizedPhone.length === 10) {
                  setPhoneError("");
                }
              }
            }
          />
          {phoneError && (
            <p className="mt-1 text-xs text-red-600">{phoneError}</p>
          )}
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
