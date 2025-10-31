import { Textarea } from "../../ui/textarea";

const SubjectiveSection = ({ soapNotes, setSoapNotes, isEditing }) => {
  const subj = soapNotes.subjective || {};

  const setField = (key, value) => {
    setSoapNotes({
      ...soapNotes,
      subjective: { ...subj, [key]: value },
    });
  };

  const quote = (cc) => {
    if (!cc) return "";
    const clean = cc.trim().replace(/^["']|["']$/g, "");
    return `"${clean.charAt(0).toUpperCase() + clean.slice(1)}"`;
  };

  const renderROS = (rosText) => {
    if (!rosText) return null;
    return rosText
      .split("\n")
      .filter(Boolean)
      .map((line, idx) => {
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
            <p className="text-base">
              <b>Chief Complaint:</b> {quote(subj.chief_complaint)}
            </p>
          )}

          {subj.hpi && (
            <>
              <p className="font-bold text-black mt-2">History of Present Illness:</p>
              <p className="ml-4 text-[15px] leading-relaxed">{subj.hpi}</p>
            </>
          )}

          {subj.family_history && (
            <>
              <p className="font-bold text-black mt-3">Family History Discussed:</p>
              <p className="ml-4 italic text-[15px]">
                {subj.family_history || "Not discussed"}
              </p>
            </>
          )}

          {subj.surgical_history && (
            <>
              <p className="font-bold text-black mt-3">Surgical History Discussed:</p>
              <p className="ml-4 italic text-[15px]">
                {subj.surgical_history || "Not discussed"}
              </p>
            </>
          )}

          {subj.social_history && (
            <>
              <p className="font-bold text-black mt-3">Social History Discussed:</p>
              <p className="ml-4 italic text-[15px]">
                {subj.social_history || "Not discussed"}
              </p>
            </>
          )}

          {subj.ros && (
            <>
              <p className="font-bold text-black mt-3">Review of Systems:</p>
              <div className="space-y-1">{renderROS(subj.ros)}</div>
            </>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Textarea
            rows={2}
            placeholder="Chief Complaint..."
            value={subj.chief_complaint || ""}
            onChange={(e) => setField("chief_complaint", e.target.value)}
          />
          <Textarea
            rows={4}
            placeholder="History of Present Illness..."
            value={subj.hpi || ""}
            onChange={(e) => setField("hpi", e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="Family History Discussed..."
            value={subj.family_history || ""}
            onChange={(e) => setField("family_history", e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="Surgical History Discussed..."
            value={subj.surgical_history || ""}
            onChange={(e) => setField("surgical_history", e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="Social History Discussed..."
            value={subj.social_history || ""}
            onChange={(e) => setField("social_history", e.target.value)}
          />
          <Textarea
            rows={4}
            placeholder="Review of Systems..."
            value={subj.ros || ""}
            onChange={(e) => setField("ros", e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default SubjectiveSection
