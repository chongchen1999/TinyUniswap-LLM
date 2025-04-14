import React from "react";
import DebugPanel from "./DebugPanel";

type ResponseDisplayProps = {
  response: string;
  actionTaken?: string | null;
  debugInfo: any;
};

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ 
  response, 
  actionTaken, 
  debugInfo 
}) => {
  if (!response) return null;

  const displayResponse = actionTaken 
    ? `${response}\n\n[${actionTaken}]` 
    : response;

  return (
    <div className="bg-base-100 shadow-lg shadow-accent border-8 border-accent rounded-xl p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">Latest Response</h2>
      <div className="bg-accent bg-opacity-10 p-4 rounded-lg">
        <p className="whitespace-pre-line font-medium">{displayResponse}</p>
      </div>
      
      <DebugPanel debugInfo={debugInfo} />
    </div>
  );
};

export default ResponseDisplay;