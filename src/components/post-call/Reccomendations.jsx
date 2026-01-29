import { useQuery } from "@tanstack/react-query";
import { fetchRecommendationByAppointment } from "../../api/recommendations";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";
import LoadingCard from "./LoadingCard";
import UpToDate from "./UpToDate";

const Reccomendations = ({ appointmentId, username }) => {
  const { data: reccomendations , isLoading, error } = useQuery({
    queryKey: ["recommendations", appointmentId, username],
    queryFn: () =>
      fetchRecommendationByAppointment(
        `${username}_${appointmentId}_recommendations`,
        username
      ),
  });
  const [text, setText] = useState(null);
  const [active, setActive] = useState("recommendations");

  useEffect(() => {
    if (reccomendations) {
      setText(reccomendations.data.recommendations);
    } else {
      setText("No recommendations available.");
    }
  }, [reccomendations]);

  useEffect(() => {
    if (text) {
      setText(text.replaceAll("####", "## ").replaceAll("###", "# "));
    }
  }, [text]);

  if (isLoading) {
    return <LoadingCard message="From symptoms to strategy… aligning recommendations." />;
  }

  if (error) {
    return <LoadingCard />;
  }

  return (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">Recommendations</h2>

          <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setActive("recommendations")}
            aria-pressed={active === "recommendations"}
            className={`px-6 py-2 rounded-md border shadow-sm text-sm font-medium ${
              active === "recommendations"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700"
            }`}
          >
            Recommendations
          </button>

          <button
            onClick={() => setActive("uptodate")}
            aria-pressed={active === "uptodate"}
            className={`px-6 py-2 rounded-md border shadow-sm text-sm font-medium ${
              active === "uptodate"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700"
            }`}
          >
            UpToDate
          </button>
        </div>
      </div>

      <style>
        {`.markdown h1 {
            font-size: 1.5rem;
            font-weight: bold;
            margin-top: 0.5rem;
          }

          .markdown h2 {
            font-size: 1rem;
            font-weight: bold;
            margin-top: 0.5rem;
          }

          .markdown p {
            line-height: 1.6;
            margin: 0.5rem 0;
          }`}
      </style>

      {active === "recommendations" ? (
        <div className="markdown">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      ) : (
        <div>
          <UpToDate appId={appointmentId} username={username} data={reccomendations?.data} />
        </div>
      )}
    </>
  );
};

export default Reccomendations;


