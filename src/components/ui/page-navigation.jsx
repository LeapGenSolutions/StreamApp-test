// src/components/ui/page-navigation.jsx
import { ArrowLeft, Calendar } from "lucide-react";

export function PageNavigation({
  title,
  subtitle,
  className = "",
  showBackButton = true,
  showDate = false,
  hideTitle = false,
}) {
  return (
    <div className={`mb-6 w-full ${className}`}>
      
      {/* Back Button */}
      {showBackButton && (
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium 
            text-white bg-blue-600 border border-blue-700 rounded-lg 
            hover:bg-blue-700 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
      )}

      {/* Centered Title + Subtitle (matches PageHeader) */}
      {!hideTitle && title && (
        <div className="mt-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Optional Date Section */}
      {showDate && (
        <div className="text-sm text-gray-500 flex items-center justify-center mt-2">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      )}
    </div>
  );
}
