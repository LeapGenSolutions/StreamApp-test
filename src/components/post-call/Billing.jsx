import { fetchBillingByAppointment } from "../../api/billingcodes";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { BACKEND_URL } from "../../constants";
import ReactMarkdown from 'react-markdown';

const Billing = ({ appointmentId }) => {
  const username = useSelector((state) => state.me.me.email);
  const queryKey = ["billing-codes", appointmentId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchBillingByAppointment(`${username}_${appointmentId}_billing`, username),
  });

  const [billingCodes, setBillingCodes] = useState("");
  const [originalCodes, setOriginalCodes] = useState("");

  useEffect(() => {
    if (data?.data?.billing_codes) {
      setBillingCodes(data.data.billing_codes);
      setOriginalCodes(data.data.billing_codes); // Track original to detect changes
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (newCodes) => {
      const response = await fetch(`${BACKEND_URL}api/billing/${appointmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: username,
          billing_codes: newCodes,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save billing codes");
      }
      return response.json();
    },
    onSuccess: () => {
      setOriginalCodes(billingCodes); // Update original to match new value
      alert("Billing codes saved successfully.");
    },
    onError: () => {
      alert("Failed to save billing codes.");
    },
  });

  const handleSave = () => {
    if (billingCodes !== originalCodes) {
      mutation.mutate(billingCodes);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <ReactMarkdown>{originalCodes}</ReactMarkdown>
      </div>
      <label className="block text-sm font-medium text-gray-700">Billing Codes</label>
      <textarea
        className="w-full border border-gray-300 rounded p-2"
        rows={6}
        value={billingCodes}
        onChange={(e) => setBillingCodes(e.target.value)}
        placeholder="Enter billing codes (e.g., CPT: 99213, ICD-10: E11.9)"
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSave}
        disabled={mutation.isLoading || isLoading || billingCodes === originalCodes}
      >
        {mutation.isLoading ? "Saving..." : "Save Billing Codes"}
      </button>
    </div>
  );
};

export default Billing;
