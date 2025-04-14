import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { TOKENS } from "../utils/constants";
import { isValidNumberInput } from "../utils/validators";

/**
 * Hook for token swap functionality
 */
export const useSwap = () => {
  const [status, setStatus] = useState("");
  
  // Contract write functions
  const { writeContractAsync: writeTokenAContract } = useScaffoldWriteContract("TokenA");
  const { writeContractAsync: writeTokenBContract } = useScaffoldWriteContract("TokenB");
  const { writeContractAsync: writeETHTokenAPoolContract } = useScaffoldWriteContract("ETHTokenAPool");
  const { writeContractAsync: writeTokenATokenBPoolContract } = useScaffoldWriteContract("TokenATokenBPool");
  const { writeContractAsync: writeETHTokenBPoolContract } = useScaffoldWriteContract("ETHTokenBPool");
  
  // Handle token approvals
  const approveTokens = async (tokenAmount: string, isTokenA: boolean, poolAddress: string) => {
    try {
      const amount = parseEther(tokenAmount);
      if (isTokenA) {
        await writeTokenAContract({
          functionName: "approve",
          args: [poolAddress, amount],
        });
      } else {
        await writeTokenBContract({
          functionName: "approve",
          args: [poolAddress, amount],
        });
      }
    } catch (err) {
      console.error(`Error approving tokens`, err);
      throw err;
    }
  };
  
  /**
   * Execute a token swap
   * @param fromToken - Source token (ETH, TokenA, TokenB)
   * @param toToken - Destination token
   * @param amount - Amount to swap
   * @returns Promise<boolean> indicating success or failure
   */
  const executeSwap = async (
    fromToken: string, 
    toToken: string, 
    amount: string, 
    poolInfo: { 
      ethTokenAPoolAddress?: string; 
      tokenATokenBPoolAddress?: string;
      ethTokenBPoolAddress?: string;
    }
  ): Promise<boolean> => {
    // Validate input amount
    if (!isValidNumberInput(amount)) {
      setStatus("Invalid amount format. Please use a valid number.");
      return false;
    }

    try {
      setStatus("Processing swap transaction...");
      
      // Normalize token names to lowercase for comparison
      const normalizedFromToken = fromToken.toLowerCase();
      const normalizedToToken = toToken.toLowerCase();
      
      // ETH-TokenA pool swaps
      if ((normalizedFromToken === TOKENS.ETH && normalizedToToken === TOKENS.TOKEN_A) || 
          (normalizedFromToken === TOKENS.TOKEN_A && normalizedToToken === TOKENS.ETH)) {
        
        if (normalizedFromToken === TOKENS.ETH) {
          await writeETHTokenAPoolContract({
            functionName: "ethToToken",
            value: parseEther(amount),
          });
        } else {
          // Approve tokens first
          await approveTokens(amount, true, poolInfo.ethTokenAPoolAddress || "");
          await writeETHTokenAPoolContract({
            functionName: "tokenToEth",
            args: [parseEther(amount)],
          });
        }
      }

      // TokenA-TokenB pool swaps
      else if ((normalizedFromToken === TOKENS.TOKEN_A && normalizedToToken === TOKENS.TOKEN_B) || 
               (normalizedFromToken === TOKENS.TOKEN_B && normalizedToToken === TOKENS.TOKEN_A)) {
        
        const isFromTokenA = normalizedFromToken === TOKENS.TOKEN_A;
        // Approve tokens first
        await approveTokens(amount, isFromTokenA, poolInfo.tokenATokenBPoolAddress || "");
        
        await writeTokenATokenBPoolContract({
          functionName: isFromTokenA ? "tokenAToTokenB" : "tokenBToTokenA",
          args: [parseEther(amount)],
        });
      }
      
      // ETH-TokenB pool swaps (new functionality)
      else if ((normalizedFromToken === TOKENS.ETH && normalizedToToken === TOKENS.TOKEN_B) || 
               (normalizedFromToken === TOKENS.TOKEN_B && normalizedToToken === TOKENS.ETH)) {
        
        if (normalizedFromToken === TOKENS.ETH) {
          await writeETHTokenBPoolContract({
            functionName: "ethToToken",
            value: parseEther(amount),
          });
        } else {
          // Approve tokens first
          await approveTokens(amount, false, poolInfo.ethTokenBPoolAddress || "");
          await writeETHTokenBPoolContract({
            functionName: "tokenToEth",
            args: [parseEther(amount)],
          });
        }
      }
      else {
        setStatus("Unsupported token pair for swap.");
        return false;
      }
      
      setStatus("Swap completed successfully!");
      return true;
    } catch (err: any) {
      console.error("Error executing swap:", err);
      setStatus(`Error executing swap: ${err.message}`);
      return false;
    }
  };
  
  return {
    executeSwap,
    swapStatus: status,
    setSwapStatus: setStatus
  };
};