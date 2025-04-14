// useLiquidity.ts - Fixed version
import { useState } from "react";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { POOLS } from "../utils/constants";
import { isValidNumberInput } from "../utils/validators";

/**
 * Hook for liquidity operations (add/withdraw)
 */
export const useLiquidity = () => {
  const [status, setStatus] = useState("");
  
  // Contract write functions
  const { writeContractAsync: writeTokenAContract } = useScaffoldWriteContract("TokenA");
  const { writeContractAsync: writeTokenBContract } = useScaffoldWriteContract("TokenB");
  const { writeContractAsync: writeETHTokenAPoolContract } = useScaffoldWriteContract("ETHTokenAPool");
  const { writeContractAsync: writeETHTokenBPoolContract } = useScaffoldWriteContract("ETHTokenBPool");
  const { writeContractAsync: writeTokenATokenBPoolContract } = useScaffoldWriteContract("TokenATokenBPool");

  // Handle token approvals
  const approveTokens = async (tokenAmount: string, isTokenA: boolean, poolAddress: string) => {
    try {
      if (!isValidNumberInput(tokenAmount)) {
        throw new Error(`Invalid token amount: ${tokenAmount}`);
      }
      
      const amount = parseEther(tokenAmount);
      if (isTokenA) {
        console.log(`Approving TokenA: ${amount} for pool ${poolAddress}`);
        await writeTokenAContract({
          functionName: "approve",
          args: [poolAddress, amount],
        });
      } else {
        console.log(`Approving TokenB: ${amount} for pool ${poolAddress}`);
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
   * Add liquidity to a pool
   * @param pool - Pool identifier
   * @param amount1 - First amount (ETH for ETH-TokenA pool, TokenA for TokenA-TokenB pool)
   * @param amount2 - Second amount (TokenA for ETH-TokenA pool, TokenB for TokenA-TokenB pool)
   * @returns Promise<boolean> indicating success or failure
   */
  const addLiquidity = async (
    pool: string, 
    amount1: string, 
    amount2: string,
    poolInfo: {
      ethTokenAPoolAddress?: string;
      ethTokenBPoolAddress?: string;
      tokenATokenBPoolAddress?: string;
    },
    liquidityInfo: {
      totalETHTokenALiquidity?: bigint;
      totalETHTokenBLiquidity?: bigint;
      totalTokenATokenBLiquidity?: bigint;
    }
  ): Promise<boolean> => {
    if (!isValidNumberInput(amount1) || !isValidNumberInput(amount2)) {
      setStatus("Invalid amount format. Please use a valid number.");
      return false;
    }

    try {
      setStatus("Processing liquidity addition...");
      
      // Normalize pool to lowercase for comparison
      const normalizedPool = pool.toLowerCase();
      console.log(`Adding liquidity to normalized pool: ${normalizedPool}`);
      console.log(`POOLS constants:`, POOLS);
      
      // Check if pool is initialized
      let isInitialized = false;
      
      if (normalizedPool.includes(POOLS.ETH_TOKEN_A.toLowerCase())) {
        isInitialized = liquidityInfo.totalETHTokenALiquidity !== undefined && liquidityInfo.totalETHTokenALiquidity > 0n;
        console.log(`ETH-TokenA pool initialized: ${isInitialized}`);
      } else if (normalizedPool.includes(POOLS.ETH_TOKEN_B.toLowerCase())) {
        isInitialized = liquidityInfo.totalETHTokenBLiquidity !== undefined && liquidityInfo.totalETHTokenBLiquidity > 0n;
        console.log(`ETH-TokenB pool initialized: ${isInitialized}`);
      } else if (normalizedPool.includes(POOLS.TOKEN_A_TOKEN_B.toLowerCase())) {
        isInitialized = liquidityInfo.totalTokenATokenBLiquidity !== undefined && liquidityInfo.totalTokenATokenBLiquidity > 0n;
        console.log(`TokenA-TokenB pool initialized: ${isInitialized}`);
      } else {
        console.warn(`Pool ${normalizedPool} not recognized in standard pool constants`);
      }
      
      // ETH-TokenA pool
      if (normalizedPool.includes(POOLS.ETH_TOKEN_A.toLowerCase())) {
        if (!poolInfo.ethTokenAPoolAddress) {
          throw new Error("ETH-TokenA pool address is undefined");
        }
        
        // Approve tokens first
        await approveTokens(amount2, true, poolInfo.ethTokenAPoolAddress);
        
        console.log(`Executing ETH-TokenA liquidity addition: init=${!isInitialized}, ETH=${amount1}, TokenA=${amount2}`);
        
        if (!isInitialized) {
          await writeETHTokenAPoolContract({
            functionName: "init",
            args: [parseEther(amount2)],
            value: parseEther(amount1),
          });
        } else {
          await writeETHTokenAPoolContract({
            functionName: "deposit",
            value: parseEther(amount1),
          });
        }
      }
      
      // ETH-TokenB pool
      else if (normalizedPool.includes(POOLS.ETH_TOKEN_B.toLowerCase())) {
        if (!poolInfo.ethTokenBPoolAddress) {
          throw new Error("ETH-TokenB pool address is undefined");
        }
        
        // Approve tokens first
        await approveTokens(amount2, false, poolInfo.ethTokenBPoolAddress);
        
        console.log(`Executing ETH-TokenB liquidity addition: init=${!isInitialized}, ETH=${amount1}, TokenB=${amount2}`);
        
        if (!isInitialized) {
          await writeETHTokenBPoolContract({
            functionName: "init",
            args: [parseEther(amount2)],
            value: parseEther(amount1),
          });
        } else {
          await writeETHTokenBPoolContract({
            functionName: "deposit",
            value: parseEther(amount1),
          });
        }
      }

      // TokenA-TokenB pool
      else if (normalizedPool.includes(POOLS.TOKEN_A_TOKEN_B.toLowerCase())) {
        if (!poolInfo.tokenATokenBPoolAddress) {
          throw new Error("TokenA-TokenB pool address is undefined");
        }
        
        // Approve both tokens
        await approveTokens(amount1, true, poolInfo.tokenATokenBPoolAddress);
        await approveTokens(amount2, false, poolInfo.tokenATokenBPoolAddress);
        
        console.log(`Executing TokenA-TokenB liquidity addition: init=${!isInitialized}, TokenA=${amount1}, TokenB=${amount2}`);
        
        if (!isInitialized) {
          await writeTokenATokenBPoolContract({
            functionName: "init",
            args: [parseEther(amount1), parseEther(amount2)],
          });
        } else {
          await writeTokenATokenBPoolContract({
            functionName: "deposit",
            args: [parseEther(amount1), parseEther(amount2)],
          });
        }
      }
      else {
        setStatus(`Unsupported pool for liquidity addition: ${pool}`);
        return false;
      }
      
      setStatus("Liquidity added successfully!");
      return true;
    } catch (err: any) {
      console.error("Error adding liquidity:", err);
      setStatus(`Error adding liquidity: ${err.message}`);
      return false;
    }
  };

  /**
   * Withdraw liquidity from a pool
   * @param pool - Pool identifier
   * @param amount - Amount of liquidity to withdraw
   * @returns Promise<boolean> indicating success or failure
   */
  const withdrawLiquidity = async (pool: string, amount: string): Promise<boolean> => {
    if (!isValidNumberInput(amount)) {
      setStatus("Invalid amount format. Please use a valid number.");
      return false;
    }

    try {
      setStatus("Processing withdrawal...");
      
      // Normalize pool to lowercase for comparison
      const normalizedPool = pool.toLowerCase();
      
      if (normalizedPool.includes(POOLS.ETH_TOKEN_A.toLowerCase())) {
        await writeETHTokenAPoolContract({
          functionName: "withdraw",
          args: [parseEther(amount)],
        });
      } 
      else if (normalizedPool.includes(POOLS.ETH_TOKEN_B.toLowerCase())) {
        await writeETHTokenBPoolContract({
          functionName: "withdraw",
          args: [parseEther(amount)],
        });
      }
      else if (normalizedPool.includes(POOLS.TOKEN_A_TOKEN_B.toLowerCase())) {
        await writeTokenATokenBPoolContract({
          functionName: "withdraw",
          args: [parseEther(amount)],
        });
      }
      else {
        setStatus(`Unsupported pool for withdrawal: ${pool}`);
        return false;
      }
      
      setStatus("Liquidity withdrawn successfully!");
      return true;
    } catch (err: any) {
      console.error("Error withdrawing liquidity:", err);
      setStatus(`Error withdrawing liquidity: ${err.message}`);
      return false;
    }
  };
  
  return {
    addLiquidity,
    withdrawLiquidity,
    liquidityStatus: status,
    setLiquidityStatus: setStatus
  };
};