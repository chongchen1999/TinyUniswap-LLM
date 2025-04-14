"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import Pool from "./_components/Pool";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const PoolsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { address: connectedAccount } = useAccount();
    const IF_LOCAL = process.env.NEXT_PUBLIC_IF_LOCAL === "true";
    
    const { data: ethBalanceData } = useBalance({
        address: connectedAccount,
    });

    // Get contract info for pools and tokens based on environment
    const { data: TokenATokenBPoolInfo } = useDeployedContractInfo({ contractName: "TokenATokenBPool" });
    const { data: TokenAInfo } = useDeployedContractInfo({ contractName: "TokenA" });
    const { data: TokenBInfo } = useDeployedContractInfo({ contractName: "TokenB" });

    // Only fetch ETH pool info if in local environment
    const { data: ETHTokenAPoolInfo } = IF_LOCAL 
        ? useDeployedContractInfo({ contractName: "ETHTokenAPool" })
        : { data: undefined };
    const { data: ETHTokenBPoolInfo } = IF_LOCAL
        ? useDeployedContractInfo({ contractName: "ETHTokenBPool" })
        : { data: undefined };

    // Read user token balances
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

    // Read user liquidity positions
    const { data: userTokenATokenBLiquidity } = useScaffoldReadContract({
        contractName: "TokenATokenBPool",
        functionName: "getLiquidity",
        args: [connectedAccount],
    });

    // Only fetch ETH pool liquidity if in local environment
    const ethTokenALiquidity = IF_LOCAL ? useScaffoldReadContract({
        contractName: "ETHTokenAPool",
        functionName: "getLiquidity",
        args: [connectedAccount],
    }) : { data: 0n };

    const ethTokenBLiquidity = IF_LOCAL ? useScaffoldReadContract({
        contractName: "ETHTokenBPool",
        functionName: "getLiquidity",
        args: [connectedAccount],
    }) : { data: 0n };

    useEffect(() => {
        if (
            ethBalanceData &&
            TokenATokenBPoolInfo &&
            TokenAInfo &&
            TokenBInfo &&
            userTokenABalance !== undefined &&
            userTokenBBalance !== undefined &&
            userTokenATokenBLiquidity !== undefined &&
            // Only check ETH pool data if in local environment
            (!IF_LOCAL || (
                ETHTokenAPoolInfo &&
                ETHTokenBPoolInfo &&
                ethTokenALiquidity.data !== undefined &&
                ethTokenBLiquidity.data !== undefined
            ))
        ) {
            setIsLoading(false);
        }
    }, [
        IF_LOCAL,
        ethBalanceData,
        ETHTokenAPoolInfo,
        ETHTokenBPoolInfo,
        TokenATokenBPoolInfo,
        TokenAInfo,
        TokenBInfo,
        userTokenABalance,
        userTokenBBalance,
        ethTokenALiquidity.data,
        ethTokenBLiquidity.data,
        userTokenATokenBLiquidity
    ]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-4xl font-bold mb-8">Swap Pools</h1>
                <p className="text-xl">Loading pools data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-4xl font-bold text-center mb-8">Swap Pools</h1>

            <div className="bg-base-200 p-4 rounded-lg mb-8">
                <h2 className="text-2xl font-medium mb-4">Your Balances</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-base-100 p-4 rounded-lg text-center">
                        <p className="text-lg font-medium">ETH</p>
                        <p className="text-lg">
                            <span className="text-xl">💰</span> {ethBalanceData ? parseFloat(ethBalanceData.formatted).toFixed(4) : "0.0000"} ETH
                        </p>
                    </div>
                    <div className="bg-base-100 p-4 rounded-lg text-center">
                        <p className="text-lg font-medium">TokenA (TKA)</p>
                        <p className="text-lg">
                            <span className="text-xl">🔴</span> {parseFloat(formatEther(userTokenABalance || 0n)).toFixed(4)} TKA
                        </p>
                    </div>
                    <div className="bg-base-100 p-4 rounded-lg text-center">
                        <p className="text-lg font-medium">TokenB (TKB)</p>
                        <p className="text-lg">
                            <span className="text-xl">🔵</span> {parseFloat(formatEther(userTokenBBalance || 0n)).toFixed(4)} TKB
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {IF_LOCAL && (
                    <>
                        <Pool
                            poolName="ETHTokenAPool"
                            poolType="eth-token"
                            poolAddress={ETHTokenAPoolInfo?.address || ""}
                            tokenAName="TokenA"
                            tokenAAddress={TokenAInfo?.address || ""}
                            userTokenABalance={userTokenABalance || 0n}
                            userLiquidity={ethTokenALiquidity.data || 0n}
                        />

                        <Pool
                            poolName="ETHTokenBPool"
                            poolType="eth-token"
                            poolAddress={ETHTokenBPoolInfo?.address || ""}
                            tokenAName="TokenB"
                            tokenAAddress={TokenBInfo?.address || ""}
                            userTokenABalance={userTokenBBalance || 0n}
                            userLiquidity={ethTokenBLiquidity.data || 0n}
                        />
                    </>
                )}

                <Pool
                    poolName="TokenATokenBPool"
                    poolType="token-token"
                    poolAddress={TokenATokenBPoolInfo?.address || ""}
                    tokenAName="TokenA"
                    tokenAAddress={TokenAInfo?.address || ""}
                    tokenBName="TokenB"
                    tokenBAddress={TokenBInfo?.address || ""}
                    userTokenABalance={userTokenABalance || 0n}
                    userTokenBBalance={userTokenBBalance || 0n}
                    userLiquidity={userTokenATokenBLiquidity || 0n}
                />
            </div>
        </div>
    );
};

export default PoolsPage;