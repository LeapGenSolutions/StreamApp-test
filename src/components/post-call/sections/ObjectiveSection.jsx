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
                      v
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
          <p className="font-bold text-black mt-3">Physical Exam:</p>
          <ul className="list-disc ml-6 text-[15px] leading-relaxed">
            {Object.entries(obj.physical_exams).map(([k, v]) => (
              <li key={k}>
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
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Imaging --- */}
      {obj.imaging_studies?.length > 0 && (
        <div>
          <p className="font-bold text-black mt-3">Imaging Studies:</p>
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
