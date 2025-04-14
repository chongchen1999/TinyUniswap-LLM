// packages/nextjs/app/NLI/hooks/useLLM.ts
import { useState } from "react";
import { DMX_API_KEY, DMX_BASE_URL, DEFAULT_LLM_MODEL } from "../utils/constants";
import { extractActionFromResponse } from "../utils/formatters";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type LLMResponse = {
  processedResponse: string;
  actionTaken: string | null;
  actionType?: string;
  actionParams?: string[];
};

// Map of LLM model IDs to their API model names
const MODEL_MAP: Record<string, string> = {
  // OpenAI models
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
  
  // Open source models
  "llama-3.3-70b-instruct": "llama-3.3-70b-instruct",
  "deepseek-ai/DeepSeek-V3": "deepseek-ai/DeepSeek-V3",
};

// Determine if a model is from OpenAI
const isOpenAIModel = (modelId: string): boolean => {
  return modelId.includes('gpt');
};

/**
 * Hook for LLM communication and response processing
 */
export const useLLM = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  /**
   * Call the LLM with the given input and context
   * @param userQuestion - User input to process
   * @param blockchainData - Current blockchain state data
   * @param selectedModel - Selected LLM model ID
   * @returns Promise with LLM response
   */
  const callLLM = async (userQuestion: string, blockchainData: any, selectedModel: string = DEFAULT_LLM_MODEL): Promise<string> => {
    try {
      // Get the API model name from the model map or fallback to default
      const modelName = MODEL_MAP[selectedModel] || DEFAULT_LLM_MODEL;
      
      // Construct the prompt with blockchain data context and available actions
      const systemMessage = `You are a helpful blockchain assistant that can both provide information and execute actions.
      
      The user has the following blockchain data:
      - Wallet address: ${blockchainData.walletAddress}
      - TokenA contract address: ${blockchainData.tokenAAddress}
      - TokenB contract address: ${blockchainData.tokenBAddress}
      - ETH-TokenA pool address: ${blockchainData.ethTokenAPoolAddress}
      - ETH-TokenB pool address: ${blockchainData.ethTokenBPoolAddress}
      - TokenA-TokenB pool address: ${blockchainData.tokenATokenBPoolAddress}
      
      User's balances:
      - ETH balance: ${blockchainData.balances.eth}
      - TokenA balance: ${blockchainData.balances.tokenA}
      - TokenB balance: ${blockchainData.balances.tokenB}
      
      User's liquidity positions:
      - ETH-TokenA Pool: ${blockchainData.userLiquidity.ethTokenAPool} LP tokens (${blockchainData.pools.ethTokenAPool.userLiquidityPercentage}% of pool)
      - ETH-TokenB Pool: ${blockchainData.userLiquidity.ethTokenBPool} LP tokens (${blockchainData.pools.ethTokenBPool.userLiquidityPercentage}% of pool)
      - TokenA-TokenB Pool: ${blockchainData.userLiquidity.tokenATokenBPool} LP tokens (${blockchainData.pools.tokenATokenBPool.userLiquidityPercentage}% of pool)
      
      Pool Information:
      - ETH-TokenA Pool: ETH=${blockchainData.pools.ethTokenAPool.eth}, TokenA=${blockchainData.pools.ethTokenAPool.tokenA}, Total Liquidity=${blockchainData.pools.ethTokenAPool.totalLiquidity}
      - ETH-TokenB Pool: ETH=${blockchainData.pools.ethTokenBPool.eth}, TokenB=${blockchainData.pools.ethTokenBPool.tokenB}, Total Liquidity=${blockchainData.pools.ethTokenBPool.totalLiquidity}
      - TokenA-TokenB Pool: TokenA=${blockchainData.pools.tokenATokenBPool.tokenA}, TokenB=${blockchainData.pools.tokenATokenBPool.tokenB}, Total Liquidity=${blockchainData.pools.tokenATokenBPool.totalLiquidity}
      
      You can help the user by:
      1. Answering questions about their balances, pool states, and liquidity positions
      2. Executing the following actions when requested:
         - SWAP: Format your response with "ACTION:SWAP:fromToken:toToken:amount" (e.g., "ACTION:SWAP:ETH:TokenA:0.1")
         - ADD LIQUIDITY: Format with "ACTION:DEPOSIT:pool:amount1:amount2" (e.g., "ACTION:DEPOSIT:ETHTokenAPool:0.1:10")
           * For ETH-TokenA pool, use "ETHTokenAPool" as the pool name with ETH as amount1 and TokenA as amount2
           * For ETH-TokenB pool, use "ETHTokenBPool" as the pool name with ETH as amount1 and TokenB as amount2
           * For TokenA-TokenB pool, use "TokenATokenBPool" as the pool name with TokenA as amount1 and TokenB as amount2
         - WITHDRAW LIQUIDITY: Format with "ACTION:WITHDRAW:pool:amount" (e.g., "ACTION:WITHDRAW:ETHTokenAPool:5")
           * Use the same pool name format as for ADD LIQUIDITY
      
      IMPORTANT: When executing actions, use EXACTLY these pool names:
      - "ETHTokenAPool" for the ETH-TokenA pool
      - "ETHTokenBPool" for the ETH-TokenB pool
      - "TokenATokenBPool" for the TokenA-TokenB pool
      
      For actions, keep your response short and focused. Start with a brief acknowledgment of what you're doing, then include the ACTION format on a new line.
      For regular questions, provide concise, friendly answers focused on the blockchain information.
      
      If the user asks about their liquidity in a specific pool, tell them both the amount of LP tokens they hold and what percentage of the pool that represents. For example:
      - "You have 5.25 LP tokens in the TokenA-TokenB pool, which is 12.34% of the total pool liquidity."
      
      Important: If the user asks about historical pricing, swap history, price trends, or analytics, suggest they check the Swap Analytics tab which provides detailed charts and data visualization for all pool transactions.`;
      
      // Prepare messages including chat history for context
      const messages = [
        { role: "system", content: systemMessage },
        ...chatHistory,
        { role: "user", content: userQuestion }
      ];
      
      // Log which model is being used
      console.log(`Using LLM model: ${modelName} (selected: ${selectedModel})`);
      
      // Set the API endpoint based on whether it's an OpenAI model or open source model
      const apiEndpoint = isOpenAIModel(selectedModel) 
        ? `${DMX_BASE_URL}/chat/completions`
        : `${DMX_BASE_URL}/chat/completions`;
      
      // Call the DMX API with the appropriate endpoint
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DMX_API_KEY}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          // Additional parameters for open source models if needed
          ...(isOpenAIModel(selectedModel) ? {} : {
            temperature: 0.7,
            max_tokens: 1024
          })
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setDebugInfo({
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Add model info to debug data
      setDebugInfo({
        ...data,
        selectedModel,
        modelName,
        isOpenAIModel: isOpenAIModel(selectedModel)
      });
      
      return data.choices[0].message.content;
      
    } catch (error: any) {
      console.error("Error calling LLM:", error);
      return "Sorry, I couldn't process your request. Please try again later.";
    }
  };
  
  /**
   * Process the LLM response for potential actions
   * @param llmResponse - Raw response from LLM
   * @returns Processed response with action information
   */
  const processResponse = (llmResponse: string): LLMResponse => {
    // Check if the response contains an action code
    const actionInfo = extractActionFromResponse(llmResponse);
    
    if (actionInfo) {
      return { 
        processedResponse: llmResponse.replace(actionInfo.actionLine, "").trim(),
        actionTaken: null,
        actionType: actionInfo.actionType,
        actionParams: actionInfo.params
      };
    }
    
    // If no action was found
    return { 
      processedResponse: llmResponse,
      actionTaken: null
    };
  };
  
  /**
   * Handle a user message, get LLM response, and update chat history
   * @param userInput - User's message
   * @param blockchainData - Current blockchain state
   * @param selectedModel - Selected LLM model ID
   * @returns Promise with processed LLM response
   */
  const handleUserMessage = async (
    userInput: string, 
    blockchainData: any, 
    selectedModel: string = DEFAULT_LLM_MODEL
  ): Promise<LLMResponse> => {
    setIsLoading(true);
    
    try {
      // Add user message to chat history
      const newUserMessage = { role: "user", content: userInput };
      const updatedHistory = [...chatHistory, newUserMessage];
      setChatHistory(updatedHistory);
      
      // Get response from LLM with selected model
      const llmResponse = await callLLM(userInput, blockchainData, selectedModel);
      
      // Process the response for potential actions
      const processedResponse = processResponse(llmResponse);
      
      // Add assistant response to chat history
      const newAssistantMessage = { role: "assistant", content: processedResponse.processedResponse };
      setChatHistory([...updatedHistory, newAssistantMessage]);
      
      return processedResponse;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    handleUserMessage,
    isLoading,
    chatHistory,
    debugInfo,
    setChatHistory
  };
};

export default useLLM;