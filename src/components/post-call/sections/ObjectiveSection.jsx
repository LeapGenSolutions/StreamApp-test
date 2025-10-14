import { Textarea } from "../../ui/textarea";
import { normalizeVitalLabel } from "../utils/soapUtils";

const ObjectiveSection = ({ isEditing, soapNotes, setSoapNotes }) => {
  let data;
  try {
    data = JSON.parse(soapNotes.Objective || "{}");
  } catch {
    data = { exams: [], observations: [], tests: [] };
  }

  const vitals = [];
  const physical = [];
  const allEntries = [
    ...(data.observations || []),
    ...(data.exams || []),
    ...(data.tests || []),
  ];

  const vitalKeywords = [
    "bp", "blood pressure",
    "hr", "heart rate", "pulse",
    "temp", "temperature",
    "rr", "respiratory rate",
    "o2 sat", "oxygen saturation",
    "bmi",
  ];

  allEntries.forEach((entry) => {
    if (!entry) return;

    if (/^Vitals[:/-]/i.test(entry)) {
      const vitalsPart = entry.replace(/^Vitals[:/-]\s*/i, "");
      const vitalItems = vitalsPart.split(/[,;]\s*/);

      vitalItems.forEach((vital) => {
        let match =
          vital.match(/^(.+?)([:=/-])\s*(.+)$/) ||
          vital.match(/^([A-Za-z\s]+?)\s+([\d][\s\S]*)$/);
        if (match) {
          const rawLabel = match[1].trim();
          const value = match[3] || match[2];
          const norm = normalizeVitalLabel(rawLabel);
          vitals.push({ rawLabel, label: norm, value: value.trim() });
        }
      });
    } else {
      let match =
        entry.match(/^(.+?)([:=/-])\s*(.+)$/) ||
        entry.match(/^([A-Za-z\s]+?)\s+([\d][\s\S]*)$/);

      if (match) {
        const rawLabel = match[1].trim();
        const value = match[3] || match[2];
        const norm = normalizeVitalLabel(rawLabel);

        if (vitalKeywords.some((v) => norm.toLowerCase().includes(v))) {
          vitals.push({ rawLabel, label: norm, value: value.trim() });
        } else {
          physical.push(`${rawLabel}: ${value.trim()}`);
        }
      } else {
        physical.push(entry);
      }
    }
  });

  const updateVitals = (updatedVitals) => {
    data.exams = [
      ...updatedVitals.map((v) => `${v.rawLabel || v.label}: ${v.value}`),
      ...physical,
    ];
    setSoapNotes({ ...soapNotes, Objective: JSON.stringify(data, null, 2) });
  };

  return (
    <div className="space-y-3">
      <p className="font-semibold text-blue-700 text-lg">Objective</p>

      {/* --- Vitals --- */}
      {vitals.length > 0 && (
        <div className="text-base leading-relaxed text-gray-900">
          <p className="text-base font-bold text-blue-700 mb-1">Vital Signs:</p>
          <table className="w-auto border-collapse border border-gray-300 text-sm">
            <thead className="bg-white">
              <tr>
                <th className="border border-gray-300 px-2 py-1 text-left font-bold">Measure</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-bold">Value</th>
                {isEditing && <th className="border border-gray-300 px-2 py-1"></th>}
              </tr>
            </thead>
            <tbody>
              {vitals.map((v, idx) => (
                <tr key={idx} className="border border-gray-300">
                  <td className="px-2 py-1 font-medium w-1/3">
                    {isEditing ? (
                      <input
                        className="border p-1 rounded w-full text-sm"
                        value={v.rawLabel}
                        onChange={(e) => {
                          const updated = [...vitals];
                          updated[idx].rawLabel = e.target.value;
                          updated[idx].label = normalizeVitalLabel(e.target.value);
                          updateVitals(updated);
                        }}
                      />
                    ) : (
                      v.label
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {isEditing ? (
                      <input
                        className="border p-1 rounded w-full text-sm"
                        value={v.value}
                        onChange={(e) => {
                          const updated = [...vitals];
                          updated[idx].value = e.target.value;
                          updateVitals(updated);
                        }}
                      />
                    ) : (
                      v.value
                    )}
                  </td>
                  {isEditing && (
                    <td className="px-2 py-1 text-right">
                      <button
                        className="text-red-600 text-xs"
                        onClick={() => {
                          const updated = vitals.filter((_, i) => i !== idx);
                          updateVitals(updated);
                        }}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Physical Exam --- */}
      {physical.length > 0 && (
        <div className="text-base leading-relaxed text-gray-900">
          <p className="text-base font-bold text-blue-700 mb-1">Physical Exam:</p>
          {isEditing ? (
            <Textarea
              className="w-full border p-2 rounded"
              rows={6}
              value={physical.join("\n")}
              onChange={(e) => {
                const updatedPhysical = e.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean);
                data.exams = [
                  ...vitals.map((v) => `${v.rawLabel}: ${v.value}`),
                  ...updatedPhysical,
                ];
                setSoapNotes({ ...soapNotes, Objective: JSON.stringify(data, null, 2) });
              }}
            />
          ) : (
            <ul className="list-disc ml-5 space-y-1">
              {physical.map((line, idx) => {
                const [head, ...rest] = line.split(":");
                const label = head?.replace(/\s+(exam|sounds|check)$/i, "").trim();
                const value = rest.join(":").trim();
                return (
                  <li key={idx}>
                    <span className="font-semibold">{label}:</span> {value}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectiveSection
