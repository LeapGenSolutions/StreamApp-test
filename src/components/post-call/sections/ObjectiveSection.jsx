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
  const allEntries = [...(data.exams || []), ...(data.tests || [])];

  const vitalKeywords = [
    "bp", "blood pressure",
    "hr", "heart rate", "pulse",
    "temp", "temperature",
    "rr", "respiratory rate",
    "o2 sat", "oxygen saturation",
    "bmi"
  ];

  // --- Parsing vitals vs physical ---
  allEntries.forEach((entry) => {
    if (!entry) return;

    if (/^Vitals[:/-]/i.test(entry)) {
      // Multiple vitals in one line
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
      // Single entry
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

  // --- Update helper ---
  const updateVitals = (updatedVitals) => {
    data.exams = [
      ...updatedVitals.map((v) => `${v.rawLabel || v.label}: ${v.value}`),
      ...physical
    ];
    setSoapNotes({ ...soapNotes, Objective: JSON.stringify(data, null, 2) });
  };

  return (
    <div className="space-y-4">
      {/* Vitals */}
      {vitals.length > 0 && (
        <div>
          <h4 className="text-blue-700 font-semibold text-lg">Vitals</h4>
          <table className="w-full border border-gray-300 text-sm rounded">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left w-1/3">Vital</th>
                <th className="p-2 text-left">Value</th>
                {isEditing && <th className="p-2"></th>}
              </tr>
            </thead>
            <tbody>
              {vitals.map((v, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 font-medium w-1/3">
                    {isEditing ? (
                      <input
                        className="border p-1 rounded w-full"
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
                  <td className="p-2">
                    {isEditing ? (
                      <input
                        className="border p-1 rounded w-full"
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
                    <td className="p-2 text-right">
                      <button
                        className="text-red-600 text-sm"
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

      {/* Physical Exam */}
      {physical.length > 0 && (
        <div>
          <h4 className="text-blue-700 font-semibold text-lg">Physical Exam</h4>
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
                  ...updatedPhysical
                ];
                setSoapNotes({ ...soapNotes, Objective: JSON.stringify(data, null, 2) });
              }}
            />
          ) : (
            <ul className="list-disc ml-5 space-y-1 text-sm">
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