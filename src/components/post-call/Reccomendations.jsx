import { useQuery } from "@tanstack/react-query";
import { fetchRecommendationByAppointment } from "../../api/recommendations";
import ReactMarkdown from "react-markdown";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import LoadingCard from "./LoadingCard";

const Reccomendations = ({ appointmentId }) => {
  const username = useSelector((state) => state.me.me.email);
  const { data: reccomendations , isLoading, error } = useQuery({
    queryKey: "recommendations",
    queryFn: () =>
      fetchRecommendationByAppointment(
        `${username}_${appointmentId}_recommendations`,
        username
      ),
  });
  const [text, setText] = useState(null);

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
    return (
      <div className="text-red-500 text-center p-4">
        Unable to fetch recommendations...!!
      </div>
    );
  }

  return (
    <>
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
      <div className="markdown">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </>
  );
};

export default Reccomendations;


