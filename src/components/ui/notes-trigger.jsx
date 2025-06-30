import { useState } from "react";
//import { Button } from "./button";
import { StickyNote, PenTool, Sparkles } from "lucide-react";

export function NotesTrigger({ 
  onToggle, 
  isOpen, 
  patientName, 
  className = "" 
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {/* Sparkles Animation */}
      {isHovered && (
        <>
          <Sparkles className="absolute -top-2 -left-2 w-4 h-4 text-yellow-300 animate-pulse" />
          <Sparkles className="absolute -top-1 right-0 w-3 h-3 text-yellow-300 animate-pulse delay-75" />
          <Sparkles className="absolute bottom-0 -left-1 w-3 h-3 text-yellow-300 animate-pulse delay-150" />
        </>
      )}

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-3 px-4 py-2.5 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl shadow-xl whitespace-nowrap">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-blue-400" />
            <span className="font-medium">Quick Notes During Call</span>
          </div>
          {patientName && (
            <div className="text-xs text-gray-300 mt-1.5 pl-6">
              Patient: {patientName}
            </div>
          )}
          <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-gray-900/95 transform rotate-45"></div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          w-16 h-16 rounded-full 
          bg-gradient-to-r from-blue-500 to-purple-600
          shadow-lg shadow-blue-500/25
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:shadow-xl hover:shadow-blue-500/30
          relative
          ${isOpen ? 'scale-90 rotate-12' : 'scale-100 rotate-0'}
          ${isHovered ? 'scale-110' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
        `}
        aria-label="Toggle quick notes"
      >
        <div className={`
          transition-transform duration-300
          ${isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}
        `}>
          {isOpen ? (
            <PenTool className="w-7 h-7 text-white" />
          ) : (
            <StickyNote className="w-7 h-7 text-white" />
          )}
        </div>
      </button>

      {/* Active indicator */}
      {isOpen && (
        <div className="absolute -top-1 -right-1 flex space-x-1">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        </div>
      )}
    </div>
  );
} 