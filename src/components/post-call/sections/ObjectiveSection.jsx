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

const ObjectiveSection = ({ soapNotes, setSoapNotes, isEditing, onPost, sectionStatuses = {} }) => {
  const obj = soapNotes.objective || {};

  const setObj = (next) => setSoapNotes({ ...soapNotes, objective: next });
  const handleVitalChange = (k, v) => setObj({ ...obj, vital_signs: { ...(obj.vital_signs || {}), [k]: v } });

  return (
    <div className="pt-2 text-gray-900 leading-relaxed space-y-2">
      <p className="font-semibold text-blue-700 text-lg">Objective</p>

      {obj.vital_signs && (
        <div>
          <div className="flex items-center justify-between gap-3 mt-1 mb-1">
            <p className="font-bold text-black">Vital Signs:</p>
          </div>
          {/* REMOVED w-full HERE SO IT STAYS COMPACT */}
          <table className="border border-gray-300 mt-1 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-1 text-left font-bold text-black-800">Measure</th>
                <th className="border px-3 py-1 text-left font-bold text-black-800">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(obj.vital_signs).map(([k, v]) => (
                <tr key={k}>
                  <td className="border px-3 py-1 font-medium w-48">{k}</td>
                  <td className="border px-3 py-1">
                    {!isEditing ? (
                      <div className="flex items-center justify-between gap-3">
                        <span>{v}</span>
                        <CopyIconButton text={`${k}: ${v}`} label={k} />
                      </div>
                    ) : (
                      <input className="border rounded px-2 py-1 text-sm w-full" value={v} onChange={(e) => handleVitalChange(k, e.target.value)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {obj.physical_exams && (
        <div>
          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="font-bold text-black">Physical Exam:</p>
            <div className="flex items-center">
              <CopyIconButton text={Object.entries(obj.physical_exams || {}).map(([k, v]) => `${k}: ${v}`).join("\n")} label="Physical Exam" />
              {onPost && (
                <PostIconButton 
                  onClick={(onSuccess, onError) => onPost({ type: "Physical Exam", content: Object.entries(obj.physical_exams || {}).map(([k, v]) => `${k}: ${v}`).join("\n") }, onSuccess, onError)}
                  disabled={!obj.physical_exams}
                  globalStatus={sectionStatuses["Physical Exam"] || "idle"} 
                />
              )}
            </div>
          </div>
          <ul className="list-disc ml-6 text-[15px] leading-relaxed">
            {Object.entries(obj.physical_exams).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3">
                <span className="flex-1">
                  <b>{k}:</b>{" "}
                  {!isEditing ? v : (
                    <input className="border rounded px-2 py-1 text-sm w-full max-w-xl" value={v} onChange={(e) => setObj({ ...obj, physical_exams: { ...(obj.physical_exams || {}), [k]: e.target.value } })} />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {obj.laboratory_data?.length > 0 && (
        <div>
          <p className="font-bold text-black mt-3">Laboratory Data:</p>
          <ul className="list-disc ml-6 text-[15px] leading-relaxed">
            {obj.laboratory_data.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span>{item}</span>
                <div className="flex items-center"><CopyIconButton text={item} label="Lab item" /></div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {obj.imaging_studies?.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="font-bold text-black">Imaging Studies:</p>
            <div className="flex items-center"><CopyIconButton text={(obj.imaging_studies || []).join("\n")} label="Imaging Studies" /></div>
          </div>
          <ul className="list-disc ml-6 text-[15px] leading-relaxed">
            {obj.imaging_studies.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ObjectiveSection;