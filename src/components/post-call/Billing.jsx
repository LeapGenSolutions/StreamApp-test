import { fetchBillingByAppointment, updateBillingByAppointment } from "../../api/billingcodes";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import ReactMarkdown from "react-markdown";
import LoadingCard from "./LoadingCard"; 

const Billing = ({ appointmentId, username }) => {
  const queryKey = ["billing-codes", appointmentId, username];
  const [isEditing, setIsEditing] = useState(false);
  const [billingCodes, setBillingCodes] = useState("");
  const [amaCptCandidates, setAmaCptCandidates] = useState([]);

  const { data, isLoading, refetch, error } = useQuery({
    queryKey,
    queryFn: () => fetchBillingByAppointment(`${username}_${appointmentId}_billing`, username),
  });


useEffect(() => {
  // Backward compatible: some docs store markdown in billing_codes, others in engine_v1_gpt
  const combined = data?.data?.billing_codes || data?.data?.engine_v1_gpt || "";
  setBillingCodes(combined);

  // AMA CPT candidates (ai_search_v1)
  const candidates = data?.data?.engine_v2_search?.cpt_candidates;
  setAmaCptCandidates(Array.isArray(candidates) ? candidates : []);
}, [data]);

  const amaCptMarkdown =
    Array.isArray(amaCptCandidates) && amaCptCandidates.length > 0
      ? `CPT codes (AMA):\n\n${amaCptCandidates
          .filter(c => c?.code)
          .map(c => `- ${c.code}${c.reason ? `: ${c.reason}` : ""}`)
          .join("\n")}\n\n`
      : "";

  const displayBillingCodes = `${amaCptMarkdown}${billingCodes || ""}`;

  const mutation = useMutation({
    mutationFn: (updatedCodes) =>
      updateBillingByAppointment(`${username}_${appointmentId}_billing`, username, updatedCodes),
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
    onError: () => {
      console.log("Failed to save billing codes.");
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!billingCodes || billingCodes.trim() === "") {
      alert("Billing code cannot be empty.");
      return;
    }

    mutation.mutate(billingCodes);
  };

  // how loading screen
  if (isLoading) {
    return <LoadingCard message="Running the diagnosis-to-dollars pipeline… Billing Codes coming right up!" />;
  }

  // Error fallback
  if(error){
    return <LoadingCard />;
  }

  return (
    <div className="space-y-4">
      {!isEditing && (
        <>
          <ReactMarkdown>{displayBillingCodes}</ReactMarkdown>
          <button
            onClick={handleEditClick}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Edit
          </button>
        </>
      )}

      {isEditing && (
        <>
          <label className="block text-sm font-medium text-gray-700">Edit Billing Codes</label>
          <textarea
            className="w-full border border-gray-300 rounded p-2"
            rows={6}
            value={billingCodes}
            onChange={(e) => setBillingCodes(e.target.value)}
            placeholder="Enter billing codes (e.g., CPT: 99213, ICD-10: E11.9)"
          />
          <div className="flex gap-4 mt-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBillingCodes(data?.data?.billing_codes || data?.data?.engine_v1_gpt || ""); // reset to backend value
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;