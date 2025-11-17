import React, { useState } from 'react'
import LoadingCard from './LoadingCard';
import { useQuery } from '@tanstack/react-query';
import { fetchSentimentAnalysis } from '../../api/emotionalConnect';

const SentimentAnalysis = ({ appointmentId, username }) => {
    const [openProof, setOpenProof] = useState({});

    const { data : total_data, isLoading, error } = useQuery({
        queryKey: ["sentiment_analysis", appointmentId, username],
        queryFn: () => fetchSentimentAnalysis(`${username}_${appointmentId}_sentiment`, username),
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
            { !isLoading && !error && <div className="max-w-5xl mx-auto">
                <h3 className="font-medium text-2xl text-gray-800 mb-3">Sentiment analysis</h3>
                <h4 className="text-gray-500 font-semibold mb-1">Confidence : {data.confidence?.score ?? 'n/a'}</h4>
                <div className="mt-2 text-sm text-gray-500 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.confidence?.proof}</div>

                <div className="divide-y divide-gray-100">
                    <section className="py-6">
                        <div className="md:flex md:items-start md:justify-between">
                            <div className="md:pr-8">
                                <h4 className="text-blue-700 font-semibold mb-2">Summary</h4>
                                <div className="text-gray-800">{data.overall_summary?.statement}</div>
                                {openProof['overall_summary'] && (
                                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.overall_summary?.proof}</div>
                                )}
                            </div>
                            <div className="mt-4 md:mt-0">
                                <button onClick={() => toggleProof('overall_summary')} className="bg-blue-600 text-white rounded px-3 text-sm hover:bg-blue-700 w-32 h-8 flex items-center justify-center whitespace-nowrap">
                                    {openProof['overall_summary'] ? 'Hide conversation' : 'Show conversation'}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="py-6">
                        <div>
                            <h4 className="text-blue-700 font-semibold mb-2">Sentiment breakdown</h4>
                            <div className="space-y-3">
                                {['positive','negative'].map((k) => (
                                    <div key={k}>
                                        <div className="text-gray-800 font-medium capitalize">{k} — {data.sentiment_breakdown[k]?.score}%</div>
                                        <div className="text-sm text-gray-600">{data.sentiment_breakdown[k]?.statement}</div>
                                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.sentiment_breakdown[k]?.proof}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="py-6">
                        <div>
                            <h4 className="text-blue-700 font-semibold mb-2">Self perception of progress</h4>
                            <div className="text-gray-800">{data.self_perception_of_progress?.statement}</div>
                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-100 p-3 rounded">{data.self_perception_of_progress?.proof}</div>
                        </div>
                    </section>
                </div>
            </div>}
        </div>
    )
}

export default SentimentAnalysis