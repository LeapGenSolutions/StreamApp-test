import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SentimentAnalysis from "./SentimentAnalysis";
import EmotionalEmpathy from "./EmotionalEmpathy";
import LongitudinalSentiment from "./longitudinal_sentiment";


const EmotionalConnect = (props) => {
    const [selectTab, setSelectTab] = useState("emotionalEmpathy");
    const { username, appointmentId, appointment} = props;
    const tabs = [
        { id: "emotionalEmpathy", label: "Emotional Empathy" },
        { id: "sentimentAnalysis", label: "Sentiment Analysis" },
        { id: "longitudinalSentiment", label: "Longitudinal Sentiment" },
    ];
  return (
    <>
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Emotional Connect</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex space-x-2 mb-6 justify-left">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`px-4 py-2 rounded font-medium ${
                                selectTab === tab.id
                                ? "bg-blue-600 text-white"
                                : "bg-white text-neutral-800 border border-b-0"
                            } transition`}
                            onClick={() => setSelectTab(tab.id)}
                        >
                        {tab.label}
                        </button>
                    ))}
                </div>
                {selectTab === "emotionalEmpathy" && (
                    <EmotionalEmpathy username={username} appointmentId={appointmentId} appointment={appointment} />
                )}
                {selectTab === "sentimentAnalysis" && (
                    <SentimentAnalysis username={username} appointmentId={appointmentId} />
                )}
                {selectTab === "longitudinalSentiment" && (
                    <LongitudinalSentiment username={username} appointmentId={appointmentId} />
                )}
            </CardContent>
        </Card>
    </>
  )
}

export default EmotionalConnect