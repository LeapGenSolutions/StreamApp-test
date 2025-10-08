import { Textarea } from "../../ui/textarea";

const AssessmentPlanSection = ({ isEditing, soapNotes, setSoapNotes, patientLine, reasonLine }) => {
  if (isEditing) {
    return (
      <>
        <Textarea
          value={soapNotes.Assessment}
          onChange={(e) => setSoapNotes({ ...soapNotes, Assessment: e.target.value })}
          rows={4}
        />
        <Textarea
          value={soapNotes.Plan}
          onChange={(e) => setSoapNotes({ ...soapNotes, Plan: e.target.value })}
          rows={4}
        />
      </>
    );
  }

  // --- Combine and parse ---
  const combined = `${soapNotes.Assessment}\n${soapNotes.Plan}`.trim();
  const lines = combined.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const sections = new Map();
  let currentHeading = null;

  lines.forEach((line) => {
    const headingMatch = line.match(/^\[?([A-Za-z][\w\s\-()]+)\]?:$/i);
    const inlineHeaderMatch = line.match(/^\[?([A-Za-z][\w\s\-()]+)\]?:\s*(.+)/i);
    const numberedHeadingMatch = line.match(/^(\d+\.\s*)([A-Za-z][\w\s\-()]+):\s*(.+)?$/i);

    if (/^Assessment\s+Plan[:]?$/i.test(line)) {
      currentHeading = "Assessment & Plan";
      if (!sections.has(currentHeading)) sections.set(currentHeading, []);
      return;
    }

    if (headingMatch && !inlineHeaderMatch) {
      currentHeading = headingMatch[1].trim();
      if (!sections.has(currentHeading)) sections.set(currentHeading, []);
    } else if (inlineHeaderMatch) {
      const heading = inlineHeaderMatch[1].trim();
      const content = inlineHeaderMatch[2].trim();
      if (!sections.has(heading)) sections.set(heading, []);
      sections.get(heading).push(content);
      currentHeading = heading;
    } else if (numberedHeadingMatch) {
      const heading = numberedHeadingMatch[2].trim();
      const content = numberedHeadingMatch[3]?.trim() || "";
      currentHeading = heading;
      if (!sections.has(currentHeading)) sections.set(currentHeading, []);
      if (content) sections.get(currentHeading).push(content);
    } else if (currentHeading) {
      sections.get(currentHeading).push(line.replace(/^[•/-]\s*/, ""));
    } else {
      if (!sections.has("Notes")) sections.set("Notes", []);
      sections.get("Notes").push(line);
    }
  });

  return (
    <div className="space-y-4">
      {patientLine && reasonLine && (
        <p className="font-semibold">
          {(() => {
            const match = patientLine.match(/(.*?),\s*(\d+)\s*years old,\s*(F|M)/i);
            if (match) {
              const name = match[1];
              const age = match[2];
              const gender = match[3];
              const cleanedReason = reasonLine
                .replace(/^Patient presents with\s*/i, "")
                .replace(/^Patient reports\s*/i, "")
                .trim();
              return `${name} is a ${age}-year-old ${gender} with a chief complaint of ${cleanedReason}`;
            }
            const cleanedReason = reasonLine
              .replace(/^Patient presents with\s*/i, "")
              .replace(/^Patient reports\s*/i, "")
              .trim();
            return `${patientLine} with a chief complaint of ${cleanedReason}`;
          })()}
        </p>
      )}

      {[...sections.entries()].map(([heading, bullets], idx) => (
        <div key={idx} className="space-y-1">
          <p className="font-semibold text-black">{heading}:</p>
          <ul className="list-disc ml-5 text-sm space-y-1">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default AssessmentPlanSection