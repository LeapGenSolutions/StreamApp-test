import React, {useState } from 'react'
import { fetchEmotionalEmpathy } from '../../api/emotionalConnect';
import { useQuery } from '@tanstack/react-query';
import LoadingCard from './LoadingCard';

const EmotionalEmpathy = (props) => {
    const { appointmentId, username, patientId } = props;
    const [openProof, setOpenProof] = useState({});
    const { data: total_data, isLoading, error } = useQuery({
        queryKey: ["emotionalEmpathy", appointmentId, username],
        queryFn: () => fetchEmotionalEmpathy(patientId, username),
    })

    const data = total_data ? total_data.data : {};

    const toggleProof = (key) => {
        setOpenProof((p) => ({ ...p, [key]: !p[key] }));
    };

    if (isLoading) {
        return (
            <LoadingCard message="Emotional empathy in progress…" />
        );
    }

    if(error){
        return <LoadingCard />;
    }

    return (
        <div className="p-8 bg-white border border-gray-100 rounded-lg">
            {!isLoading && !error && <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Emotional Empathy</h2>
                <h4 className="text-gray-500 font-semibold mb-1">Confidence : {data.confidence?.score ?? 'n/a'}</h4>
                <div className="mt-2 text-sm text-gray-500 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.confidence?.proof}</div>

                <div className="divide-y divide-gray-100">
                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h3 className="text-blue-700 font-semibold mb-2">Summary</h3>
                                <p className="text-gray-800 leading-relaxed">{data.summary}</p>
                            </div>
                        </div>
                    </section>
                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h3 className="text-blue-700 font-semibold mb-2">Communication style</h3>
                                <p className="text-gray-800 leading-relaxed">{data.communication_style?.statement}</p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button onClick={() => toggleProof('communication_style')} className="bg-blue-600 text-white rounded px-3 text-sm hover:bg-blue-700 w-32 h-8 flex items-center justify-center whitespace-nowrap">
                                    {openProof['communication_style'] ? 'Hide conversation' : 'Show conversation'}
                                </button>
                            </div>
                        </div>
                        {openProof['communication_style'] && (
                            <div className="mt-4 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.communication_style?.proof}</div>
                        )}
                    </section>

                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h3 className="text-blue-700 font-semibold mb-2">Response to information</h3>
                                <p className="text-gray-800 leading-relaxed">{data.response_to_information?.statement}</p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button onClick={() => toggleProof('response_to_information')} className="bg-blue-600 text-white rounded px-3 text-sm hover:bg-blue-700 w-32 h-8 flex items-center justify-center whitespace-nowrap">
                                    {openProof['response_to_information'] ? 'Hide conversation' : 'Show conversation'}
                                </button>
                            </div>
                        </div>
                        {openProof['response_to_information'] && (
                            <div className="mt-4 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.response_to_information?.proof}</div>
                        )}
                    </section>

                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h3 className="text-blue-700 font-semibold mb-2">Attitude toward treatment</h3>
                                <p className="text-gray-800 leading-relaxed">{data.attitude_toward_treatment?.statement}</p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button onClick={() => toggleProof('attitude_toward_treatment')} className="bg-blue-600 text-white rounded px-3 text-sm hover:bg-blue-700 w-32 h-8 flex items-center justify-center whitespace-nowrap">
                                    {openProof['attitude_toward_treatment'] ? 'Hide conversation' : 'Show conversation'}
                                </button>
                            </div>
                        </div>
                        {openProof['attitude_toward_treatment'] && (
                            <div className="mt-4 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.attitude_toward_treatment?.proof}</div>
                        )}
                    </section>

                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h3 className="text-blue-700 font-semibold mb-4">Motivations & drivers</h3>
                                {Array.isArray(data.motivations_and_drivers) && data.motivations_and_drivers.length > 0 ? (
                                    data.motivations_and_drivers.length > 1 ? (
                                        <ul className="ml-6 list-disc space-y-4">
                                            {data.motivations_and_drivers.map((m, i) => (
                                                <li key={i} className="text-gray-800 pl-2">
                                                    <div>{m.driver}</div>
                                                    {openProof['motivations_and_drivers'] && (
                                                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{m.proof}</div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-gray-800">
                                            <div>{data.motivations_and_drivers[0].driver}</div>
                                            {openProof['motivations_and_drivers'] && (
                                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.motivations_and_drivers[0].proof}</div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <p className="text-gray-500 italic">No items.</p>
                                )}
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button onClick={() => toggleProof('motivations_and_drivers')} className="bg-blue-600 text-white rounded px-3 text-sm hover:bg-blue-700 w-32 h-8 flex items-center justify-center whitespace-nowrap">
                                    {openProof['motivations_and_drivers'] ? 'Hide conversation' : 'Show conversation'}
                                </button>
                            </div>
                        </div>

                        {/* proofs are rendered inline under each item above when the section is open */}
                    </section>

                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h3 className="text-blue-700 font-semibold mb-4">Stress triggers / barriers</h3>
                                {Array.isArray(data.stress_triggers_or_barriers) && data.stress_triggers_or_barriers.length > 0 ? (
                                    data.stress_triggers_or_barriers.length > 1 ? (
                                        <ul className="ml-6 list-disc space-y-4">
                                            {data.stress_triggers_or_barriers.map((s, i) => (
                                                <li key={i} className="text-gray-800 pl-2">
                                                    <div>{s.trigger}</div>
                                                    {openProof['stress_triggers_or_barriers'] && (
                                                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{s.proof}</div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-gray-800">
                                            <div>{data.stress_triggers_or_barriers[0].trigger}</div>
                                            {openProof['stress_triggers_or_barriers'] && (
                                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.stress_triggers_or_barriers[0].proof}</div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <p className="text-gray-500 italic">No items.</p>
                                )}
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button onClick={() => toggleProof('stress_triggers_or_barriers')} className="bg-blue-600 text-white rounded px-3 text-sm hover:bg-blue-700 w-32 h-8 flex items-center justify-center whitespace-nowrap">
                                    {openProof['stress_triggers_or_barriers'] ? 'Hide conversation' : 'Show conversation'}
                                </button>
                            </div>
                        </div>

                        {/* proofs inline rendered above when section is open */}
                    </section>

                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h3 className="text-blue-700 font-semibold mb-4">Personal interests</h3>
                                {Array.isArray(data.personal_interests) && data.personal_interests.length > 0 ? (
                                    data.personal_interests.length > 1 ? (
                                        <ul className="ml-6 list-disc space-y-4">
                                            {data.personal_interests.map((p, i) => (
                                                <li key={i} className="text-gray-800 pl-2">
                                                    <div>{p.interest}</div>
                                                    {openProof['personal_interests'] && (
                                                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{p.proof}</div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-gray-800">
                                            <div>{data.personal_interests[0].interest}</div>
                                            {openProof['personal_interests'] && (
                                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.personal_interests[0].proof}</div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <p className="text-gray-500 italic">No items.</p>
                                )}
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button onClick={() => toggleProof('personal_interests')} className="bg-blue-600 text-white rounded px-3 text-sm hover:bg-blue-700 w-32 h-8 flex items-center justify-center whitespace-nowrap">
                                    {openProof['personal_interests'] ? 'Hide conversation' : 'Show conversation'}
                                </button>
                            </div>
                        </div>

                        {/* proofs inline rendered above when section is open */}
                    </section>

                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h3 className="text-blue-700 font-semibold mb-2">Recommended approach</h3>
                                <p className="text-gray-800 leading-relaxed">{data.recommended_approach?.statement}</p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button onClick={() => toggleProof('recommended_approach')} className="bg-blue-600 text-white rounded px-3 text-sm hover:bg-blue-700 w-32 h-8 flex items-center justify-center whitespace-nowrap">
                                    {openProof['recommended_approach'] ? 'Hide conversation' : 'Show conversation'}
                                </button>
                            </div>
                        </div>
                        {openProof['recommended_approach'] && (
                            <div className="mt-4 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.recommended_approach?.proof}</div>
                        )}
                    </section>
                </div>
            </div>}
        </div>
    );
};

export default EmotionalEmpathy;