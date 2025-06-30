import { 
  ArrowLeft,
  Calendar
} from "lucide-react";

export function PageNavigation({ 
  title,
  subtitle,
  className = "",
  showBackButton = true,
  showDate = false,
  hideTitle = false
}) {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className={`mb-6 ${className}`}>
      {/* Back Button */}
      {showBackButton && (
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium 
           text-white bg-blue-600 border border-blue-700 rounded-lg 
           hover:bg-blue-700 transition-colors duration-200"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Go Back
          </button>
        </div>
      )}

      {/* Title Section */}
      {!hideTitle && title && (
        <div>
          <h1 className="text-2xl font-bold text-black">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Date Display */}
      {showDate && (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-2">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      )}
    </div>
  );
} 