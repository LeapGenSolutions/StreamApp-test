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
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                     bg-white border border-gray-200 rounded-lg hover:bg-gray-50 
                     hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 
                     dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white
                     transition-colors duration-200"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
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