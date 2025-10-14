import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchSoapNotes, updateSoapNotes } from "../../api/soap";
import LoadingCard from "./LoadingCard";
import SubjectiveSection from "./sections/SubjectiveSection";
import ObjectiveSection from "./sections/ObjectiveSection";
import AssessmentPlanSection from "./sections/AssessmentPlanSection";
import { parseSubjective } from "./utils/soapUtils";

const Soap = ({ appointmentId, username }) => {
  const [soapNotes, setSoapNotes] = useState({
    HPI: "",
    ROS: "",
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
      const patientMatch = raw.match(/Patient:.*?\n/);
      const reasonMatch = raw.match(/Reason for Visit -.*?\n/);
      const subjectiveMatch = raw.match(/Subjective -([\s\S]*?)(?=\n\nObjective -)/);
      const objectiveMatch = raw.match(/Objective -([\s\S]*?)(?=\n\nAssessment -)/);
      const assessmentMatch = raw.match(/Assessment -([\s\S]*?)(?=\n\nPlan -)/);
      const planMatch = raw.match(/Plan -([\s\S]*)$/);

      const subjRaw = (subjectiveMatch?.[1] || "").trim();
      const { hpi, ros } = parseSubjective(subjRaw);

      const reasonText = (reasonMatch?.[0]?.replace("Reason for Visit -", "").trim() || "")
        .replace(/^Patient presents with\s*/i, "")
        .replace(/^Patient reports\s*/i, "")
        .trim();

      let objectiveText = (objectiveMatch?.[1] || "").trim();
      let objectiveJson = "{}";
      try {
        const jsonPart = objectiveText.match(/{[\s\S]*}/);
        if (jsonPart) objectiveJson = jsonPart[0];
      } catch {
        objectiveJson = "{}";
      }

      const parsed = {
        HPI: hpi,
        ROS: ros,
        Objective: objectiveJson,
        Assessment: (assessmentMatch?.[1] || "").trim(),
        Plan: (planMatch?.[1] || "").trim(),
      };

      setPatientLine(patientMatch?.[0]?.replace("Patient: ", "").trim() || "");
      setReasonLine(reasonText);
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
    onError: () => alert("Failed to save SOAP notes."),
  });

  const handleSave = () => {
    const subjectiveBlock = `${soapNotes.HPI}\n\nROS - ${soapNotes.ROS}`;
    const combined = `Patient: ${patientLine}\n\nReason for Visit - ${reasonLine}\n\nSubjective - ${subjectiveBlock}\n\nObjective - ${soapNotes.Objective}\n\nAssessment - ${soapNotes.Assessment}\n\nPlan - ${soapNotes.Plan}`;
    mutation.mutate(combined);
  };

  const handleCancel = () => {
    setSoapNotes(initialNotes);
    setIsEditing(false);
  };

  if (isLoading) return <LoadingCard message="Loading SOAP..." />;
  if (error) return <LoadingCard />;

  return (
    <div className="space-y-6 text-gray-900 leading-snug">
      <h3 className="font-semibold text-black text-lg">SOAP Notes</h3>

      {/* Subjective */}
      <SubjectiveSection
        isEditing={isEditing}
        patientLine={patientLine}
        reasonLine={reasonLine}
        soapNotes={soapNotes}
        setPatientLine={setPatientLine}
        setReasonLine={setReasonLine}
        setSoapNotes={setSoapNotes}
      />

      {/* Objective */}
      <ObjectiveSection
        isEditing={isEditing}
        soapNotes={soapNotes}
        setSoapNotes={setSoapNotes}
      />

      {/* Assessment & Plan */}
      <AssessmentPlanSection
        isEditing={isEditing}
        soapNotes={soapNotes}
        setSoapNotes={setSoapNotes}
        patientLine={patientLine}
        reasonLine={reasonLine}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
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
