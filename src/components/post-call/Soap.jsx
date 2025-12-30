import { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchSoapNotes, updateSoapNotes } from "../../api/soap";
import LoadingCard from "./LoadingCard";
import SubjectiveSection from "./sections/SubjectiveSection";
import ObjectiveSection from "./sections/ObjectiveSection";
import AssessmentPlanSection from "./sections/AssessmentPlanSection";

const Soap = ({ appointmentId, username }) => {
  const [soapNotes, setSoapNotes] = useState({
    patient: "",
    subjective: {},
    objective: {},
    assessmentAndPlan: {},
  });

  const [isEditing, setIsEditing] = useState(false);
  const [, setRawFromServer] = useState("");

  // eslint-disable-next-line 
  const controlCharRegex = useMemo(() => new RegExp("[\\x00-\\x1F]+", "g"), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["soap-notes", appointmentId, username],
    queryFn: () => fetchSoapNotes(`${username}_${appointmentId}_soap`, username),
  });

  useEffect(() => {
    if (data?.data?.soap_notes && !isLoading) {
      const raw = data.data.soap_notes;
      setRawFromServer(raw);

      // --- Extract text sections ---
      const patientMatch = raw.match(/Patient:\s*(.*?)\n/);
      const reasonMatch = raw.match(/Reason for Visit -([\s\S]*?)(?=\n\nSubjective -)/);
      const subjectiveMatch = raw.match(/Subjective -([\s\S]*?)(?=\n\nFamily history discussed)/);
      const familyHistoryMatch = raw.match(/Family history discussed in this appointment -([\s\S]*?)(?=\n\nSurgical history discussed)/);
      const surgicalHistoryMatch = raw.match(/Surgical history discussed in this appointment -([\s\S]*?)(?=\n\nSocial history discussed)/);
      const socialHistoryMatch = raw.match(/Social history discussed in this appointment -([\s\S]*?)(?=\n\nReview of Systems)/);
      const rosMatch = raw.match(/Review of Systems(?:\s*\(ROS\))?:\s*([\s\S]*?)(?=\n\nObjective -)/);
      const objectiveMatch = raw.match(/Objective -([\s\S]*?)(?=\n\nAssessment and Plan -)/);
      const assessmentPlanMatch = raw.match(/Assessment and Plan -([\s\S]*)$/);

      // --- Parse JSON sections ---
      let objectiveJSON = {};
      let assessmentPlanJSON = {};

      try {
        const objRaw = objectiveMatch?.[1]?.trim();
        if (objRaw && objRaw.includes("{") && objRaw.includes("}")) {
          const startIdx = objRaw.indexOf("{");
          const endIdx = objRaw.lastIndexOf("}");
          const jsonString = objRaw
            .slice(startIdx, endIdx + 1)
            .replace(controlCharRegex, "")
            .replace(/\\n/g, "\\n");
          objectiveJSON = JSON.parse(jsonString);
        }
      } catch (err) {
        console.warn("Objective JSON parse error:", err.message);
        objectiveJSON = {};
      }

      try {
        const apRaw = assessmentPlanMatch?.[1]?.trim();
        if (apRaw && apRaw.includes("{") && apRaw.includes("}")) {
          const startIdx = apRaw.indexOf("{");
          const endIdx = apRaw.lastIndexOf("}");
          const jsonString = apRaw
            .slice(startIdx, endIdx + 1)
            .replace(controlCharRegex, "")
            .replace(/\\n/g, "\\n");
          assessmentPlanJSON = JSON.parse(jsonString);
        } else {
          console.warn("Assessment & Plan section missing JSON structure.");
        }
      } catch (err) {
        console.warn("Assessment & Plan JSON parse error:", err.message);
        assessmentPlanJSON = {};
      }

      // --- Clean chief complaint ---
      const rawReason = (reasonMatch?.[1] || "").trim();
      const cleanedComplaint = rawReason
        .replace(/^(The\s*)?(Patient|Pt)\s*(presents|reports)\s*(with\s*)?/i, "")
        .trim();
      const formattedComplaint = cleanedComplaint
        ? cleanedComplaint.charAt(0).toUpperCase() + cleanedComplaint.slice(1)
        : "";

      // --- Format patient info ---
      const rawPatient = patientMatch?.[1]?.trim() || "";
      let formattedPatient = rawPatient;
      try {
        const match = rawPatient.match(/(.*?),\s*(\d+)\s*years old,\s*(F|M)/i);
        if (match) {
          const [, name, age, gender] = match;
          const genderFull =
            gender.toUpperCase() === "F"
              ? "Female"
              : gender.toUpperCase() === "M"
              ? "Male"
              : "";
          formattedPatient = `${name.trim()}, ${age.trim()}-year-old ${genderFull}`;
        }
      } catch {
        formattedPatient = rawPatient;
      }

      // --- Build final structured object ---
      setSoapNotes({
        patient: formattedPatient,
        subjective: {
          chief_complaint: formattedComplaint,
          hpi: (subjectiveMatch?.[1] || "").trim(),
          family_history: (familyHistoryMatch?.[1] || "").trim(),
          surgical_history: (surgicalHistoryMatch?.[1] || "").trim(),
          social_history: (socialHistoryMatch?.[1] || "").trim(),
          ros: (rosMatch?.[1] || "").trim(),
        },
        objective: objectiveJSON,
        assessmentAndPlan: assessmentPlanJSON,
      });
    }
  }, [data, isLoading, controlCharRegex]);

  //  Save mutation logic remains same
  const mutation = useMutation({
    mutationFn: (updatedNotes) =>
      updateSoapNotes(`${username}_${appointmentId}_soap`, username, updatedNotes),
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
    onError: () => alert("Failed to save SOAP notes."),
  });

  const buildRawSoap = useMemo(() => {
    return (state) => {
      const {
        patient,
        subjective: { chief_complaint, hpi, family_history, surgical_history, social_history, ros },
        objective,
        assessmentAndPlan,
      } = state;

      const patientLine = patient ? `Patient: ${patient}` : "";
      const reasonLine = chief_complaint ? `Reason for Visit - ${chief_complaint}` : "";
      const subjBlock = `Subjective - ${hpi || ""}`;
      const famBlock = `Family history discussed in this appointment - ${
        family_history || "Not discussed"
      }`;
      const surgBlock = `Surgical history discussed in this appointment - ${
        surgical_history || "Not discussed"
      }`;
      const socialBlock = `Social history discussed in this appointment - ${
        social_history || "Not discussed"
      }`;
      const rosBlock = ros ? `Review of Systems:\n${ros}` : "Review of Systems:\n";
      const objectiveBlock = `Objective - ${JSON.stringify(objective || {}, null, 2)}`;
      const apBlock = `Assessment and Plan - ${JSON.stringify(
        assessmentAndPlan || {},
        null,
        2
      )}`;

      return [
        patientLine,
        "",
        reasonLine,
        "",
        subjBlock,
        "",
        famBlock,
        "",
        surgBlock,
        "",
        socialBlock,
        "",
        rosBlock,
        "",
        objectiveBlock,
        "",
        apBlock,
      ].join("\n");
    };
  }, []);

  const handleSave = async () => {
    const rawOut = buildRawSoap(soapNotes);
    mutation.mutate(rawOut);
  };

  const handleCancel = () => {
    setIsEditing(false);
    refetch();
  };

  if (isLoading) return <LoadingCard message="Loading SOAP..." />;
  if (error) return <LoadingCard />;

  return (
    <div className="space-y-6 text-gray-900 leading-snug">
      <h3 className="font-semibold text-black text-lg">SOAP Notes</h3>

      <div className="space-y-6 divide-y divide-gray-300">
        {soapNotes.patient && (
          <div className="pb-2">
            <p className="text-base font-medium text-gray-900">{soapNotes.patient}</p>
          </div>
        )}

        <SubjectiveSection
          soapNotes={soapNotes}
          setSoapNotes={setSoapNotes}
          isEditing={isEditing}
        />
        <ObjectiveSection
          soapNotes={soapNotes}
          setSoapNotes={setSoapNotes}
          isEditing={isEditing}
        />
        <AssessmentPlanSection
          soapNotes={soapNotes}
          setSoapNotes={setSoapNotes}
          isEditing={isEditing}
        />
      </div>

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
