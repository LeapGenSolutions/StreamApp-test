import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchSoapNotes, updateSoapNotes } from "../../api/soap";
import LoadingCard from "./LoadingCard"; // Adjust path if needed

const extractBullets = (text) => {
  if (!text) return [];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  return text
    .split(/(?<=[.?!])\s+(?=[A-Z])|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 5);
};

const Soap = ({ appointmentId, username }) => {
  const [soapNotes, setSoapNotes] = useState({
    Subjective: "",
    Objective: "",
    Assessment: "",
    Plan: "",
  });
  const [initialNotes, setInitialNotes] = useState(null);
  const [patientLine, setPatientLine] = useState("");
  const [reasonLine, setReasonLine] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["soap-notes", appointmentId, username],
    queryFn: () => fetchSoapNotes(`${username}_${appointmentId}_soap`, username),
  });

  useEffect(() => {
    if (data && !isLoading) {
      const raw = data?.data?.soap_notes || "";

      // Extract all parts using regex
      const patientMatch = raw.match(/Patient:.*?\n/);
      const reasonMatch = raw.match(/Reason for Visit -.*?\n/);
      const subjectiveMatch = raw.match(/Subjective -([\s\S]*?)(?=\n\nObjective -)/);
      const objectiveMatch = raw.match(/Objective -([\s\S]*?)(?=\n\nAssessment -)/);
      const assessmentMatch = raw.match(/Assessment -([\s\S]*?)(?=\n\nPlan -)/);
      const planMatch = raw.match(/Plan -([\s\S]*)$/);

      setPatientLine(patientMatch?.[0]?.trim() || "");
      setReasonLine(reasonMatch?.[0]?.trim() || "");

      const parsed = {
        Subjective: (subjectiveMatch?.[1] || "").trim(),
        Objective: (objectiveMatch?.[1] || "").trim(),
        Assessment: (assessmentMatch?.[1] || "").trim(),
        Plan: (planMatch?.[1] || "").trim(),
      };

      setSoapNotes(parsed);
      setInitialNotes(parsed);
    }
  }, [data, isLoading]);

  const mutation = useMutation({
    mutationFn: (updatedNotes) =>
      updateSoapNotes(`${username}_${appointmentId}_soap`, username, updatedNotes),
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
    onError: () => {
      alert("❌ Failed to save SOAP notes. Please try again.");
    },
  });

  const handleSave = () => {
    const combined = `${patientLine}\n\n${reasonLine}\n\nSubjective - ${soapNotes.Subjective}\n\nObjective - ${soapNotes.Objective}\n\nAssessment - ${soapNotes.Assessment}\n\nPlan - ${soapNotes.Plan}`;
    mutation.mutate(combined);
  };

  const handleCancel = () => {
    setSoapNotes(initialNotes);
    setIsEditing(false);
  };

  if (isLoading) {
    return <LoadingCard message="Your SOAP’s lathering... please hold." />;
  }

  if (error) {
    return <LoadingCard />;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">SOAP Notes</h3>

      <Accordion type="single" collapsible className="mb-6">
        {["Subjective", "Objective", "Assessment", "Plan"].map((section) => (
          <AccordionItem value={section} key={section}>
            <AccordionTrigger className="text-blue-700 font-semibold text-lg">
              {section}
            </AccordionTrigger>
            <AccordionContent
              className={`rounded-md p-4 ${isEditing ? "bg-white" : "bg-gray-100"}`}
            >
              {/* Show Subjective with patient + reason */}
             {section === "Subjective" ? (
              isEditing ? (
                <div className="space-y-2">
                <p className="font-semibold">{patientLine}</p>
                  <Textarea
                    className="w-full mt-2 border border-gray-300 rounded"
                    placeholder="Enter reason for visit..."
                    value={reasonLine}
                    onChange={(e) => setReasonLine(e.target.value)}
                    rows={2}
                  />
                  <Textarea
                    className="w-full mt-2 border border-gray-300 rounded"
                    placeholder="Enter subjective notes..."
                    value={soapNotes.Subjective}
                    onChange={(e) =>
                      setSoapNotes({ ...soapNotes, Subjective: e.target.value })
                    }
                    rows={4}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold">{patientLine}</p>
                  <p className="font-semibold">{reasonLine}</p>
                  <p>{soapNotes.Subjective}</p>
                </div>
              )
            ) : section === "Plan" && !isEditing ? (
              <ul className="list-disc ml-6 space-y-2">
                {extractBullets(soapNotes.Plan).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <Textarea
                className={`w-full mt-2 border rounded ${
                  isEditing ? "bg-white border-gray-300" : "bg-gray-100 border-gray-200"
                }`}
                placeholder={`Enter ${section.toLowerCase()}...`}
                value={soapNotes[section]}
                onChange={(e) =>
                  setSoapNotes({ ...soapNotes, [section]: e.target.value })
                }
                rows={4}
                readOnly={!isEditing}
              />
            )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-end gap-3">
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-600 text-white hover:bg-yellow-700"
          >
            Edit
          </Button>
        ) : (
          <>
            <Button
              onClick={handleSave}
              disabled={mutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {mutation.isLoading ? "Saving..." : "Save SOAP Notes"}
            </Button>
            <Button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Soap
