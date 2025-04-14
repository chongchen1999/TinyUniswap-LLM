import { useAccount, useBalance } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";
import { formatBigInt, formatNumber } from "../utils/formatters";

/**
 * Hook to get blockchain context data including user balances and pool information
 */
export const useBlockchainContext = () => {
  // User account info
  const { address: connectedAccount } = useAccount();
  
  // Get contract info for tokens and pools
  const { data: TokenAInfo } = useDeployedContractInfo("TokenA");
  const { data: TokenBInfo } = useDeployedContractInfo("TokenB");
  const { data: ETHTokenAPoolInfo } = useDeployedContractInfo("ETHTokenAPool");
  const { data: ETHTokenBPoolInfo } = useDeployedContractInfo("ETHTokenBPool");
  const { data: TokenATokenBPoolInfo } = useDeployedContractInfo("TokenATokenBPool");
  
  // Read user's token balances
  const { data: userTokenABalance } = useScaffoldReadContract({
    contractName: "TokenA",
    functionName: "balanceOf",
    args: [connectedAccount],
  });

  const { data: userTokenBBalance } = useScaffoldReadContract({
    contractName: "TokenB",
    functionName: "balanceOf",
    args: [connectedAccount],
  });

  // Get ETH balance of connected account
  const { data: userETHBalance } = useBalance({
    address: connectedAccount,
  });

  // Read pool balances and liquidity
  const { data: ethTokenAPoolETHBalance } = useWatchBalance({
    address: ETHTokenAPoolInfo?.address,
  });

  const { data: ethTokenAPoolTokenBalance } = useScaffoldReadContract({
    contractName: "TokenA",
    functionName: "balanceOf",
    args: [ETHTokenAPoolInfo?.address],
    enabled: ETHTokenAPoolInfo?.address ? true : false,
  });

  const { data: ethTokenBPoolETHBalance } = useWatchBalance({
    address: ETHTokenBPoolInfo?.address,
  });

  const { data: ethTokenBPoolTokenBalance } = useScaffoldReadContract({
    contractName: "TokenB",
    functionName: "balanceOf",
    args: [ETHTokenBPoolInfo?.address],
    enabled: ETHTokenBPoolInfo?.address ? true : false,
  });

  const { data: tokenATokenBPoolTokenABalance } = useScaffoldReadContract({
    contractName: "TokenA",
    functionName: "balanceOf",
    args: [TokenATokenBPoolInfo?.address],
    enabled: TokenATokenBPoolInfo?.address ? true : false,
  });

  const { data: tokenATokenBPoolTokenBBalance } = useScaffoldReadContract({
    contractName: "TokenB",
    functionName: "balanceOf",
    args: [TokenATokenBPoolInfo?.address],
    enabled: TokenATokenBPoolInfo?.address ? true : false,
  });

  // Read user's liquidity in pools using getLiquidity instead of balanceOf
  const { data: userETHTokenALiquidity } = useScaffoldReadContract({
    contractName: "ETHTokenAPool",
    functionName: "getLiquidity",
    args: [connectedAccount],
    enabled: ETHTokenAPoolInfo?.address && connectedAccount ? true : false,
  });

  const { data: userETHTokenBLiquidity } = useScaffoldReadContract({
    contractName: "ETHTokenBPool",
    functionName: "getLiquidity",
    args: [connectedAccount],
    enabled: ETHTokenBPoolInfo?.address && connectedAccount ? true : false,
  });

  const { data: userTokenATokenBLiquidity } = useScaffoldReadContract({
    contractName: "TokenATokenBPool",
    functionName: "getLiquidity",
    args: [connectedAccount],
    enabled: TokenATokenBPoolInfo?.address && connectedAccount ? true : false,
  });

  // Read total liquidity in pools
  const { data: totalETHTokenALiquidity } = useScaffoldReadContract({
    contractName: "ETHTokenAPool",
    functionName: "totalLiquidity",
  });

  const { data: totalETHTokenBLiquidity } = useScaffoldReadContract({
    contractName: "ETHTokenBPool",
    functionName: "totalLiquidity",
  });

  const { data: totalTokenATokenBLiquidity } = useScaffoldReadContract({
    contractName: "TokenATokenBPool",
    functionName: "totalLiquidity",
  });
  
  // Format and organize blockchain data
  const getFormattedBlockchainData = () => {
    const ethBalance = userETHBalance ? formatNumber(userETHBalance.formatted) : "0.0000";
    const tokenABalance = formatBigInt(userTokenABalance);
    const tokenBBalance = formatBigInt(userTokenBBalance);
    
    // Format user's liquidity for each pool
    const ethTokenALiquidity = formatBigInt(userETHTokenALiquidity);
    const ethTokenBLiquidity = formatBigInt(userETHTokenBLiquidity);
    const tokenATokenBLiquidity = formatBigInt(userTokenATokenBLiquidity);
    
    // Pool information
    const ethTokenAPoolETH = ethTokenAPoolETHBalance 
      ? formatNumber(ethTokenAPoolETHBalance.formatted) 
      : "0.0000";
    const ethTokenAPoolToken = formatBigInt(ethTokenAPoolTokenBalance);

    const ethTokenBPoolETH = ethTokenBPoolETHBalance 
      ? formatNumber(ethTokenBPoolETHBalance.formatted) 
      : "0.0000";
    const ethTokenBPoolToken = formatBigInt(ethTokenBPoolTokenBalance);

    const tokenATokenBPoolTokenA = formatBigInt(tokenATokenBPoolTokenABalance);
    const tokenATokenBPoolTokenB = formatBigInt(tokenATokenBPoolTokenBBalance);
    
    // Total liquidity in each pool (formatted)
    const totalETHTokenALiquidityFormatted = formatBigInt(totalETHTokenALiquidity);
    const totalETHTokenBLiquidityFormatted = formatBigInt(totalETHTokenBLiquidity);
    const totalTokenATokenBLiquidityFormatted = formatBigInt(totalTokenATokenBLiquidity);
    
    return {
      walletAddress: connectedAccount || "Not connected",
      tokenAAddress: TokenAInfo?.address || "Not available",
      tokenBAddress: TokenBInfo?.address || "Not available",
      ethTokenAPoolAddress: ETHTokenAPoolInfo?.address || "Not available",
      ethTokenBPoolAddress: ETHTokenBPoolInfo?.address || "Not available",
      tokenATokenBPoolAddress: TokenATokenBPoolInfo?.address || "Not available",
      balances: {
        eth: ethBalance,
        tokenA: tokenABalance,
        tokenB: tokenBBalance
      },
      // Add detailed user liquidity information for each pool
      userLiquidity: {
        ethTokenAPool: ethTokenALiquidity,
        ethTokenBPool: ethTokenBLiquidity,
        tokenATokenBPool: tokenATokenBLiquidity,
        // Add raw values for calculations if needed
        ethTokenAPoolRaw: userETHTokenALiquidity ? userETHTokenALiquidity.toString() : "0",
        ethTokenBPoolRaw: userETHTokenBLiquidity ? userETHTokenBLiquidity.toString() : "0",
        tokenATokenBPoolRaw: userTokenATokenBLiquidity ? userTokenATokenBLiquidity.toString() : "0"
      },
      liquidity: {
        ethTokenAPool: ethTokenALiquidity,
        ethTokenBPool: ethTokenBLiquidity,
        tokenATokenBPool: tokenATokenBLiquidity
      },
      pools: {
        ethTokenAPool: {
          eth: ethTokenAPoolETH,
          tokenA: ethTokenAPoolToken,
          totalLiquidity: totalETHTokenALiquidityFormatted,
          userLiquidity: ethTokenALiquidity,
          userLiquidityPercentage: calculatePercentage(userETHTokenALiquidity, totalETHTokenALiquidity)
        },
        ethTokenBPool: {
          eth: ethTokenBPoolETH,
          tokenB: ethTokenBPoolToken,
          totalLiquidity: totalETHTokenBLiquidityFormatted,
          userLiquidity: ethTokenBLiquidity,
          userLiquidityPercentage: calculatePercentage(userETHTokenBLiquidity, totalETHTokenBLiquidity)
        },
        tokenATokenBPool: {
          tokenA: tokenATokenBPoolTokenA,
          tokenB: tokenATokenBPoolTokenB,
          totalLiquidity: totalTokenATokenBLiquidityFormatted,
          userLiquidity: tokenATokenBLiquidity,
          userLiquidityPercentage: calculatePercentage(userTokenATokenBLiquidity, totalTokenATokenBLiquidity)
        }
      }
    };
  };
  
  // Helper function to calculate percentage
  const calculatePercentage = (userLiquidity?: bigint, totalLiquidity?: bigint): string => {
    if (!userLiquidity || !totalLiquidity || totalLiquidity === 0n) {
      return "0.00";
    }
    
    // Convert to numbers with floating point and calculate percentage
    const userLiquidityNumber = Number(userLiquidity) / 1e18;
    const totalLiquidityNumber = Number(totalLiquidity) / 1e18;
    
    if (totalLiquidityNumber === 0) {
      return "0.00";
    }
    
    const percentage = (userLiquidityNumber / totalLiquidityNumber) * 100;
    return percentage.toFixed(2);
  };
  
  return {
    blockchainData: getFormattedBlockchainData(),
    contracts: {
      TokenAInfo,
      TokenBInfo,
      ETHTokenAPoolInfo,
      ETHTokenBPoolInfo,
      TokenATokenBPoolInfo
    },
    liquidity: {
      totalETHTokenALiquidity,
      totalETHTokenBLiquidity,
      totalTokenATokenBLiquidity
    }
  };
};