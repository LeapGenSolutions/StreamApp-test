import { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchSoapNotes, updateSoapNotes, postToAthena } from "../../api/soap";
import LoadingCard from "./LoadingCard";
import SubjectiveSection from "./sections/SubjectiveSection";
import ObjectiveSection from "./sections/ObjectiveSection";
import AssessmentPlanSection from "./sections/AssessmentPlanSection";
import OrdersSection from "./sections/OrdersSection";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

const SECTION_TITLES = [
  "Procedure Information",
  "Anesthesia / Analgesia",
  "Preparation & Equipment",
  "Procedure Description",
  "Post-Procedure Assessment",
  "Discharge Instructions",
  "Provider Attestation",
];

// --- 1. EXISTING INDIVIDUAL POST MODAL ---
const ConfirmationModal = ({ onCancel, onConfirm, isPosting, itemName }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 max-w-sm w-full mx-4 relative">
        <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Post</h3>
        <p className="text-gray-600 mb-6 text-sm">
          Are you sure you want to post <span className="font-semibold text-gray-900">{itemName || "this item"}</span> to Athena?
        </p>
        <div className="flex gap-3 justify-end">
          <Button onClick={onCancel} variant="outline" size="sm" className="border-gray-300 text-gray-700" disabled={isPosting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} size="sm" className="bg-blue-600 text-white hover:bg-blue-700" disabled={isPosting}>
            {isPosting ? "Posting..." : "Confirm Post"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- 2. MAIN POST CONFIRMATION MODAL ---
const InitialPostModal = ({ onCancel, onEdit, onProceed }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 max-w-md w-full mx-4 relative">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Post SOAP Note</h3>
        <p className="text-gray-600 mb-8">Do you want to post the SOAP note to Athena?</p>
        <div className="flex gap-3 justify-end">
          <Button onClick={onCancel} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </Button>
          <Button onClick={onEdit} className="bg-yellow-600 text-white hover:bg-yellow-700">
            Edit Note
          </Button>
          <Button onClick={onProceed} className="bg-blue-600 text-white hover:bg-blue-700">
            Review & Post
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- 3. REVIEW PAGE MODAL ---
const ReviewPage = ({ soapNotes, onCancel, onPost, onIndividualPost, status, sectionStatuses }) => {
  const noOp = () => {};
  const KEY_LABELS = {
    reason: "Reason",
    subjective: "Subjective",
    ros: "Review of Systems",
    objective: "Objective",
    assessmentPlan: "Assessment & Plan",
  };
  const failedSections = Object.keys(sectionStatuses).filter((k) => sectionStatuses[k] === "error");
  const failedSectionsLabels = failedSections.map((k) => KEY_LABELS[k] || k);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
           <h2 className="text-xl font-bold text-gray-900">Review SOAP Note</h2>
           <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50">
           <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-8">
              {soapNotes.patient && (
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Patient</h3>
                  <p className="text-xl font-medium text-gray-900">{soapNotes.patient}</p>
                </div>
              )}

              <div className="space-y-8 divide-y divide-gray-100">
                  <div className="pt-2 relative">
                    <SubjectiveSection 
                      soapNotes={soapNotes} setSoapNotes={noOp} isEditing={false}
                      onPost={onIndividualPost} sectionStatuses={sectionStatuses} 
                    />
                  </div>
                  <div className="pt-8">
                    <div className="relative">
                      <ObjectiveSection 
                        soapNotes={soapNotes} setSoapNotes={noOp} isEditing={false}
                              onPost={onIndividualPost} sectionStatuses={sectionStatuses} 
                            />
                    </div>
                  </div>
                  <div className="pt-8">
                    <div className="relative">
                      <AssessmentPlanSection 
                        soapNotes={soapNotes} setSoapNotes={noOp} isEditing={false}
                        onPost={onIndividualPost} sectionStatuses={sectionStatuses} 
                      />
                    </div>
                  </div>
              </div>
           </div>
        </div>

        <div className="bg-white border-t px-6 py-4 flex items-center justify-end gap-4 z-10">
          {status === 'success' ? (
             <div className="flex items-center gap-2 text-green-700 font-semibold text-lg bg-green-50 px-6 py-2 rounded-md animate-in fade-in">
               <CheckCircle2 className="w-5 h-5" />
               Successfully Posted!
             </div>
          ) : status === 'partial_error' ? (
             <div className="flex items-center gap-4 bg-orange-50 border border-orange-200 px-4 py-3 rounded-md w-full justify-between">
               <div className="flex items-center gap-2 text-orange-700 font-medium">
                 <AlertCircle className="w-5 h-5" />
                 <span>Failed to post: <b>{failedSectionsLabels.join(", ")}</b>. Please try again.</span>
               </div>
               <div className="flex gap-2">
                 <Button onClick={onCancel} variant="outline" className="bg-white text-gray-700">Cancel</Button>
                 <Button onClick={onPost} className="bg-blue-600 text-white hover:bg-blue-700">Retry Failed</Button>
               </div>
             </div>
          ) : status === 'error' ? (
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-red-600 font-semibold bg-red-50 px-4 py-2 rounded-md">
                 <AlertCircle className="w-5 h-5" />
                 Failed to Post completely
               </div>
               <Button onClick={onCancel} variant="outline">Close</Button>
               <Button onClick={onPost} className="bg-blue-600 text-white hover:bg-blue-700">Retry</Button>
             </div>
          ) : (
            <>
              <Button onClick={onCancel} variant="outline" size="lg" className="border-gray-300 text-gray-700" disabled={status === 'posting'}>
                Cancel
              </Button>
              <Button onClick={onPost} size="lg" className="bg-blue-600 text-white hover:bg-blue-700 min-w-[160px] shadow-sm" disabled={status === 'posting'}>
                {status === 'posting' ? "Posting..." : "Post to Athena"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ProcedureNotesSection
const ProcedureNotesSection = ({ content, procedureMeta }) => {
  if (!content) return <p className="text-sm text-gray-500 italic">No procedure notes available.</p>;
  const lines = content.split("\n").map((l) => l.trim()).filter((line) => line && !line.toLowerCase().includes("procedure_note"));
  const sections = [];
  let current = null;
  lines.forEach((line) => {
    if (SECTION_TITLES.includes(line)) {
      current = { title: line, items: [] };
      sections.push(current);
      return;
    }
    if (!current) { current = { title: "Procedure Notes", items: [] }; sections.push(current); }
    current.items.push(line);
  });
  const renderLine = (line, idx) => {
    if (line.includes(":")) {
      const [label, ...rest] = line.split(":");
      let value = rest.join(":").trim();
      return (
        <div key={idx} className="grid grid-cols-12 gap-6 py-2">
          <div className="col-span-4 text-sm font-medium text-black-700">{label}</div>
          <div className="col-span-8 text-sm text-black-900">{value || "—"}</div>
        </div>
      );
    }
    return <p key={idx} className="text-sm text-black-800 leading-relaxed py-1">{line}</p>;
  };
  return (
    <div className="space-y-10">
      {sections.map((section, idx) => (
        <div key={idx} className="pb-6 border-b border-black-200">
          <h4 className="text-blue-600 font-semibold text-lg mb-4">{section.title}</h4>
          {section.title === "Procedure Description" ? (
            <div className="bg-gray-50 border-l-4 border-blue-300 rounded-md p-4 space-y-2">
              {section.items.map((line, i) => <p key={i} className="text-sm text-black-800 leading-relaxed">{line}</p>)}
            </div>
          ) : (
            <div className="divide-y divide-black-100">{section.items.map((line, i) => renderLine(line, i))}</div>
          )}
        </div>
      ))}
    </div>
  );
};

const Soap = ({ appointmentId, username, appointment}) => {
  const [soapNotes, setSoapNotes] = useState({ patient: "", subjective: {}, objective: {}, assessmentAndPlan: {} });
  const [procedureNotes, setProcedureNotes] = useState("");
  const [ordersData, setOrdersData] = useState({ orders: [], confirmed: false });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("soap");

  const [pendingPost, setPendingPost] = useState(null);
  const [postFlowStage, setPostFlowStage] = useState('idle'); 
  const [mainPostStatus, setMainPostStatus] = useState('idle'); 
  
  // NEW: Track the status of every individual section during a main post
  const [sectionStatuses, setSectionStatuses] = useState({});

  const navState = window.history.state || {};
  const encounterStart = navState?.startTime;
  const encounterEnd = navState?.endTime;
  // eslint-disable-next-line no-control-regex
  const controlCharRegex = useMemo(() => new RegExp("[\\x00-\\x1F]+", "g"), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["soap-notes", appointmentId, username],
    queryFn: () => fetchSoapNotes(`${username}_${appointmentId}_soap`, username),
  });

  const extractBlock = (raw, marker, nextMarkers = []) => {
    const idx = raw.indexOf(marker);
    if (idx === -1) return "";
    const start = idx + marker.length;
    const after = raw.slice(start);
    const nextIdxs = nextMarkers.map((m) => after.indexOf(m)).filter((n) => n !== -1);
    const end = nextIdxs.length ? Math.min(...nextIdxs) : after.length;
    return after.slice(0, end).trim();
  };

  useEffect(() => {
    if (!data?.data?.soap_notes || isLoading) return;
    const raw = data.data.soap_notes;
    let soapText = raw.includes("$soap_notes -") ? extractBlock(raw, "$soap_notes -", ["$procedure_notes -", "$orders -"]) : raw.split("$procedure_notes -")[0]?.trim() || raw;
    const procText = raw.includes("$procedure_notes -") ? extractBlock(raw, "$procedure_notes -", ["$orders -"]) : "";
    setProcedureNotes(procText);

    if (raw.includes("$orders -")) {
      const afterOrders = raw.split("$orders -")[1] || "";
      try {
        let cleaned = afterOrders.replace(controlCharRegex, "").trim().replace(/'/g, '"').replace(/None/g, "null").replace(/True/g, "true").replace(/False/g, "false");
        const parsed = JSON.parse(cleaned);
        setOrdersData(Array.isArray(parsed) ? { orders: parsed, confirmed: true } : (parsed?.orders ? parsed : { orders: [], confirmed: false }));
      } catch (e) { setOrdersData({ orders: [], confirmed: false }); }
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
      if (objRaw?.includes("{")) objectiveJSON = JSON.parse(objRaw.slice(objRaw.indexOf("{"), objRaw.lastIndexOf("}") + 1).replace(controlCharRegex, ""));
    } catch {}

    try {
      const apRaw = assessmentPlanMatch?.[1]?.trim();
      if (apRaw?.includes("{")) assessmentPlanJSON = JSON.parse(apRaw.slice(apRaw.indexOf("{"), apRaw.lastIndexOf("}") + 1).replace(controlCharRegex, ""));
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
    mutationFn: (updatedNotes) => updateSoapNotes(`${username}_${appointmentId}_soap`, username, updatedNotes),
    onSuccess: () => { refetch(); setIsEditing(false); },
  });

  const postMutation = useMutation({
    mutationFn: (itemToPost) => postToAthena(itemToPost),
    onSuccess: () => {
      if (pendingPost?.onSuccess) pendingPost.onSuccess();
      setPendingPost(null); 
    },
    onError: () => {
      if (pendingPost?.onError) pendingPost.onError();
      setPendingPost(null);
    },
  });

  const mainPostMutation = useMutation({
    mutationFn: (fullData) => postToAthena(fullData),
    onSuccess: (responseData) => {
      // Accept multiple response shapes. Preferred: { section_results: { ... } }
      const results = responseData?.section_results || responseData?.data || responseData;
      // If the response contains section keys from middleware, normalize and merge them
      if (results && (results.reason !== undefined || results.subjective !== undefined || results.ros !== undefined || results.objective !== undefined || results.assessmentPlan !== undefined)) {
        const mapped = {};
        Object.keys(results).forEach((k) => {
          const v = results[k];
          if (v === true) mapped[k] = 'success';
          else if (v === false) mapped[k] = 'error';
          else mapped[k] = v;
        });
        // Also create human-readable keys so child Post buttons (which expect names like "Chief Complaint") update
        const humanMapped = {};
        if (mapped.reason) humanMapped["Chief Complaint"] = mapped.reason;
        if (mapped.subjective) humanMapped["History of Present Illness"] = mapped.subjective;
        if (mapped.ros) humanMapped["Review of Systems"] = mapped.ros;
        if (mapped.objective) humanMapped["Physical Exam"] = mapped.objective;
        if (mapped.assessmentPlan) humanMapped["Assessment & Plan"] = mapped.assessmentPlan;

        setSectionStatuses((prev) => ({ ...prev, ...mapped, ...humanMapped }));
        const hasErrors = Object.values(mapped).includes('error');
        setMainPostStatus(hasErrors ? 'partial_error' : 'success');
        return;
      }
      // Default behavior: EVERYTHING succeeded
      setSectionStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { if (next[k] === 'posting') next[k] = 'success'; });
        return next;
      });
      setMainPostStatus('success');
    },
    onError: () => {
      // Default behavior: EVERYTHING failed
      setSectionStatuses((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { if (next[k] === 'posting') next[k] = 'error'; });
        return next;
      });
      setMainPostStatus('error');
    },
  });

  const handleInitiatePost = (data, onSuccess, onError) => {
    data = { ...data, username, athena_encounter_id: appointment?.athena_encounter_id, practiceID:  appointment?.athena_practice_id};
    setPendingPost({ data, onSuccess, onError });
  };
  const handleConfirmPost = () => { if (pendingPost) postMutation.mutate(pendingPost.data); };
  const handleCancelPost = () => { setPendingPost(null); };

  const handleMainPostClick = () => { setPostFlowStage('confirming'); };
  const handleInitialConfirmEdit = () => { setPostFlowStage('idle'); setIsEditing(true); };
  const handleInitialConfirmProceed = () => { setPostFlowStage('reviewing'); };
  const handleInitialConfirmCancel = () => { setPostFlowStage('idle'); };
  
  const handleReviewPost = () => {
    setMainPostStatus('posting');
    
    // Mark only the sections that have content as "posting" using middleware keys
    const activeStatuses = {};
    if (soapNotes.subjective.chief_complaint) activeStatuses["reason"] = "posting";
    if (soapNotes.subjective.hpi) activeStatuses["subjective"] = "posting";
    if (soapNotes.subjective.ros) activeStatuses["ros"] = "posting";
    if (soapNotes.objective && Object.keys(soapNotes.objective).length) activeStatuses["objective"] = "posting";
    const ap = soapNotes.assessmentAndPlan;
    if ((ap?.problems && ap.problems.length > 0) || ap?.follow_up) {
      activeStatuses["assessmentPlan"] = "posting";
    }
    // Also mark the corresponding human-readable keys so per-section Post buttons reflect 'posting'
    const humanMap = {};
    if (activeStatuses.reason) humanMap["Chief Complaint"] = activeStatuses.reason;
    if (activeStatuses.subjective) humanMap["History of Present Illness"] = activeStatuses.subjective;
    if (activeStatuses.ros) humanMap["Review of Systems"] = activeStatuses.ros;
    if (activeStatuses.objective) humanMap["Physical Exam"] = activeStatuses.objective;
    if (activeStatuses.assessmentPlan) humanMap["Assessment & Plan"] = activeStatuses.assessmentPlan;

    setSectionStatuses({ ...activeStatuses, ...humanMap });

    const fullRaw = buildFullRaw(soapNotes);
    mainPostMutation.mutate({ content: fullRaw, username, athena_encounter_id: appointment?.athena_encounter_id, practiceID: appointment?.athena_practice_id }); 
  };

  const handleReviewCancel = () => {
    setPostFlowStage('idle');
    setMainPostStatus('idle');
    setSectionStatuses({});
  };

  const buildRawSoap = useMemo(() => {
    return (state) => {
      const {
        patient,
        subjective: { chief_complaint, hpi, family_history, surgical_history, social_history, ros },
        objective, assessmentAndPlan,
      } = state;
      return [
        patient ? `Patient: ${patient}` : "", "", chief_complaint ? `Reason for Visit - ${chief_complaint}` : "", "",
        `Subjective - ${hpi || ""}`, "", `Family history discussed in this appointment - ${family_history || "Not discussed"}`, "",
        `Surgical history discussed in this appointment - ${surgical_history || "Not discussed"}`, "",
        `Social history discussed in this appointment - ${social_history || "Not discussed"}`, "",
        ros ? `Review of Systems:\n${ros}` : "Review of Systems:\n", "",
        `Objective - ${JSON.stringify(objective || {}, null, 2)}`, "",
        `Assessment and Plan - ${JSON.stringify(assessmentAndPlan || {}, null, 2)}`,
      ].join("\n");
    };
  }, []);

  const buildFullRaw = (state) => {
    const soapOnly = buildRawSoap(state);
    return [`$soap_notes -\n${soapOnly}`, `$procedure_notes -\n${procedureNotes || ""}`, `$orders - ${JSON.stringify(ordersData)}`].join("\n\n");
  };

  const handleSave = async () => { const rawOut = buildFullRaw(soapNotes); mutation.mutate(rawOut); };
  const handleCancel = () => { setIsEditing(false); refetch(); };

  if (isLoading) return <LoadingCard message="Loading SOAP..." />;
  if (error) return <LoadingCard />;

  const procedureMeta = encounterStart && encounterEnd ? {
    date: new Date(encounterStart).toLocaleDateString("en-US"),
    start: new Date(encounterStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    end: new Date(encounterEnd).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  } : null;

  return (
    <div className="relative space-y-6 text-gray-900 leading-snug">
      
      {pendingPost && (
        <ConfirmationModal
          onCancel={handleCancelPost}
          onConfirm={handleConfirmPost}
          isPosting={postMutation.isLoading}
          itemName={pendingPost.data?.type} 
        />
      )}

      {postFlowStage === 'confirming' && (
        <InitialPostModal 
          onCancel={handleInitialConfirmCancel}
          onEdit={handleInitialConfirmEdit}
          onProceed={handleInitialConfirmProceed}
        />
      )}

      {postFlowStage === 'reviewing' && (
        <ReviewPage 
          soapNotes={soapNotes} 
          onCancel={handleReviewCancel}
          onPost={handleReviewPost}
          onIndividualPost={handleInitiatePost} 
          status={mainPostStatus}
          sectionStatuses={sectionStatuses}
        />
      )}

      <h3 className="font-semibold text-black text-lg">SOAP Notes</h3>

      <div className="flex gap-3">
        {["soap", "procedure", "orders"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-medium border ${
              activeTab === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-black-700 border-black-300"
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
              onPost={handleInitiatePost}
              sectionStatuses={sectionStatuses} // Pass dictionary
            />
            <ObjectiveSection
              soapNotes={soapNotes}
              setSoapNotes={setSoapNotes}
              isEditing={isEditing}
              onPost={handleInitiatePost}
              sectionStatuses={sectionStatuses} // Pass dictionary
            />
            <AssessmentPlanSection
              soapNotes={soapNotes}
              setSoapNotes={setSoapNotes}
              isEditing={isEditing}
              onPost={handleInitiatePost}
              sectionStatuses={sectionStatuses} // Pass dictionary
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)} className="bg-yellow-600 text-white hover:bg-yellow-700">
                  Edit
                </Button>
                <Button onClick={handleMainPostClick} className="bg-blue-600 text-white hover:bg-blue-700">
                  Post SOAP to Athena
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={mutation.isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {mutation.isLoading ? "Saving..." : "Save SOAP Notes"}
                </Button>
                <Button onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600 text-white">Cancel</Button>
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

export default Soap;