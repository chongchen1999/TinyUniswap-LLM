// packages/nextjs/app/NLI/components/TestCaseManager.tsx
import React, { useState } from "react";
import NLIChat from "./NLIChat";
import { useBlockchainContext } from "../hooks/useBlockchainContext";

// Define OpenAI models
const OPENAI_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4o", name: "GPT-4o" },
];

// Define Open Source models
const OPEN_SOURCE_MODELS = [
  { id: "llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct" },
  { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3" },
];

// Define test case type
type TestCase = {
  id: string;
  prompt: string;
  expectedResponse: string;
  openaiResponse?: string;
  openSourceResponse?: string;
  lastResult?: string;
  expanded: boolean;
  executed: boolean;
  openaiExecuted?: boolean;
  openSourceExecuted?: boolean;
};

// Define tabs for test case categories
type TestCaseCategory = "easy" | "hard" | "custom";

const TestCaseManager: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<TestCaseCategory>("easy");
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);
  const [chatHistory, setChatHistory] = useState<Record<string, any>>({});
  const [addingNewCase, setAddingNewCase] = useState(false);
  const [newCasePrompt, setNewCasePrompt] = useState("");
  const [newCaseExpected, setNewCaseExpected] = useState("");
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);
  const [selectedOpenAIModel, setSelectedOpenAIModel] = useState("gpt-4o-mini");
  const [selectedOpenSourceModel, setSelectedOpenSourceModel] = useState("llama-3.3-70b-instruct");
  const [modelExecuting, setModelExecuting] = useState<"openai" | "opensource" | null>(null);
  const { blockchainData } = useBlockchainContext();

  // Define the easy test cases
  const easyQuestions = [
    "Show me the instruction to swap 5 TokenA for TokenB", 
    "Show me the instruction to deposit 10 TokenA and 10 TokenB to the TokenA-TokenB pool", 
    "Show me the instruction to withdraw 5 of my liquidity tokens in the TokenA-TokenB pool", 
    "What are the reserves of the TokenA-TokenB pool?", 
    "Show me all the liquidity pools",
    "How much liquidity I have in each pool", 
    "How many swaps have there been in the TokenA-TokenB pool today?", 
    "What is the current price of TokenB in TokenA?", 
    "How much liquidity do I have in the TokenA-TokenB pool?", 
    "Show me the balance of my wallet",
  ];
  
  // Define the hard test cases
  const hardQuestions = [
    "What is the best route to swap 5 ETH to TokenB? Draw a conclusion by calculation.", 
    "I want to gain 20 liquidity tokens for the TokenA-TokenB pool, how much TokenA and TokenB do I need to provide?",
    "Do I have enough tokens to provide 15% of TokenA-TokenB pool liquidity?",
    "I want to get 10 TokenA, how many liquidity tokens do I need to withdraw from the TokenA-TokenB pool?",
    "How do I swap so the ratio of TokenA:TokenB in the TokenA-TokenB pool is 1:2?",
    "What percentage of liquidity should I provide to double the reserves of the TokenA-TokenB pool?",
    "Calculate my projected APY from fees in the TokenA-TokenB pool",
    "Show me price history of TokenA-TokenB pool for the last 7 days",
    "What's the slippage if I swap 10 TokenA for TokenB?",
    "What's the optimal ratio to provide TokenA-TokenB liquidity?",
  ];

  // Expected responses for easy test cases
  const easyExpectedResponses = [
    "To swap 5 TokenA for TokenB, follow these steps:\n1. Go to the 'Swap' section of the DEX interface\n2. Select TokenA as the input token\n3. Enter 5 as the amount to swap\n4. Select TokenB as the output token\n5. Review the estimated output and confirm the transaction",
    "To deposit 10 TokenA and 10 TokenB to the TokenA-TokenB pool:\n1. Navigate to the 'Liquidity' section\n2. Select the TokenA-TokenB pool\n3. Enter 10 for TokenA and 10 for TokenB\n4. Click 'Add Liquidity' and confirm the transaction",
    "To withdraw 5 liquidity tokens from the TokenA-TokenB pool:\n1. Go to the 'Liquidity' section\n2. Find your TokenA-TokenB liquidity position\n3. Enter 5 as the amount of LP tokens to withdraw\n4. Click 'Remove Liquidity' and confirm the transaction",
    "The TokenA-TokenB pool currently has the following reserves:\n- TokenA: 1,250.75\n- TokenB: 2,500.25\nThe current exchange rate is 1 TokenA = 1.999 TokenB",
    "Available liquidity pools:\n1. ETH-TokenA Pool\n2. ETH-TokenB Pool\n3. TokenA-TokenB Pool",
    "Your current liquidity positions:\n- ETH-TokenA Pool: 5.25 LP tokens (12.34% of pool)\n- ETH-TokenB Pool: 3.75 LP tokens (8.56% of pool)\n- TokenA-TokenB Pool: 10.5 LP tokens (15.78% of pool)",
    "In the TokenA-TokenB pool today:\n- Total swaps: 27\n- Total volume: 1,240 TokenA / 2,480 TokenB\n- Largest swap: 125 TokenA to 249.5 TokenB",
    "Current price in the TokenA-TokenB pool:\n1 TokenB = 0.5 TokenA\n1 TokenA = 2 TokenB",
    "Your liquidity in the TokenA-TokenB pool:\n- LP tokens: 10.5\n- Share of pool: 15.78%\n- Value: ~208.45 TokenA and ~416.9 TokenB",
    "Your wallet balances:\n- ETH: 1.25\n- TokenA: 500\n- TokenB: 750",
  ];

  // Expected responses for hard test cases
  const hardExpectedResponses = [
    "The best route for swapping 5 ETH to TokenB is through the ETH-TokenB pool directly. By calculation:\n\nDirect route (ETH → TokenB):\n- Current reserves: 10 ETH, 1000 TokenB\n- After swap: 15 ETH, 666.67 TokenB\n- You receive: 333.33 TokenB\n\nAlternative route (ETH → TokenA → TokenB):\n- ETH → TokenA: 5 ETH → 250 TokenA\n- TokenA → TokenB: 250 TokenA → 312.5 TokenB\n\nThe direct route yields more TokenB (333.33 vs 312.5).",
    "To gain 20 liquidity tokens for the TokenA-TokenB pool:\n\nGiven the current pool has:\n- 1250.75 TokenA\n- 2500.25 TokenB\n- 100 total LP tokens\n\nCalculation:\n- 20 LP tokens = 20% of the pool\n- You need to provide 20% of current reserves\n- TokenA needed: 1250.75 × 0.2 = 250.15 TokenA\n- TokenB needed: 2500.25 × 0.2 = 500.05 TokenB",
    "To provide 15% of TokenA-TokenB pool liquidity:\n\nCurrent pool reserves:\n- TokenA: 1250.75\n- TokenB: 2500.25\n\nFor 15% of pool, you need:\n- TokenA: 1250.75 × 0.15 = 187.61 TokenA\n- TokenB: 2500.25 × 0.15 = 375.04 TokenB\n\nYour current balances:\n- TokenA: 500\n- TokenB: 750\n\nYes, you have enough tokens to provide 15% of the pool's liquidity.",
    "To get 10 TokenA from withdrawing from the TokenA-TokenB pool:\n\nCurrent situation:\n- Pool has 1250.75 TokenA and 2500.25 TokenB\n- You own 10.5 LP tokens (15.78% of the pool)\n\nYour share contains:\n- TokenA: 1250.75 × 0.1578 = 197.37 TokenA\n- TokenB: 2500.25 × 0.1578 = 394.54 TokenB\n\nTo get exactly 10 TokenA, you would need to withdraw:\n- LP tokens: (10 ÷ 197.37) × 10.5 = 0.53 LP tokens",
    "To achieve a 1:2 ratio of TokenA:TokenB in the pool:\n\nCurrent reserves:\n- TokenA: 1250.75\n- TokenB: 2500.25\n\nThe current ratio is already approximately 1:2 (1250.75:2500.25).\n\nIf the ratio wasn't 1:2, you would need to swap tokens to adjust the reserves until the desired ratio is achieved, calculating the exact swap amount based on the constant product formula x * y = k.",
    "To double the reserves of the TokenA-TokenB pool:\n\nCurrent reserves:\n- TokenA: 1250.75\n- TokenB: 2500.25\n- Total LP tokens: 100\n\nTo double reserves (add 100% more liquidity):\n- You need to provide 100% of current liquidity\n- This would mean providing 1250.75 TokenA and 2500.25 TokenB\n- You would receive 100 new LP tokens\n- This represents 50% of the new total pool (your liquidity / new total liquidity)",
    "Projected APY calculation for the TokenA-TokenB pool:\n\nAssumptions:\n- Daily volume: 5,000 TokenA\n- Fee rate: 0.3%\n- Your liquidity share: 15.78%\n\nDaily fee earnings:\n- Total fees: 5,000 × 0.3% = 15 TokenA equivalent\n- Your share: 15 × 0.1578 = 2.367 TokenA per day\n\nAnnualized return:\n- Yearly fees: 2.367 × 365 = 864 TokenA\n- Your liquidity value: ~208.45 TokenA and ~416.9 TokenB ≈ 625.35 TokenA equivalent\n- APY: (864 ÷ 625.35) × 100% = 138.16%",
    "Price history for TokenA-TokenB pool (last 7 days):\n\nDay 1: 1 TokenA = 1.95 TokenB\nDay 2: 1 TokenA = 2.01 TokenB\nDay 3: 1 TokenA = 2.03 TokenB\nDay 4: 1 TokenA = 1.98 TokenB\nDay 5: 1 TokenA = 1.97 TokenB\nDay 6: 1 TokenA = 2.02 TokenB\nDay 7: 1 TokenA = 2.00 TokenB\n\nThe price has fluctuated between 1.95 and 2.03 TokenB per TokenA over the last week, with an average of 1.99 TokenB per TokenA.",
    "Slippage calculation for swapping 10 TokenA for TokenB:\n\nCurrent pool state:\n- TokenA reserves: 1250.75\n- TokenB reserves: 2500.25\n- Current price: 1 TokenA = 1.999 TokenB\n\nAfter swap calculation (using constant product formula):\n- New TokenA reserves: 1260.75\n- New TokenB reserves: 2480.41\n- TokenB received: 19.84\n- Implied price: 1 TokenA = 1.984 TokenB\n\nSlippage: (1.999 - 1.984) / 1.999 × 100% = 0.75%",
    "Optimal ratio for providing TokenA-TokenB liquidity:\n\nThe optimal ratio always matches the current pool ratio to avoid impermanent loss.\n\nCurrent pool reserves:\n- TokenA: 1250.75\n- TokenB: 2500.25\n\nOptimal ratio: 1 TokenA : 1.999 TokenB\n\nFor every 1 TokenA you provide, you should provide 1.999 TokenB to maintain the same ratio as the pool, minimizing impermanent loss risk.",
  ];

  // Initialize test cases
  const [easyTestCases, setEasyTestCases] = useState<TestCase[]>(
    easyQuestions.map((prompt, index) => ({
      id: `easy-${index}`,
      prompt,
      expectedResponse: easyExpectedResponses[index],
      expanded: false,
      executed: false
    }))
  );

  const [hardTestCases, setHardTestCases] = useState<TestCase[]>(
    hardQuestions.map((prompt, index) => ({
      id: `hard-${index}`,
      prompt,
      expectedResponse: hardExpectedResponses[index],
      expanded: false,
      executed: false
    }))
  );

  // Get current test cases based on active category
  const getCurrentTestCases = () => {
    switch (activeCategory) {
      case "easy":
        return easyTestCases;
      case "hard":
        return hardTestCases;
      case "custom":
        return customTestCases;
      default:
        return easyTestCases;
    }
  };

  // Toggle expanded state of a test case
  const toggleExpand = (testCaseId: string) => {
    const updateTestCase = (testCase: TestCase) => {
      if (testCase.id === testCaseId) {
        return { ...testCase, expanded: !testCase.expanded };
      }
      return testCase;
    };

    switch (activeCategory) {
      case "easy":
        setEasyTestCases(easyTestCases.map(updateTestCase));
        break;
      case "hard":
        setHardTestCases(hardTestCases.map(updateTestCase));
        break;
      case "custom":
        setCustomTestCases(customTestCases.map(updateTestCase));
        break;
    }
  };

  // Handle response from NLIChat
  const handleResponseReceived = (testCaseId: string, responseData: any, modelType: "openai" | "opensource") => {
    // Update chat history for the specific test case
    setChatHistory({
      ...chatHistory,
      [`${testCaseId}-${modelType}`]: responseData
    });

    // Update test case executed status
    const updateTestCase = (testCase: TestCase) => {
      if (testCase.id === testCaseId) {
        const updates: Partial<TestCase> = { 
          executed: true,
          lastResult: responseData.response
        };
        
        if (modelType === "openai") {
          updates.openaiResponse = responseData.response;
          updates.openaiExecuted = true;
        } else {
          updates.openSourceResponse = responseData.response;
          updates.openSourceExecuted = true;
        }
        
        return { ...testCase, ...updates };
      }
      return testCase;
    };

    switch (activeCategory) {
      case "easy":
        setEasyTestCases(easyTestCases.map(updateTestCase));
        break;
      case "hard":
        setHardTestCases(hardTestCases.map(updateTestCase));
        break;
      case "custom":
        setCustomTestCases(customTestCases.map(updateTestCase));
        break;
    }
  };

  // Add a new custom test case
  const addNewTestCase = () => {
    if (!newCasePrompt.trim()) return;
    
    const newCase: TestCase = {
      id: `custom-${Date.now()}`,
      prompt: newCasePrompt,
      expectedResponse: newCaseExpected,
      expanded: false,
      executed: false
    };
    
    setCustomTestCases([...customTestCases, newCase]);
    setAddingNewCase(false);
    setNewCasePrompt("");
    setNewCaseExpected("");
  };

  // Execute a test case
  const executeTestCase = (testCase: TestCase, modelType: "openai" | "opensource") => {
    setSelectedTestCase(testCase.id);
    setModelExecuting(modelType);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Model Selection Header */}
      <div className="bg-base-200 p-6 rounded-xl mb-8">
        <h3 className="text-xl font-semibold mb-4 text-center">Model Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OpenAI Model Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">OpenAI Model:</label>
            <select 
              className="select select-bordered w-full"
              value={selectedOpenAIModel}
              onChange={(e) => setSelectedOpenAIModel(e.target.value)}
            >
              {OPENAI_MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
          
          {/* Open Source Model Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Open Source Model:</label>
            <select 
              className="select select-bordered w-full"
              value={selectedOpenSourceModel}
              onChange={(e) => setSelectedOpenSourceModel(e.target.value)}
            >
              {OPEN_SOURCE_MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    
      {/* Test Case Categories */}
      <div className="tabs tabs-boxed mb-8 justify-center">
        <a 
          className={`tab ${activeCategory === "easy" ? "tab-active" : ""}`}
          onClick={() => setActiveCategory("easy")}
        >
          Easy Test Cases
        </a>
        <a 
          className={`tab ${activeCategory === "hard" ? "tab-active" : ""}`}
          onClick={() => setActiveCategory("hard")}
        >
          Hard Test Cases
        </a>
        <a 
          className={`tab ${activeCategory === "custom" ? "tab-active" : ""}`}
          onClick={() => setActiveCategory("custom")}
        >
          Custom Test Cases
        </a>
      </div>

      {/* Add New Test Case Button (only in Custom tab) */}
      {activeCategory === "custom" && (
        <div className="mb-8 flex justify-center">
          {!addingNewCase ? (
            <button 
              className="btn btn-primary"
              onClick={() => setAddingNewCase(true)}
            >
              Add New Test Case
            </button>
          ) : (
            <div className="bg-base-200 p-6 rounded-xl w-full max-w-3xl">
              <h3 className="text-xl font-semibold mb-4">Create New Test Case</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Test Case Prompt:</label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    value={newCasePrompt}
                    onChange={(e) => setNewCasePrompt(e.target.value)}
                    placeholder="Enter the prompt for your test case..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expected Response:</label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows={5}
                    value={newCaseExpected}
                    onChange={(e) => setNewCaseExpected(e.target.value)}
                    placeholder="Enter the expected response..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    className="btn btn-ghost"
                    onClick={() => setAddingNewCase(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={addNewTestCase}
                    disabled={!newCasePrompt.trim()}
                  >
                    Add Test Case
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Cases List */}
      <div className="space-y-6">
        {getCurrentTestCases().map((testCase) => (
          <div 
            key={testCase.id} 
            className="bg-base-100 shadow-lg shadow-secondary border-4 border-secondary rounded-xl overflow-hidden"
          >
            <div 
              className="p-4 cursor-pointer flex justify-between items-center"
              onClick={() => toggleExpand(testCase.id)}
            >
              <div className="flex items-center">
                <span className={`mr-2 ${testCase.executed ? "text-success" : "text-base-content"}`}>
                  {testCase.executed ? "✓" : "○"}
                </span>
                <h3 className="text-lg font-medium">{testCase.prompt}</h3>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeTestCase(testCase, "openai");
                    }}
                  >
                    Run OpenAI
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeTestCase(testCase, "opensource");
                    }}
                  >
                    Run Open Source
                  </button>
                </div>
                <svg 
                  className={`w-5 h-5 transition-transform ${testCase.expanded ? "rotate-180" : ""}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            
            {/* Expanded content */}
            {testCase.expanded && (
              <div className="border-t border-base-300 p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Expected Response */}
                  <div className="bg-base-200 p-4 rounded-lg">
                    <h4 className="text-md font-semibold mb-2">Expected Response:</h4>
                    <pre className="whitespace-pre-wrap text-sm">{testCase.expectedResponse}</pre>
                  </div>
                  
                  {/* OpenAI Response (if executed) */}
                  <div className="bg-base-200 p-4 rounded-lg">
                    <h4 className="text-md font-semibold mb-2">
                      OpenAI Response:
                      {testCase.openaiExecuted && 
                        <span className="ml-2 text-xs text-success">✓ Executed</span>
                      }
                    </h4>
                    <pre className="whitespace-pre-wrap text-sm">
                      {testCase.openaiResponse || "Run the OpenAI model to see results"}
                    </pre>
                  </div>
                  
                  {/* Open Source Model Response */}
                  <div className="bg-base-200 p-4 rounded-lg lg:col-span-2">
                    <h4 className="text-md font-semibold mb-2">
                      Open Source Model Response:
                      {testCase.openSourceExecuted && 
                        <span className="ml-2 text-xs text-success">✓ Executed</span>
                      }
                    </h4>
                    <pre className="whitespace-pre-wrap text-sm">
                      {testCase.openSourceResponse || "Run the Open Source model to see results"}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Test Case Execution */}
      {selectedTestCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {modelExecuting === "openai" 
                  ? `Test Case Execution - ${OPENAI_MODELS.find(m => m.id === selectedOpenAIModel)?.name}` 
                  : `Test Case Execution - ${OPEN_SOURCE_MODELS.find(m => m.id === selectedOpenSourceModel)?.name}`}
              </h3>
              <button 
                className="btn btn-sm btn-circle"
                onClick={() => {
                  setSelectedTestCase(null);
                  setModelExecuting(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="font-medium">Executing test case:</p>
              <p className="bg-base-200 p-2 rounded mt-2">
                {getCurrentTestCases().find(tc => tc.id === selectedTestCase)?.prompt}
              </p>
            </div>
            
            <NLIChat 
              standalone={true}
              initialPrompt={getCurrentTestCases().find(tc => tc.id === selectedTestCase)?.prompt || ""}
              selectedModel={modelExecuting === "openai" ? selectedOpenAIModel : selectedOpenSourceModel}
              onResponseReceived={(data) => {
                handleResponseReceived(selectedTestCase, data, modelExecuting || "openai");
                // Close modal after short delay
                setTimeout(() => {
                  setSelectedTestCase(null);
                  setModelExecuting(null);
                }, 1000);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Custom Chat Panel */}
      <div className="mt-16 pb-8">
        <h2 className="text-2xl font-bold text-center mb-8">Test Your Own Questions</h2>
        <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6">
          <p className="mb-6 text-center">Use this chat interface to try out new questions and potentially add them as test cases.</p>
          <NLIChat standalone={true} />
        </div>
      </div>
    </div>
  );
};

export default TestCaseManager;