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

const ObjectiveSection = ({ soapNotes, setSoapNotes, isEditing }) => {
  const obj = soapNotes.objective || {};

  const setObj = (next) => setSoapNotes({ ...soapNotes, objective: next });

  const handleVitalChange = (k, v) => {
    setObj({ ...obj, vital_signs: { ...(obj.vital_signs || {}), [k]: v } });
  };

  return (
    <div className="pt-2 text-gray-900 leading-relaxed space-y-2">
      <p className="font-semibold text-blue-700 text-lg">Objective</p>

      {/* --- Vital Signs --- */}
      {obj.vital_signs && (
        <div>
          <p className="font-bold text-black mt-1">Vital Signs:</p>
          <table className="border border-gray-300 mt-1 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-1 text-left font-bold text-black-800">
                  Measure
                </th>
                <th className="border px-3 py-1 text-left font-bold text-black-800">
                  Value
                </th>
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
                      <input
                        className="border rounded px-2 py-1 text-sm w-full"
                        value={v}
                        onChange={(e) => handleVitalChange(k, e.target.value)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Physical Exam --- */}
      {obj.physical_exams && (
        <div>
          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="font-bold text-black">Physical Exam:</p>
            <CopyIconButton
              text={Object.entries(obj.physical_exams || {})
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n")}
              label="Physical Exam"
            />
          </div>
          <ul className="list-disc ml-6 text-[15px] leading-relaxed">
            {Object.entries(obj.physical_exams).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3">
                <span>
                  <b>{k}:</b>{" "}
                  {!isEditing ? (
                    v
                  ) : (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full max-w-xl"
                      value={v}
                      onChange={(e) =>
                        setObj({
                          ...obj,
                          physical_exams: {
                            ...(obj.physical_exams || {}),
                            [k]: e.target.value,
                          },
                        })
                      }
                    />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Labs --- */}
      {obj.laboratory_data?.length > 0 && (
        <div>
          <p className="font-bold text-black mt-3">Laboratory Data:</p>
          <ul className="list-disc ml-6 text-[15px] leading-relaxed">
            {obj.laboratory_data.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span>{item}</span>
                <CopyIconButton text={item} label="Lab item" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Imaging --- */}
      {obj.imaging_studies?.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="font-bold text-black">Imaging Studies:</p>
            <CopyIconButton
              text={(obj.imaging_studies || []).join("\n")}
              label="Imaging Studies"
            />
          </div>
          <ul className="list-disc ml-6 text-[15px] leading-relaxed">
            {obj.imaging_studies.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ObjectiveSection
