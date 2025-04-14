// packages/nextjs/app/NLI/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import NLIChat from "./components/NLIChat";
import SwapAnalytics from "./components/SwapAnalytics";
import TabNavigation, { Tab } from "./components/TabNavigation";
import TestCaseManager from "./components/TestCaseManager";
import { createContext } from 'react';

// Create a context for sharing model selection state
export const ModelContext = createContext({
  selectedOpenAIModel: 'gpt-4o-mini',
  selectedOpenSourceModel: 'llama-3.3-70b-instruct',
  setSelectedOpenAIModel: (model: string) => {},
  setSelectedOpenSourceModel: (model: string) => {},
});

// Define tabs for the interface
const tabs: Tab[] = [
  { id: "chat", label: "Natural Language Interface", icon: "💬" },
  { id: "testcases", label: "Test Cases", icon: "🧪" },
  { id: "analytics", label: "Swap Analytics", icon: "📊" }
];

/**
 * Integrated Natural Language Interface, Test Cases, and Swap Analytics page component
 */
const NLI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [selectedOpenAIModel, setSelectedOpenAIModel] = useState("gpt-4o-mini");
  const [selectedOpenSourceModel, setSelectedOpenSourceModel] = useState("llama-3.3-70b-instruct");
  
  // Listen for tab switch events from components
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      if (event.detail && tabs.some(tab => tab.id === event.detail)) {
        setActiveTab(event.detail);
      }
    };
    
    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, []);

  return (
    <ModelContext.Provider value={{
      selectedOpenAIModel,
      selectedOpenSourceModel,
      setSelectedOpenAIModel,
      setSelectedOpenSourceModel
    }}>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-bold text-center mb-6">DEX Interface</h1>
        
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        {activeTab === "chat" ? (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">Natural Language Interface</h2>
            <NLIChat selectedModel={selectedOpenAIModel} />
          </>
        ) : activeTab === "testcases" ? (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">NLI Test Cases</h2>
            <TestCaseManager />
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-center mb-6">Swap Analytics</h2>
            <SwapAnalytics />
          </>
        )}
      </div>
    </ModelContext.Provider>
  );
};

export default NLI;