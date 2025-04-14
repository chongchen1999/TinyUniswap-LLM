import React from "react";

interface LoadingStateProps {
  inline?: boolean;
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  inline = false,
  message = "Processing your request..."
}) => {
  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span>Processing...</span>
      </div>
    );
  }
  
  return (
    <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mb-8">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;