import React from "react";

const VPMCLogo = ({ className = "h-10 w-auto", withText = false }) => (
  <div className="flex flex-col items-center">
    <img
      src="/vpmc_logo.png"  // ✅ public folder path
      alt="Virginia Premium Medical Care"
      className={`opacity-95 ${className}`}
    />
    {withText && (
      <p className="text-xs text-gray-500 mt-1">
        Powered by Virginia Premium Medical Care
      </p>
    )}
  </div>
);

export default VPMCLogo
