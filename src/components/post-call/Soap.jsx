import { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchSoapNotes, updateSoapNotes } from "../../api/soap";
import LoadingCard from "./LoadingCard";
import SubjectiveSection from "./sections/SubjectiveSection";
import ObjectiveSection from "./sections/ObjectiveSection";
import AssessmentPlanSection from "./sections/AssessmentPlanSection";


const SECTION_TITLES = [
  "Procedure Information",
  "Anesthesia / Analgesia",
  "Preparation & Equipment",
  "Procedure Description",
  "Post-Procedure Assessment",
  "Discharge Instructions",
   "Provider Attestation",
];


const ProcedureNotesSection = ({ content }) => {
  if (!content) {
    return (
      <p className="text-sm text-black-500 italic">
        No procedure notes available.
      </p>
    );
  }

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (line) =>
        line &&
        line.toLowerCase() !== "procedure_notes -" &&
        line.toLowerCase() !== "procedure note" &&
        !line.toLowerCase().includes("provider attestation")
    );

  const sections = [];
  let current = null;

  lines.forEach((line) => {
    if (SECTION_TITLES.includes(line)) {
      current = { title: line, items: [] };
      sections.push(current);
      return;
    }

    if (!current) {
      current = { title: "Procedure Notes", items: [] };
      sections.push(current);
    }

    current.items.push(line);
  });

  const isCalloutSection = (title) =>
    title === "Procedure Description";

  const renderLine = (line, idx) => {
    if (line.includes(":")) {
      const [label, ...rest] = line.split(":");
      const value = rest.join(":").trim();

      return (
        <div key={idx} className="grid grid-cols-12 gap-6 py-2">
          <div className="col-span-4 text-sm font-medium text-black-700">
            {label}
          </div>
          <div className="col-span-8 text-sm text-black-900">
            {value || "—"}
          </div>
        </div>
      );
    }

    return (
      <p key={idx} className="text-sm text-black-800 leading-relaxed py-1">
        {line}
      </p>
    );
  };

  return (
    <div className="space-y-10">
      {sections.map((section, idx) => (
        <div key={idx} className="pb-6 border-b border-black-200">
          <h4 className="text-blue-600 font-semibold text-lg mb-4">
            {section.title}
          </h4>

          {isCalloutSection(section.title) ? (
            <div className="bg-gray-50 border-l-4 border-blue-300 rounded-md p-4 space-y-2">
              {section.items.map((line, i) => (
                <p
                  key={i}
                  className="text-sm text-black-800 leading-relaxed"
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-black-100">
              {section.items.map((line, i) => renderLine(line, i))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ---------------- Main SOAP ---------------- */
const Soap = ({ appointmentId, username }) => {
  const [soapNotes, setSoapNotes] = useState({
    patient: "",
    subjective: {},
    objective: {},
    assessmentAndPlan: {},
  });

  const [procedureNotes, setProcedureNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("soap");

  // eslint-disable-next-line no-control-regex
  const controlCharRegex = useMemo(
    // eslint-disable-next-line no-control-regex
    () => new RegExp("[\\x00-\\x1F]+", "g"),
    []
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["soap-notes", appointmentId, username],
    queryFn: () =>
      fetchSoapNotes(`${username}_${appointmentId}_soap`, username),
  });

  useEffect(() => {
    if (!data?.data?.soap_notes) return;

    const raw = data.data.soap_notes;
    const [soapPart, procedurePart = ""] =
      raw.split("procedure_notes -");

    setProcedureNotes(procedurePart.trim());

    const patientMatch = soapPart.match(/Patient:\s*(.*?)\n/);
    const reasonMatch = soapPart.match(
      /Reason for Visit -([\s\S]*?)(?=\n\nSubjective -)/
    );
    const subjectiveMatch = soapPart.match(
      /Subjective -([\s\S]*?)(?=\n\nFamily history discussed)/
    );
    const familyHistoryMatch = soapPart.match(
      /Family history discussed in this appointment -([\s\S]*?)(?=\n\nSurgical history discussed)/
    );
    const surgicalHistoryMatch = soapPart.match(
      /Surgical history discussed in this appointment -([\s\S]*?)(?=\n\nSocial history discussed)/
    );
    const socialHistoryMatch = soapPart.match(
      /Social history discussed in this appointment -([\s\S]*?)(?=\n\nReview of Systems)/
    );
    const rosMatch = soapPart.match(
      /Review of Systems(?:\s*\(ROS\))?:\s*([\s\S]*?)(?=\n\nObjective -)/
    );
    const objectiveMatch = soapPart.match(
      /Objective -([\s\S]*?)(?=\n\nAssessment and Plan -)/
    );
    const assessmentPlanMatch = soapPart.match(
      /Assessment and Plan -([\s\S]*)$/
    );

    let objectiveJSON = {};
    let assessmentPlanJSON = {};

    try {
      const objRaw = objectiveMatch?.[1];
      if (objRaw?.includes("{")) {
        objectiveJSON = JSON.parse(
          objRaw
            .slice(objRaw.indexOf("{"), objRaw.lastIndexOf("}") + 1)
            .replace(controlCharRegex, "")
        );
      }
    } catch {}

    try {
      const apRaw = assessmentPlanMatch?.[1];
      if (apRaw?.includes("{")) {
        assessmentPlanJSON = JSON.parse(
          apRaw
            .slice(apRaw.indexOf("{"), apRaw.lastIndexOf("}") + 1)
            .replace(controlCharRegex, "")
        );
      }
    } catch {}

    setSoapNotes({
      patient: patientMatch?.[1] || "",
      subjective: {
        chief_complaint: (reasonMatch?.[1] || "").trim(),
        hpi: (subjectiveMatch?.[1] || "").trim(),
        family_history: (familyHistoryMatch?.[1] || "").trim(),
        surgical_history: (surgicalHistoryMatch?.[1] || "").trim(),
        social_history: (socialHistoryMatch?.[1] || "").trim(),
        ros: (rosMatch?.[1] || "").trim(),
      },
      objective: objectiveJSON,
      assessmentAndPlan: assessmentPlanJSON,
    });
  }, [data, controlCharRegex]);

  const mutation = useMutation({
    mutationFn: (updatedNotes) =>
      updateSoapNotes(
        `${username}_${appointmentId}_soap`,
        username,
        updatedNotes
      ),
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
  });

  const buildRawSoap = useMemo(
    () => (state) =>
      [
        state.patient ? `Patient: ${state.patient}` : "",
        "",
        `Reason for Visit - ${state.subjective.chief_complaint || ""}`,
        "",
        `Subjective - ${state.subjective.hpi || ""}`,
        "",
        `Objective - ${JSON.stringify(state.objective || {}, null, 2)}`,
        "",
        `Assessment and Plan - ${JSON.stringify(
          state.assessmentAndPlan || {},
          null,
          2
        )}`,
        procedureNotes ? `\n\nprocedure_notes - ${procedureNotes}` : "",
      ].join("\n"),
    [procedureNotes]
  );

  if (isLoading) return <LoadingCard message="Loading SOAP..." />;
  if (error) return <LoadingCard />;

  return (
    <div className="space-y-6 text-black-900">
      <h3 className="text-lg font-semibold">Clinical Documentation</h3>

      <div className="flex gap-3">
        {["soap", "procedure"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md text-sm font-medium border ${
              activeTab === tab
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-black-700 border-black-300"
            }`}
          >
            {tab === "soap" ? "SOAP" : "Procedure Notes"}
          </button>
        ))}
      </div>

      {activeTab === "soap" ? (
        <>
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            ) : (
              <>
                <Button
                  onClick={() => mutation.mutate(buildRawSoap(soapNotes))}
                >
                  Save
                </Button>
                <Button variant="secondary" onClick={refetch}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </>
      ) : (
        <ProcedureNotesSection content={procedureNotes} />
      )}
    </div>
  );
};

export default Soap