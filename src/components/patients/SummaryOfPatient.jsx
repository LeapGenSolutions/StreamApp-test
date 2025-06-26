import { useState } from "react";


const SummaryOfPatient = ({ summaryDataProp }) => {
    // if (!summaryData) return null;
    
    const [open, setOpen] = useState(false);
    const [expandedCondition, setExpandedCondition] = useState(null);
    const summaryData = summaryDataProp;
    if (!summaryData) return null;
    const { first_appointment, last_appointment, overall_summary, condition_progression } = summaryData;
    const structured = condition_progression?.structured || {};
    const summaries = condition_progression?.summaries || {};

    // Format overall summary: bold **...** and move text after to next line, add horizontal line between each condition
    const formattedOverallSummary = overall_summary
        .replace(/\*\*(.+?):\*\*/g, (match, p1) => `<strong class="text-blue-900">${p1}:</strong><br/>`)
        .replace(/\n\n/g, '<hr class="border-t-2 border-gray-200 my-4" />');

    return (
        <div className="mt-6 border-t pt-4">
            <button
                className="w-full text-left text-xl font-semibold text-gray-800 mb-4 flex justify-between items-center focus:outline-none"
                onClick={() => setOpen((prev) => !prev)}
            >
                Longitudinal Clinical Summary
                <span className={`ml-2 transition-transform ${open ? "rotate-180" : "rotate-0"}`}>▼</span>
            </button>
            {open && (
                <div className="space-y-6">
                    <div className="text-sm text-gray-700">
                        <p><strong>First Appointment:</strong> {first_appointment}</p>
                        <p><strong>Last Appointment:</strong> {last_appointment}</p>
                    </div>
                    <div className="text-sm text-gray-800 leading-relaxed space-y-3">
                        <h4 className="font-semibold text-gray-900 mt-4 mb-2 text-base">Overall Summary</h4>
                        <div className="mb-4" dangerouslySetInnerHTML={{ __html: formattedOverallSummary }} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mt-4 mb-2 text-2xl">Condition Progression</h4>
                        {Object.keys(structured).length === 0 && <div className="text-gray-500">No condition data available.</div>}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {Object.keys(structured).map((condition) => (
                                <button
                                    key={condition}
                                    className={`px-4 py-2 rounded-md border text-base font-semibold transition-all ${expandedCondition === condition ? "bg-blue-600 text-white" : "bg-gray-100 text-blue-700 hover:bg-blue-200"}`}
                                    onClick={() => setExpandedCondition(expandedCondition === condition ? null : condition)}
                                >
                                    {condition}
                                </button>
                            ))}
                        </div>
                        {expandedCondition && (
                            <div className="mb-6 border rounded-xl shadow p-4 bg-white">
                                <h5 className="text-xl font-bold text-blue-700 mb-2">{expandedCondition}</h5>
                                <div className="mb-2 text-sm">
                                    <strong>Progression:</strong>
                                    <ul className="list-disc pl-6 space-y-1">
                                        {structured[expandedCondition].progression?.map((step, idx) => (
                                            <li key={idx}>{step}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mb-2 text-sm">
                                    <strong>Medications Prescribed:</strong>
                                    <ul className="list-disc pl-6 space-y-1 text-base">
                                        {structured[expandedCondition].medications?.map((med, idx) => (
                                            <li key={idx}>{med}</li>
                                        ))}
                                    </ul>
                                </div>
                                {summaries[expandedCondition] && (
                                    <div className="mb-2 text-sm">
                                        <strong>Summary:</strong>
                                        <div className="text-gray-700 whitespace-pre-line">{summaries[expandedCondition]}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SummaryOfPatient;
