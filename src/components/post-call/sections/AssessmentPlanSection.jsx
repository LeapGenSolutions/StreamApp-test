import { Textarea } from "../../ui/textarea";

const AssessmentPlanSection = ({
  isEditing,
  soapNotes,
  setSoapNotes,
  patientLine,
  reasonLine,
}) => {
  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={soapNotes.Assessment}
          onChange={(e) =>
            setSoapNotes({ ...soapNotes, Assessment: e.target.value })
          }
          rows={5}
          placeholder="Assessment..."
        />
        <Textarea
          value={soapNotes.Plan}
          onChange={(e) =>
            setSoapNotes({ ...soapNotes, Plan: e.target.value })
          }
          rows={5}
          placeholder="Plan..."
        />
      </div>
    );
  }

  const assessmentText = soapNotes.Assessment || "";
  const planText = soapNotes.Plan || "";

  // --- Parse Assessment ---
  const assessmentProblems = {};
  const assessmentMatches = assessmentText.split(/\n?\d+\.\s*/).filter(Boolean);

  assessmentMatches.forEach((block, idx) => {
    const parts = block.split(":");
    if (parts.length > 1) {
      const title = parts[0].trim();
      const desc = parts.slice(1).join(":").trim();
      assessmentProblems[idx + 1] = { title, assessment: desc, plan: [] };
    }
  });

  // --- Parse Plan ---
  const planBlocks = planText.split(/\n?\d+\.\s*/).filter(Boolean);
  const followUpBlocks = []; // to store all follow-ups separately

  planBlocks.forEach((block, idx) => {
    if (/^Follow[-\s]?up[:/-]?/i.test(block)) {
      const cleaned = block
        .replace(/^Follow[-\s]?up[:/-]?\s*/i, "")
        .trim()
        .split(/\n|-\s+/)
        .map((l) => l.trim())
        .filter((x) => x);
      followUpBlocks.push(...cleaned);
      return;
    }

    const parts = block.split(":");
    if (parts.length > 1) {
      const title = parts[0].trim();
      const planLines = parts
        .slice(1)
        .join(":")
        .split(/\n|-\s+/)
        .map((l) => l.trim())
        .filter((x) => x);
      if (assessmentProblems[idx + 1]) {
        assessmentProblems[idx + 1].plan = planLines;
      } else {
        assessmentProblems[idx + 1] = { title, assessment: "", plan: planLines };
      }
    }
  });

  const problems = Object.values(assessmentProblems);

  return (
    <div className="text-[15px] leading-relaxed text-gray-900 space-y-2">
      {/* Heading */}
      <p className="font-semibold text-blue-700 text-lg">Assessment & Plan</p>

      {/* Patient Summary */}
      {patientLine && reasonLine && (
        <p className="text-base text-gray-900">
          {(() => {
            const match = patientLine.match(
              /(.*?),\s*(\d+)\s*years old,\s*(F|M)/i
            );
            if (match) {
              const [,name, age, gender] = match;
              const cleanedReason = reasonLine
              .replace(/^(The\s*)?(Patient|Pt)\s*(presents|reports)\s*(with\s*)?/i, "")
              .trim();
              return `${name} is a ${age}-year-old ${gender} with a chief complaint of ${cleanedReason}.`;
            }
            return `${patientLine} with a chief complaint of ${reasonLine
            .replace(/^(The\s*)?(Patient|Pt)\s*(presents|reports)\s*(with\s*)?/i, "")
            .trim()}.`;
          })()}
        </p>
      )}

      {/* Problems */}
      {problems.map((p, idx) => (
        <div key={idx} className="space-y-0.5">
          <p className="font-semibold text-black">
            Problem #{idx + 1}: {p.title}
          </p>
          <p className="ml-1 text-gray-800">
            <span className="text-black">Assessment:</span>{" "}
            {p.assessment || "—"}
          </p>
          <p className="ml-1 text-gray-800">
            <span className="text-black">Plan:</span>
          </p>
          {p.plan.length > 0 && (
            <ul className="list-disc ml-6 space-y-[1px] text-gray-800">
              {p.plan.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {/* Separate Follow-up section (bottom) */}
      {followUpBlocks.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-black">Follow-up:</p>
          <ul className="list-disc ml-6 space-y-[1px] text-gray-800">
            {followUpBlocks.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AssessmentPlanSection
