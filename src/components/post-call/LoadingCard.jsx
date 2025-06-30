// src/components/post-call/loading-card.jsx
import { Stethoscope } from "lucide-react";

const LoadingCard = ({ message }) => {
  const fallbackMessage =
    "Vitals stable, insights loading… Might be a good time for a quick breather! Stretch, hydrate, and check back soon...";

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 text-blue-800">
      {/* Spinner ring with stethoscope inside */}
      <div className="relative w-16 h-16 mb-6">
        {/* Spinner ring */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-300 border-t-transparent animate-spin" />

        {/* Stethoscope icon */}
        <div className="flex items-center justify-center w-full h-full">
          <Stethoscope className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Realistic EKG heartbeat line */}
      <svg
        viewBox="0 0 100 20"
        className="w-56 h-6 mb-4 text-blue-500"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="200"
          strokeDashoffset="200"
          points="0,10 5,10 10,3 13,17 16,10 22,10 27,6 30,14 34,10 40,10 46,2 49,18 52,10 58,10 63,7 66,14 70,10 100,10"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="200"
            to="0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </polyline>
      </svg>

      {/* Message below */}
      <p className="text-sm">{message || fallbackMessage}</p>
    </div>
  );
};

export default LoadingCard;
