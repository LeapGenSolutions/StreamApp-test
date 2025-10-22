import { Textarea } from "../../ui/textarea";

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

      {(ap.problems || []).map((p, idx) => (
        <div key={idx} className="space-y-0.5">
          {!isEditing ? (
            <>
              <p className="font-semibold text-black">
                Problem #{idx + 1}: {p.problem}
              </p>
              <p>
                <b>Assessment:</b> {p.assessment}
              </p>
              <p>
                <b>Plan:</b>
              </p>
              <ul className="list-disc ml-6">
                {(p.plan || "")
                  .split(/(?<=\.)\s+/)
                  .filter(Boolean)
                  .map((line, i) => (
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
      ))}

      {/* --- Follow-up --- */}
      {!isEditing ? (
        ap.follow_up && (
          <p className="mt-2">
            <b>Follow-up:</b> {ap.follow_up}
          </p>
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
