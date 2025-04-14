import React, { useState } from "react";

interface DebugPanelProps {
  debugInfo: any;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ debugInfo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!debugInfo) return null;
  
  return (
    <div className="mt-6">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <span>{isExpanded ? "Hide" : "Show"} Debug Info</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;