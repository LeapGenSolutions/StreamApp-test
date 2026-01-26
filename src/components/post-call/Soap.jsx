import { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchSoapNotes, updateSoapNotes } from "../../api/soap";
import LoadingCard from "./LoadingCard";
import SubjectiveSection from "./sections/SubjectiveSection";
import ObjectiveSection from "./sections/ObjectiveSection";
import AssessmentPlanSection from "./sections/AssessmentPlanSection";
import OrdersSection from "./sections/OrdersSection";

const SECTION_TITLES = [
  "Procedure Information",
  "Anesthesia / Analgesia",
  "Preparation & Equipment",
  "Procedure Description",
  "Post-Procedure Assessment",
  "Discharge Instructions",
  "Provider Attestation",
];

const ProcedureNotesSection = ({ content, procedureMeta }) => {
  if (!content) {
    return (
      <p className="text-sm text-gray-500 italic">No procedure notes available.</p>
    );
  }

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((line) => {
      const low = line.toLowerCase();
      return (
        line &&
        low !== "$procedure_notes -" &&
        low !== "procedure_notes -" &&
        low !== "procedure note"
      );
    });

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

  const isCalloutSection = (title) => title === "Procedure Description";

  const renderLine = (line, idx) => {
    if (line.includes(":")) {
      const [label, ...rest] = line.split(":");
      let value = rest.join(":").trim();

      // Fill placeholder for Date & Time if we have encounter meta
      if (
        procedureMeta &&
        label.toLowerCase().includes("date & time") &&
        value.toLowerCase().includes("insert")
      ) {
        value = `${procedureMeta.date}, ${procedureMeta.start} – ${procedureMeta.end}`;
      }

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
                <p key={i} className="text-sm text-black-800 leading-relaxed">
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


const Soap = ({ appointmentId, username }) => {
  const [soapNotes, setSoapNotes] = useState({
    patient: "",
    subjective: {},
    objective: {},
    assessmentAndPlan: {},
  });

  const [procedureNotes, setProcedureNotes] = useState("");
  const [ordersData, setOrdersData] = useState({ orders: [], confirmed: false });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("soap");
  const [, setRawFromServer] = useState("");

  // encounter meta (for Date & Time placeholder)
  const navState = window.history.state || {};
  const encounterStart = navState?.startTime;
  const encounterEnd = navState?.endTime;

  // eslint-disable-next-line
  const controlCharRegex = useMemo(() => new RegExp("[\\x00-\\x1F]+", "g"), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["soap-notes", appointmentId, username],
    queryFn: () => fetchSoapNotes(`${username}_${appointmentId}_soap`, username),
  });

  // ---- helpers to extract blocks safely ----
  const extractBlock = (raw, marker, nextMarkers = []) => {
    const idx = raw.indexOf(marker);
    if (idx === -1) return "";
    const start = idx + marker.length;
    const after = raw.slice(start);

    const nextIdxs = nextMarkers
      .map((m) => after.indexOf(m))
      .filter((n) => n !== -1);

    const end = nextIdxs.length ? Math.min(...nextIdxs) : after.length;
    return after.slice(0, end).trim();
  };
  useEffect(() => {
    if (!data?.data?.soap_notes || isLoading) return;

    const raw = data.data.soap_notes;
    setRawFromServer(raw);
    let soapText = "";
    if (raw.includes("$soap_notes -")) {
      soapText = extractBlock(raw, "$soap_notes -", ["$procedure_notes -", "$orders -"]);
    } else {
      // fallback for old records that didn't have $soap_notes -
      soapText = raw.split("$procedure_notes -")[0]?.trim() || raw;
    }

    const procText = raw.includes("$procedure_notes -")
      ? extractBlock(raw, "$procedure_notes -", ["$orders -"])
      : "";

    setProcedureNotes(procText);

    // orders parse (safe slice only JSON)
    if (raw.includes("$orders -")) {
  const afterOrders = raw.split("$orders -")[1] || "";

  try {
    let cleaned = afterOrders
      .replace(controlCharRegex, "")
      .trim();

    // 🔥 FIX: convert single quotes → double quotes
    cleaned = cleaned
      .replace(/'/g, '"')
      .replace(/None/g, "null")
      .replace(/True/g, "true")
      .replace(/False/g, "false");

    const parsed = JSON.parse(cleaned);

    // Normalize shape
    if (Array.isArray(parsed)) {
      setOrdersData({
        orders: parsed,
        confirmed: true,
      });
    } else if (parsed?.orders) {
      setOrdersData(parsed);
    } else {
      setOrdersData({ orders: [], confirmed: false });
    }
  } catch (e) {
    console.error("Orders parse failed:", e);
    setOrdersData({ orders: [], confirmed: false });
  }
}
    const patientMatch = soapText.match(/Patient:\s*(.*?)\n/);
    const reasonMatch = soapText.match(/Reason for Visit -([\s\S]*?)(?=\n\nSubjective -)/);
    const subjectiveMatch = soapText.match(/Subjective -([\s\S]*?)(?=\n\nFamily history discussed)/);
    const familyHistoryMatch = soapText.match(/Family history discussed in this appointment -([\s\S]*?)(?=\n\nSurgical history discussed)/);
    const surgicalHistoryMatch = soapText.match(/Surgical history discussed in this appointment -([\s\S]*?)(?=\n\nSocial history discussed)/);
    const socialHistoryMatch = soapText.match(/Social history discussed in this appointment -([\s\S]*?)(?=\n\nReview of Systems)/);
    const rosMatch = soapText.match(/Review of Systems(?:\s*\(ROS\))?:\s*([\s\S]*?)(?=\n\nObjective -)/);
    const objectiveMatch = soapText.match(/Objective -([\s\S]*?)(?=\n\nAssessment and Plan -)/);
    const assessmentPlanMatch = soapText.match(/Assessment and Plan -([\s\S]*)$/);

    let objectiveJSON = {};
    let assessmentPlanJSON = {};

    try {
      const objRaw = objectiveMatch?.[1]?.trim();
      if (objRaw?.includes("{")) {
        objectiveJSON = JSON.parse(
          objRaw
            .slice(objRaw.indexOf("{"), objRaw.lastIndexOf("}") + 1)
            .replace(controlCharRegex, "")
        );
      }
    } catch {}

    try {
      const apRaw = assessmentPlanMatch?.[1]?.trim();
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
  }, [data, isLoading, controlCharRegex]);

  const mutation = useMutation({
    mutationFn: (updatedNotes) =>
      updateSoapNotes(`${username}_${appointmentId}_soap`, username, updatedNotes),
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    },
    onError: () => alert("Failed to save SOAP notes."),
  });

  // your original SOAP raw builder (kept as-is)
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

  const buildFullRaw = (state) => {
    const soapOnly = buildRawSoap(state);

    return [
      `$soap_notes -\n${soapOnly}`,
      `$procedure_notes -\n${procedureNotes || ""}`,
      `$orders - ${JSON.stringify(ordersData)}`,
    ].join("\n\n");
  };

  const handleSave = async () => {
    const rawOut = buildFullRaw(soapNotes);
    mutation.mutate(rawOut);
  };

  const handleCancel = () => {
    setIsEditing(false);
    refetch();
  };

  if (isLoading) return <LoadingCard message="Loading SOAP..." />;
  if (error) return <LoadingCard />;

  const procedureMeta =
    encounterStart && encounterEnd
      ? {
          date: new Date(encounterStart).toLocaleDateString("en-US"),
          start: new Date(encounterStart).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          end: new Date(encounterEnd).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        }
      : null;

  return (
    <div className="space-y-6 text-gray-900 leading-snug">
      <h3 className="font-semibold text-black text-lg">SOAP Notes</h3>

      {/* Tabs */}
      <div className="flex gap-3">
        {["soap", "procedure", "orders"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-medium border ${
              activeTab === t
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-black-700 border-black-300"
            }`}
          >
            {t === "soap" ? "SOAP" : t === "procedure" ? "Procedure Notes" : "Orders"}
          </button>
        ))}
      </div>

      {activeTab === "soap" ? (
        <>
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
        </>
      ) : activeTab === "procedure" ? (
        <ProcedureNotesSection content={procedureNotes} procedureMeta={procedureMeta} />
      ) : (
        <OrdersSection ordersData={ordersData} />
      )}
    </div>
  );
};

export default Soap
