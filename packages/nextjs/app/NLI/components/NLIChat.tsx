// packages/nextjs/app/NLI/components/NLIChat.tsx
import React, { useState, useEffect, useContext } from "react";
import ChatHistory from "./ChatHistory";
import LoadingState from "./LoadingState";
import ResponseDisplay from "./ResponseDisplay";
import { useBlockchainContext } from "../hooks/useBlockchainContext";
import { useLiquidity } from "../hooks/useLiquidity";
import { useSwap } from "../hooks/useSwap";
import { useLLM } from "../hooks/useLLM";
import { POOLS } from "../utils/constants";
import { ModelContext } from "../page";

// Define LLM model options
const OPENAI_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4o", name: "GPT-4o" },
];

const OPEN_SOURCE_MODELS = [
  { id: "llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct" },
  { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3" },
];

interface NLIChatProps {
  standalone?: boolean;
  initialPrompt?: string;
  selectedModel?: string;
  onResponseReceived?: (response: any) => void;
}

const NLIChat: React.FC<NLIChatProps> = ({ 
  standalone = false,
  initialPrompt = "",
  selectedModel,
  onResponseReceived
}) => {
  const modelContext = useContext(ModelContext);
  const [userInput, setUserInput] = useState(initialPrompt);
  const [response, setResponse] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [actionTaken, setActionTaken] = useState<string | null>(null);
  const [showExampleDropdown, setShowExampleDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Use selected model from props if provided, otherwise use the one from context
  const [activeModel, setActiveModel] = useState(selectedModel || modelContext.selectedOpenAIModel);
  
  // Update active model when props change
  useEffect(() => {
    if (selectedModel) {
      setActiveModel(selectedModel);
    }
  }, [selectedModel]);
  
  // Custom hooks
  const { blockchainData, contracts, liquidity } = useBlockchainContext();
  const { executeSwap, swapStatus, setSwapStatus } = useSwap();
  const { 
    addLiquidity, 
    withdrawLiquidity, 
    liquidityStatus, 
    setLiquidityStatus 
  } = useLiquidity();
  const { 
    handleUserMessage, 
    isLoading, 
    chatHistory, 
    debugInfo 
  } = useLLM();
  
  // Example questions
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
  
  // Set initial prompt if provided
  useEffect(() => {
    if (initialPrompt) {
      setUserInput(initialPrompt);
    }
  }, [initialPrompt]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.example-dropdown') && !target.closest('.example-button')) {
        setShowExampleDropdown(false);
      }
      if (!target.closest('.model-dropdown') && !target.closest('.model-button')) {
        setShowModelDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Helper function to map pool names to POOLS constants
  const mapPoolNameToConstant = (poolName: string): string => {
    // Normalize the pool name (lowercase and remove spaces)
    const normalizedName = poolName.toLowerCase().replace(/\s+/g, '');
    
    // Map different possible pool names to the correct POOL constant
    if (normalizedName.includes('ethtokena') || 
        normalizedName.includes('eth-tokena') || 
        normalizedName.includes('ethtokenpool')) {
      return POOLS.ETH_TOKEN_A;
    }
    
    if (normalizedName.includes('ethtokenb') || 
        normalizedName.includes('eth-tokenb')) {
      return POOLS.ETH_TOKEN_B;
    }
    
    if (normalizedName.includes('tokenatokenb') || 
        normalizedName.includes('tokena-tokenb')) {
      return POOLS.TOKEN_A_TOKEN_B;
    }
    
    // Default case: return the original name
    return poolName;
  };
  
  // Process user input and execute actions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    // Reset status states
    setTransactionStatus("");
    setActionTaken(null);
    setSwapStatus("");
    setLiquidityStatus("");
    
    // Get LLM response with the selected model
    const processedResponse = await handleUserMessage(userInput, blockchainData, activeModel);
    
    // Check if an action needs to be executed
    if (processedResponse.actionType && processedResponse.actionParams) {
      const { actionType, actionParams } = processedResponse;
      
      let success = false;
      let actionDescription = "";
      
      switch (actionType) {
        case "SWAP":
          if (actionParams.length >= 3) {
            const fromToken = actionParams[0];
            const toToken = actionParams[1];
            const amount = actionParams[2];
            
            success = await executeSwap(fromToken, toToken, amount, {
              ethTokenAPoolAddress: contracts.ETHTokenAPoolInfo?.address,
              tokenATokenBPoolAddress: contracts.TokenATokenBPoolInfo?.address,
              ethTokenBPoolAddress: contracts.ETHTokenBPoolInfo?.address
            });
            
            actionDescription = `${success ? "Executed" : "Failed to execute"} swap of ${amount} ${fromToken} to ${toToken}`;
          }
          break;
          
        case "DEPOSIT":
          if (actionParams.length >= 3) {
            // Map the pool name to a constant from POOLS
            const poolInput = actionParams[0];
            const mappedPool = mapPoolNameToConstant(poolInput);
            const amount1 = actionParams[1];
            const amount2 = actionParams[2];
            
            console.log(`Adding liquidity to pool: Original=${poolInput}, Mapped=${mappedPool}`);
            console.log(`Amounts: ${amount1}, ${amount2}`);
            
            try {
              success = await addLiquidity(mappedPool, amount1, amount2, {
                ethTokenAPoolAddress: contracts.ETHTokenAPoolInfo?.address,
                tokenATokenBPoolAddress: contracts.TokenATokenBPoolInfo?.address,
                ethTokenBPoolAddress: contracts.ETHTokenBPoolInfo?.address
              }, {
                totalETHTokenALiquidity: liquidity.totalETHTokenALiquidity,
                totalTokenATokenBLiquidity: liquidity.totalTokenATokenBLiquidity,
                totalETHTokenBLiquidity: liquidity.totalETHTokenBLiquidity
              });
              
              actionDescription = `${success ? "Added" : "Failed to add"} liquidity to ${poolInput} (${amount1}, ${amount2})`;
            } catch (error: any) {
              console.error(`Error adding liquidity to ${mappedPool}:`, error);
              actionDescription = `Failed to add liquidity to ${poolInput}: ${error.message || "Unknown error"}`;
              success = false;
            }
          } else {
            actionDescription = "Failed to add liquidity: insufficient parameters";
            success = false;
          }
          break;
          
        case "WITHDRAW":
          if (actionParams.length >= 2) {
            // Map the pool name to a constant from POOLS
            const poolInput = actionParams[0];
            const mappedPool = mapPoolNameToConstant(poolInput);
            const amount = actionParams[1];
            
            try {
              success = await withdrawLiquidity(mappedPool, amount);
              actionDescription = `${success ? "Withdrew" : "Failed to withdraw"} ${amount} liquidity from ${poolInput}`;
            } catch (error: any) {
              console.error(`Error withdrawing liquidity from ${mappedPool}:`, error);
              actionDescription = `Failed to withdraw liquidity from ${poolInput}: ${error.message || "Unknown error"}`;
              success = false;
            }
          } else {
            actionDescription = "Failed to withdraw liquidity: insufficient parameters";
            success = false;
          }
          break;
      }
      
      setActionTaken(actionDescription);
      // Set transaction status based on the action outcome
      setTransactionStatus(success 
        ? `Action completed: ${actionDescription}` 
        : `Action failed: ${actionDescription}`);
    }
    
    setResponse(processedResponse.processedResponse);
    
    // Callback for test case integration
    if (onResponseReceived) {
      onResponseReceived({
        prompt: userInput,
        response: processedResponse.processedResponse,
        actionTaken,
        success: !!actionTaken && !transactionStatus.includes("failed"),
        model: activeModel
      });
    }
    
    setUserInput("");
  };
  
  // Handle when a user selects an example question
  const handleExampleClick = (exampleText: string) => {
    setUserInput(exampleText);
    setShowExampleDropdown(false);
  };
  
  // Handle when a user selects an LLM model
  const handleModelSelect = (modelId: string) => {
    setActiveModel(modelId);
    
    // Update the global model context too if needed
    if (!standalone) {
      // Check if it's an OpenAI model
      if (OPENAI_MODELS.some(m => m.id === modelId)) {
        modelContext.setSelectedOpenAIModel(modelId);
      } else {
        modelContext.setSelectedOpenSourceModel(modelId);
      }
    }
    
    setShowModelDropdown(false);
  };
  
  // Get the display name for the current model
  const getModelDisplayName = () => {
    const openAIModel = OPENAI_MODELS.find(m => m.id === activeModel);
    if (openAIModel) return openAIModel.name;
    
    const openSourceModel = OPEN_SOURCE_MODELS.find(m => m.id === activeModel);
    if (openSourceModel) return openSourceModel.name;
    
    return activeModel; // Fallback to ID if name not found
  };
  
  // Combine status messages
  const statusMessage = swapStatus || liquidityStatus || transactionStatus;
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Only show examples in the main chat view, not in standalone mode */}
      {!standalone && (
        <div className="mt-4 text-center bg-base-100 shadow-lg shadow-info border-4 border-info rounded-xl p-4 mb-8">
          <p className="text-sm">
            Looking for swap history and price analytics? Check the{" "}
            <button onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'analytics' }))} 
                    className="text-accent underline">
              Swap Analytics
            </button>{" "}
            tab
          </p>
        </div>
      )}
      
      <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Only show model selector if not in standalone mode */}
          {!standalone && (
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              {/* Model selector dropdown */}
              <div className="relative md:w-1/3">
                <div 
                  className="model-button flex justify-between items-center p-3 border border-primary rounded-lg cursor-pointer bg-base-200 hover:bg-base-300"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                >
                  <span>Model: {getModelDisplayName()}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showModelDropdown ? "rotate-180" : ""}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                {showModelDropdown && (
                  <div className="model-dropdown absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      <div className="px-4 py-1 font-semibold text-primary text-sm">OpenAI Models</div>
                      {OPENAI_MODELS.map(model => (
                        <div 
                          key={model.id} 
                          className={`px-4 py-2 hover:bg-base-200 cursor-pointer ${model.id === activeModel ? 'bg-primary bg-opacity-20' : ''}`}
                          onClick={() => handleModelSelect(model.id)}
                        >
                          {model.name}
                        </div>
                      ))}
                      
                      <div className="border-t border-base-300 mt-1 mb-1"></div>
                      
                      <div className="px-4 py-1 font-semibold text-secondary text-sm">Open Source Models</div>
                      {OPEN_SOURCE_MODELS.map(model => (
                        <div 
                          key={model.id} 
                          className={`px-4 py-2 hover:bg-base-200 cursor-pointer ${model.id === activeModel ? 'bg-secondary bg-opacity-20' : ''}`}
                          onClick={() => handleModelSelect(model.id)}
                        >
                          {model.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Examples dropdown */}
              <div className="relative md:w-2/3">
                <div 
                  className="example-button flex justify-between items-center p-3 border border-secondary rounded-lg cursor-pointer bg-base-200 hover:bg-base-300"
                  onClick={() => setShowExampleDropdown(!showExampleDropdown)}
                >
                  <span>Select an example question...</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showExampleDropdown ? "rotate-180" : ""}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                {showExampleDropdown && (
                  <div className="example-dropdown absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="sticky top-0 bg-base-100 px-4 py-2 border-b border-base-300 font-semibold text-primary">
                      Easy Examples
                    </div>
                    <ul className="py-1">
                      {easyQuestions.map((question, index) => (
                        <li 
                          key={`easy-${index}`}
                          className="px-4 py-2 hover:bg-base-200 cursor-pointer"
                          onClick={() => handleExampleClick(question)}
                        >
                          {question}
                        </li>
                      ))}
                    </ul>
                    <div className="sticky top-0 bg-base-100 px-4 py-2 border-t border-b border-base-300 font-semibold text-secondary">
                      Advanced Examples
                    </div>
                    <ul className="py-1">
                      {hardQuestions.map((question, index) => (
                        <li 
                          key={`hard-${index}`}
                          className="px-4 py-2 hover:bg-base-200 cursor-pointer"
                          onClick={() => handleExampleClick(question)}
                        >
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Display selected model in standalone mode */}
          {standalone && (
            <div className="mb-4">
              <div className="bg-base-200 p-2 rounded-lg text-center">
                <span className="font-medium">Using model: {getModelDisplayName()}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question or give a command..."
              className="input input-bordered flex-grow"
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || !userInput.trim()}
            >
              {isLoading ? "Processing..." : "Send"}
            </button>
          </div>
        </form>
      </div>
      
      {isLoading && <LoadingState />}
      
      {statusMessage && (
        <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center">
            <p className="text-lg">{statusMessage}</p>
          </div>
        </div>
      )}
      
      {response && !isLoading && (
        <ResponseDisplay 
          response={response} 
          actionTaken={actionTaken} 
          debugInfo={debugInfo} 
        />
      )}
      
      {/* Only show chat history in the main view, not in standalone mode */}
      {!standalone && (
        <ChatHistory messages={chatHistory.filter(msg => msg.role !== "system")} />
      )}
    </div>
  );
};

export default NLIChat;