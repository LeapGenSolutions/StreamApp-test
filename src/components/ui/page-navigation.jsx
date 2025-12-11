// src/components/ui/page-navigation.jsx
import { ArrowLeft, Calendar } from "lucide-react";

export function PageNavigation({
  title,
  subtitle,
  className = "",
  showBackButton = true,
  showDate = false,
  hideTitle = false,
  rightSlot = null,
}) {
  return (
    <div className={`mb-6 w-full ${className}`}>
      {/* Row: Left = Back | Center = Title | Right = Custom Slot */}
      <div className="grid grid-cols-3 items-center">
        {/* Left: Back Button */}
        <div>
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
        </div>

        {/* Center: Title + Subtitle */}
        {!hideTitle && title && (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

            {subtitle && (
              <p className="text-sm text-gray-500 mt-1 whitespace-nowrap">{subtitle}</p>
            )}
          </div>
        )}

        {/* Right: Optional custom content (buttons, etc.) */}
        <div className="flex justify-end">
          {rightSlot}
        </div>
      </div>

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
