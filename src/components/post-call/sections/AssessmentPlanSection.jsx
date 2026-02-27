import { Textarea } from "../../ui/textarea";
import { useState } from "react";
import { Copy, Check, Send, AlertCircle, CheckCircle2 } from "lucide-react";

const PostIconButton = ({ onClick, disabled, globalStatus }) => {
  const [localStatus, setLocalStatus] = useState("idle");

  // normalize boolean statuses coming from middleware to string values
  let normalizedGlobal = globalStatus;
  if (normalizedGlobal === true) normalizedGlobal = "success";
  if (normalizedGlobal === false) normalizedGlobal = "error";

  const handleClick = () => {
    if (localStatus !== "idle" || globalStatus === "posting") return;
    onClick(
      () => { setLocalStatus("success"); setTimeout(() => setLocalStatus("idle"), 3000); },
      () => { setLocalStatus("error"); setTimeout(() => setLocalStatus("idle"), 3000); }
    );
  };

  let effectiveStatus = localStatus;
  if (normalizedGlobal === "success" || normalizedGlobal === "error" || normalizedGlobal === "posting") {
    effectiveStatus = normalizedGlobal;
  }

  let bgClass = "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400";
  let icon = <Send className="w-3.5 h-3.5" />;
  let label = null;

  if (disabled || normalizedGlobal === "posting") {
    bgClass = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
  } else if (effectiveStatus === "success") {
    bgClass = "bg-green-50 text-green-700 border-green-300 w-auto px-2";
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Success</span>;
  } else if (effectiveStatus === "error") {
    bgClass = "bg-red-50 text-red-700 border-red-300 w-auto px-2";
    icon = <AlertCircle className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Failed</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || globalStatus === "posting" || effectiveStatus !== "idle"}
      title="Post to Athena"
      className={`inline-flex items-center justify-center h-7 rounded-md border transition-all ml-2 ${bgClass} ${effectiveStatus === "idle" ? "w-7" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
};

const CopyIconButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      title={label ? `Copy ${label}` : "Copy"}
      className={`inline-flex items-center justify-center h-7 rounded-md border transition-all whitespace-nowrap ${
        copied ? "bg-green-50 text-green-700 border-green-300" : "bg-white text-blue-500 border-blue-200 hover:text-blue-700 hover:border-blue-400"
      } ${copied ? "px-2 gap-1.5" : "w-7"}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied && <span className="text-[10px] font-semibold uppercase tracking-wide">Copied</span>}
    </button>
  );
};

const getPlanPointers = (planText = "") => {
  if (!planText) return [];
  const cleanBullet = (line) => line.trim().replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
  const newlinePointers = planText.split("\n").map(cleanBullet).filter(Boolean);
  if (newlinePointers.length > 1) return newlinePointers;
  return planText.split(/(?<=[.!?])\s+/).map(cleanBullet).filter(Boolean);
};

// Accept sectionStatuses dictionary
const AssessmentPlanSection = ({ soapNotes, setSoapNotes, isEditing, onPost, sectionStatuses = {} }) => {
  const ap = soapNotes.assessmentAndPlan || { problems: [], follow_up: "" };

  const setProblems = (problems) => setSoapNotes({ ...soapNotes, assessmentAndPlan: { ...ap, problems } });
  const setFollowUp = (value) => setSoapNotes({ ...soapNotes, assessmentAndPlan: { ...ap, follow_up: value } });
  const handleChange = (idx, field, value) => {
    const copy = [...(ap.problems || [])];
    copy[idx] = { ...(copy[idx] || {}), [field]: value };
    setProblems(copy);
  };

  const compileFullAP = () => {
    let fullText = "";
    (ap.problems || []).forEach((p, idx) => {
      fullText += `Problem #${idx + 1}: ${p.problem || ""}\nAssessment: ${p.assessment || ""}\nPlan: ${p.plan || ""}\n\n`;
    });
    if (ap.follow_up) fullText += `Follow-up: ${ap.follow_up}`;
    return fullText.trim();
  };

  return (
    <div className="pt-2 text-gray-900 leading-relaxed space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-blue-700 text-lg">Assessment & Plan</p>
        
        {onPost && !isEditing && (
          <PostIconButton 
            onClick={(onSuccess, onError) => onPost({ type: "Assessment & Plan", content: compileFullAP() }, onSuccess, onError)}
            disabled={(!ap.problems || ap.problems.length === 0) && !ap.follow_up}
            globalStatus={sectionStatuses["Assessment & Plan"] || "idle"} 
          />
        )}
      </div>

      {(ap.problems || []).map((p, idx) => {
        const planPointers = getPlanPointers(p.plan || "");
        const planCopyText = planPointers.map((line) => `• ${line}`).join("\n");

        return (
          <div key={idx} className="space-y-0.5">
            {!isEditing ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-black">Problem #{idx + 1}: {p.problem}</p>
                  <div className="flex items-center"><CopyIconButton text={p.problem} label={`Problem ${idx + 1}`} /></div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p><b>Assessment:</b> {p.assessment}</p>
                  <div className="flex items-center"><CopyIconButton text={p.assessment} label="Assessment" /></div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p><b>Plan:</b></p>
                  <div className="flex items-center"><CopyIconButton text={planCopyText} label="Plan" /></div>
                </div>
                <ul className="list-disc ml-6">{planPointers.map((line, i) => <li key={i}>{line}</li>)}</ul>
              </>
            ) : (
              <div className="p-3 border rounded space-y-2">
                <input className="border rounded px-2 py-1 w-full" placeholder="Problem" value={p.problem || ""} onChange={(e) => handleChange(idx, "problem", e.target.value)} />
                <Textarea rows={2} placeholder="Assessment..." value={p.assessment || ""} onChange={(e) => handleChange(idx, "assessment", e.target.value)} />
                <Textarea rows={3} placeholder="Plan..." value={p.plan || ""} onChange={(e) => handleChange(idx, "plan", e.target.value)} />
              </div>
            )}
          </div>
        );
      })}

      {!isEditing ? (
        ap.follow_up && (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p><b>Follow-up:</b> {ap.follow_up}</p>
            <div className="flex items-center"><CopyIconButton text={ap.follow_up} label="Follow-up" /></div>
          </div>
        )
      ) : (
        <div className="mt-3">
          <p className="font-semibold">Follow-up</p>
          <Textarea rows={2} placeholder="Follow-up plan..." value={ap.follow_up || ""} onChange={(e) => setFollowUp(e.target.value)} />
        </div>
      )}
    </div>
  );
};

export default AssessmentPlanSection;