import { Textarea } from "../../ui/textarea";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

const CopyIconButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      title={label ? `Copy ${label}` : "Copy"}
      className={`inline-flex items-center justify-center h-7 rounded-md border transition-all whitespace-nowrap ${
        copied
          ? "bg-green-50 text-green-700 border-green-300"
          : "bg-white text-blue-500 border-blue-200 hover:text-blue-700 hover:border-blue-400"
      } ${copied ? "px-2 gap-1.5" : "w-7"}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied && <span className="text-[10px] font-semibold uppercase tracking-wide">Copied</span>}
    </button>
  );
};

const getPlanPointers = (planText = "") => {
  if (!planText) return [];

  const cleanBullet = (line) =>
    line
      .trim()
      .replace(/^[-*•]\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .trim();

  const newlinePointers = planText
    .split("\n")
    .map(cleanBullet)
    .filter(Boolean);

  if (newlinePointers.length > 1) return newlinePointers;

  return planText
    .split(/(?<=[.!?])\s+/)
    .map(cleanBullet)
    .filter(Boolean);
};

const AssessmentPlanSection = ({ soapNotes, setSoapNotes, isEditing }) => {
  const ap = soapNotes.assessmentAndPlan || { problems: [], follow_up: "" };

  const setProblems = (problems) =>
    setSoapNotes({
      ...soapNotes,
      assessmentAndPlan: { ...ap, problems },
    });

  const setFollowUp = (value) =>
    setSoapNotes({
      ...soapNotes,
      assessmentAndPlan: { ...ap, follow_up: value },
    });

  const handleChange = (idx, field, value) => {
    const copy = [...(ap.problems || [])];
    copy[idx] = { ...(copy[idx] || {}), [field]: value };
    setProblems(copy);
  };

  return (
    <div className="pt-2 text-gray-900 leading-relaxed space-y-2">
      <p className="font-semibold text-blue-700 text-lg">Assessment & Plan</p>

      {(ap.problems || []).map((p, idx) => {
        const planPointers = getPlanPointers(p.plan || "");
        const planCopyText = planPointers.map((line) => `• ${line}`).join("\n");

        return (
          <div key={idx} className="space-y-0.5">
            {!isEditing ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-black">
                    Problem #{idx + 1}: {p.problem}
                  </p>
                  <CopyIconButton text={p.problem} label={`Problem ${idx + 1}`} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p>
                    <b>Assessment:</b> {p.assessment}
                  </p>
                  <CopyIconButton text={p.assessment} label="Assessment" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p>
                    <b>Plan:</b>
                  </p>
                  <CopyIconButton text={planCopyText} label="Plan" />
                </div>
                <ul className="list-disc ml-6">
                  {planPointers.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="p-3 border rounded space-y-2">
                <input
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Problem"
                  value={p.problem || ""}
                  onChange={(e) => handleChange(idx, "problem", e.target.value)}
                />
                <Textarea
                  rows={2}
                  placeholder="Assessment..."
                  value={p.assessment || ""}
                  onChange={(e) =>
                    handleChange(idx, "assessment", e.target.value)
                  }
                />
                <Textarea
                  rows={3}
                  placeholder="Plan..."
                  value={p.plan || ""}
                  onChange={(e) => handleChange(idx, "plan", e.target.value)}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* --- Follow-up --- */}
      {!isEditing ? (
        ap.follow_up && (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p>
              <b>Follow-up:</b> {ap.follow_up}
            </p>
            <CopyIconButton text={ap.follow_up} label="Follow-up" />
          </div>
        )
      ) : (
        <div className="mt-3">
          <p className="font-semibold">Follow-up</p>
          <Textarea
            rows={2}
            placeholder="Follow-up plan..."
            value={ap.follow_up || ""}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default AssessmentPlanSection
