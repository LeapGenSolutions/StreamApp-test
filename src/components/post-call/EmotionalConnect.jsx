import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SentimentAnalysis from "./SentimentAnalysis";
import EmotionalEmpathy from "./EmotionalEmpathy";
import LongitudinalSentiment from "./longitudinal_sentiment";


const EmotionalConnect = (props) => {
    const [selectTab, setSelectTab] = useState("Emotional Empathy");
    const { username, appointmentId, patientId} = props;
  return (
    <>
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Emotional Connect</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex space-x-2 mb-6 justify-left">
                    {[
                        "Emotional Empathy",
                        "Sentiment Analysis",
                        "Longitudinal Sentiment"
                    ].map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 rounded font-medium ${
                                selectTab === tab
                                ? "bg-blue-600 text-white"
                                : "bg-white text-neutral-800 border border-b-0"
                            } transition`}
                            onClick={() => setSelectTab(tab)}
                        >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                {selectTab === "Emotional Empathy" && (
                    <EmotionalEmpathy username={username} appointmentId={appointmentId} patientId={patientId} />
                )}

                {selectTab === "Sentiment Analysis" && (
                    <SentimentAnalysis username={username} appointmentId={appointmentId} />
                )}
                {selectTab === "Longitudinal Sentiment" && (
                    <LongitudinalSentiment username={username} appointmentId={appointmentId} />
                )}
            </CardContent>
        </Card>
    </>
  )
}

export default EmotionalConnect