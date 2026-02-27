import { Textarea } from "../../ui/textarea";
import { Copy, Check, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

// --- REUSABLE POST BUTTON (Listens to Local and Global states) ---
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
    } catch { }
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

// Accept sectionStatuses dictionary
const SubjectiveSection = ({ soapNotes, setSoapNotes, isEditing, onPost, sectionStatuses = {} }) => {
  const subj = soapNotes.subjective || {};

  const setField = (key, value) => setSoapNotes({ ...soapNotes, subjective: { ...subj, [key]: value } });
  const quote = (cc) => {
    if (!cc) return "";
    const clean = cc.trim().replace(/^["']|["']$/g, "");
    return `"${clean.charAt(0).toUpperCase() + clean.slice(1)}"`;
  };
  const renderROS = (rosText) => {
    if (!rosText) return null;
    return rosText.split("\n").filter(Boolean).map((line, idx) => {
        const [system, findings] = line.split(":").map((x) => x.trim());
        return (
          <p key={idx} className="ml-4 text-[15px] leading-relaxed">
            <span className="font-semibold">{system}:</span> {findings}
          </p>
        );
      });
  };

  return (
    <div className="pt-2 text-gray-900 leading-relaxed space-y-2">
      <p className="font-semibold text-blue-700 text-lg">Subjective</p>
      {!isEditing ? (
        <>
          {subj.chief_complaint && (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-bold">Chief Complaint:</p>
                <div className="flex items-center">
                  <CopyIconButton text={subj.chief_complaint} label="Chief Complaint" />
                  {onPost && (
                    <PostIconButton 
                      onClick={(onSuccess, onError) => onPost({ type: "Chief Complaint", content: subj.chief_complaint }, onSuccess, onError)}
                      disabled={!subj.chief_complaint}
                      globalStatus={sectionStatuses["Chief Complaint"] || "idle"} 
                    />
                  )}
                </div>
              </div>
              <p className="ml-4 text-[15px] leading-relaxed">{quote(subj.chief_complaint)}</p>
            </>
          )}

          {subj.hpi && (
            <>
              <div className="flex items-center justify-between gap-3 mt-2">
                <p className="font-bold text-black">History of Present Illness:</p>
                <div className="flex items-center">
                  <CopyIconButton text={subj.hpi} label="History of Present Illness" />
                  {onPost && (
                    <PostIconButton 
                      onClick={(onSuccess, onError) => onPost({ type: "History of Present Illness", content: subj.hpi }, onSuccess, onError)}
                      disabled={!subj.hpi}
                      globalStatus={sectionStatuses["History of Present Illness"] || "idle"} 
                    />
                  )}
                </div>
              </div>
              <p className="ml-4 text-[15px] leading-relaxed">{subj.hpi}</p>
            </>
          )}

          {subj.family_history && (
            <>
              <div className="flex items-center justify-between gap-3 mt-3">
                <p className="font-bold text-black">Family History Discussed:</p>
                <div className="flex items-center"><CopyIconButton text={subj.family_history} label="Family History" /></div>
              </div>
              <p className="ml-4 italic text-[15px]">{subj.family_history || "Not discussed"}</p>
            </>
          )}

          {subj.surgical_history && (
            <>
              <div className="flex items-center justify-between gap-3 mt-3">
                <p className="font-bold text-black">Surgical History Discussed:</p>
                <div className="flex items-center"><CopyIconButton text={subj.surgical_history} label="Surgical History" /></div>
              </div>
              <p className="ml-4 italic text-[15px]">{subj.surgical_history || "Not discussed"}</p>
            </>
          )}

          {subj.social_history && (
            <>
              <div className="flex items-center justify-between gap-3 mt-3">
                <p className="font-bold text-black">Social History Discussed:</p>
                <div className="flex items-center"><CopyIconButton text={subj.social_history} label="Social History" /></div>
              </div>
              <p className="ml-4 italic text-[15px]">{subj.social_history || "Not discussed"}</p>
            </>
          )}

          {subj.ros && (
            <>
              <div className="flex items-center justify-between gap-3 mt-3">
                <p className="font-bold text-black">Review of Systems:</p>
                <div className="flex items-center">
                  <CopyIconButton text={subj.ros} label="Review of Systems" />
                  {onPost && (
                    <PostIconButton 
                      onClick={(onSuccess, onError) => onPost({ type: "Review of Systems", content: subj.ros }, onSuccess, onError)}
                      disabled={!subj.ros}
                      globalStatus={sectionStatuses["Review of Systems"] || "idle"} 
                    />
                  )}
                </div>
              </div>
              <div className="space-y-1">{renderROS(subj.ros)}</div>
            </>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Textarea rows={2} placeholder="Chief Complaint..." value={subj.chief_complaint || ""} onChange={(e) => setField("chief_complaint", e.target.value)} />
          <Textarea rows={4} placeholder="History of Present Illness..." value={subj.hpi || ""} onChange={(e) => setField("hpi", e.target.value)} />
          <Textarea rows={2} placeholder="Family History Discussed..." value={subj.family_history || ""} onChange={(e) => setField("family_history", e.target.value)} />
          <Textarea rows={2} placeholder="Surgical History Discussed..." value={subj.surgical_history || ""} onChange={(e) => setField("surgical_history", e.target.value)} />
          <Textarea rows={2} placeholder="Social History Discussed..." value={subj.social_history || ""} onChange={(e) => setField("social_history", e.target.value)} />
          <Textarea rows={4} placeholder="Review of Systems..." value={subj.ros || ""} onChange={(e) => setField("ros", e.target.value)} />
        </div>
      )}
    </div>
  );
};

export default SubjectiveSection;