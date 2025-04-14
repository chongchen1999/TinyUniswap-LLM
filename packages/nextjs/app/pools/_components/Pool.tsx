"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { Address, Balance, EtherInput, IntegerInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";
import { Curve } from ".";

// REGEX for number inputs (only allow numbers and a single decimal point)
const NUMBER_REGEX = /^\.?\d+\.?\d*$/;

export type PoolType = 'eth-token' | 'token-token';

interface PoolProps {
    poolName: string;
    poolType: PoolType;
    poolAddress: string;
    tokenAName: string;
    tokenAAddress: string;
    tokenBName?: string;
    tokenBAddress?: string;
    userTokenABalance: bigint;
    userTokenBBalance?: bigint;
    userLiquidity: bigint;
}

const Pool = ({
    poolName,
    poolType,
    poolAddress,
    tokenAName,
    tokenAAddress,
    tokenBName,
    tokenBAddress,
    userTokenABalance,
    userTokenBBalance,
    userLiquidity,
}: PoolProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [fromToken, setFromToken] = useState(poolType === 'eth-token' ? 'ETH' : tokenAName);
    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [depositTokenAmount, setDepositTokenAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");

    // Read pool token balances
    const { data: poolTokenABalance } = useScaffoldReadContract({
        contractName: tokenAName,
        functionName: "balanceOf",
        args: [poolAddress],
    });

    const { data: poolTokenBBalance } = useScaffoldReadContract({
        contractName: tokenBName || "",
        functionName: "balanceOf",
        args: [poolAddress],
        enabled: poolType === 'token-token' && tokenBAddress ? true : false,
    });

    // Read pool ETH balance for ETH-Token pools
    const { data: poolETHBalance } = useWatchBalance({
        address: poolAddress,
        enabled: poolType === 'eth-token'
    });

    // Read total liquidity
    const { data: totalLiquidity } = useScaffoldReadContract({
        contractName: poolName,
        functionName: "totalLiquidity",
    });

    // Contract write functions
    const { writeContractAsync: writePoolContract } = useScaffoldWriteContract(poolName);
    const { writeContractAsync: writeTokenAContract } = useScaffoldWriteContract(tokenAName);
    const { writeContractAsync: writeTokenBContract } = useScaffoldWriteContract(tokenBName || "");

    useEffect(() => {
        if ((poolType === 'eth-token' && poolTokenABalance !== undefined && poolETHBalance !== undefined) ||
            (poolType === 'token-token' && poolTokenABalance !== undefined && poolTokenBBalance !== undefined)) {
            setIsLoading(false);
        }
    }, [poolTokenABalance, poolETHBalance, poolTokenBBalance, poolType]);

    // Handle token approvals
    const approveTokens = async (tokenAmount: string, isTokenA: boolean) => {
        try {
            const amount = parseEther(tokenAmount);
            if (isTokenA) {
                await writeTokenAContract({
                    functionName: "approve",
                    args: [poolAddress, amount],
                });
            } else if (tokenBName && writeTokenBContract) {
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

    // Handle swaps
    const handleSwap = async () => {
        if (!NUMBER_REGEX.test(fromAmount)) return;

        try {
            if (poolType === 'eth-token') {
                if (fromToken === 'ETH') {
                    await writePoolContract({
                        functionName: "ethToToken",
                        value: parseEther(fromAmount),
                    });
                } else {
                    // Approve tokens first
                    await approveTokens(fromAmount, true);
                    await writePoolContract({
                        functionName: "tokenToEth",
                        args: [parseEther(fromAmount)],
                    });
                }
            } else if (poolType === 'token-token') {
                // Approve tokens first
                const isFromTokenA = fromToken === tokenAName;
                await approveTokens(fromAmount, isFromTokenA);

                await writePoolContract({
                    functionName: isFromTokenA ? "tokenAToTokenB" : "tokenBToTokenA",
                    args: [parseEther(fromAmount)],
                });
            }
        } catch (err) {
            console.error(`Error executing swap in ${poolName}`, err);
        }
    };

    // Handle liquidity addition
    const handleAddLiquidity = async () => {
        if (!NUMBER_REGEX.test(depositAmount) || !NUMBER_REGEX.test(depositTokenAmount)) return;

        try {
            // Check if pool is initialized
            const isInitialized = totalLiquidity && totalLiquidity > 0n;

            if (poolType === 'eth-token') {
                // Approve tokens first
                await approveTokens(depositTokenAmount, true);

                if (!isInitialized) {
                    await writePoolContract({
                        functionName: "init",
                        args: [parseEther(depositTokenAmount)],
                        value: parseEther(depositAmount),
                    });
                } else {
                    await writePoolContract({
                        functionName: "deposit",
                        value: parseEther(depositAmount),
                    });
                }
            } else if (poolType === 'token-token') {
                // Approve both tokens
                await approveTokens(depositAmount, true);
                await approveTokens(depositTokenAmount, false);

                if (!isInitialized) {
                    await writePoolContract({
                        functionName: "init",
                        args: [parseEther(depositAmount), parseEther(depositTokenAmount)],
                    });
                } else {
                    await writePoolContract({
                        functionName: "deposit",
                        args: [parseEther(depositAmount), parseEther(depositTokenAmount)],
                    });
                }
            }
        } catch (err) {
            console.error(`Error adding liquidity to ${poolName}`, err);
        }
    };

    // Handle liquidity withdrawal
    const handleWithdrawLiquidity = async () => {
        if (!NUMBER_REGEX.test(withdrawAmount)) return;

        try {
            await writePoolContract({
                functionName: "withdraw",
                args: [parseEther(withdrawAmount)],
            });
        } catch (err) {
            console.error(`Error withdrawing liquidity from ${poolName}`, err);
        }
    };

    return (
        <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-semibold text-center mb-4">{poolName}</h2>

            <div className="items-start grid grid-cols-1 md:grid-cols-2 content-start">
                <div className="px-5 py-5">
                    <div className="bg-base-100 shadow-lg shadow-secondary border-2 border-secondary rounded-xl p-4 mb-4">
                        <div className="flex flex-col text-center">
                            <span className="text-xl font-semibold mb-2">Pool Address</span>
                            <span className="block mb-2 mx-auto">
                                <Address size="md" address={poolAddress} />
                            </span>
                            <span className="flex flex-row justify-center mt-2">
                                {poolType === 'eth-token' ? (
                                    <>
                                        <Balance className="text-lg" address={poolAddress} /> ⚖️
                                        {isLoading ? (
                                            <span>Loading...</span>
                                        ) : (
                                            <span className="pl-4 text-lg">
                                                {tokenAName}: {parseFloat(formatEther(poolTokenABalance || 0n)).toFixed(4)}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg">
                                            {tokenAName}: {parseFloat(formatEther(poolTokenABalance || 0n)).toFixed(4)}
                                        </span>
                                        <span className="pl-4 text-lg">
                                            {tokenBName}: {parseFloat(formatEther(poolTokenBBalance || 0n)).toFixed(4)}
                                        </span>
                                    </>
                                )}
                            </span>
                        </div>

                        <div className="py-3 px-4">
                            <div className="flex mb-4 justify-center items-center">
                                <span className="w-full">
                                    {fromToken} to {poolType === 'eth-token' ? (fromToken === 'ETH' ? tokenAName : 'ETH') : (fromToken === tokenAName ? tokenBName : tokenAName)}
                                    {fromToken === 'ETH' ? (
                                        <EtherInput
                                            value={fromAmount}
                                            onChange={value => {
                                                setToAmount("");
                                                setFromAmount(value);
                                            }}
                                            name="fromAmount"
                                        />
                                    ) : (
                                        <IntegerInput
                                            value={fromAmount}
                                            onChange={value => {
                                                setToAmount("");
                                                setFromAmount(value.toString());
                                            }}
                                            name="fromAmount"
                                            disableMultiplyBy1e18
                                        />
                                    )}
                                </span>
                                <button
                                    className="btn btn-primary h-[2.2rem] min-h-[2.2rem] mt-6 mx-5"
                                    onClick={handleSwap}
                                    disabled={!NUMBER_REGEX.test(fromAmount)}
                                >
                                    Swap
                                </button>
                            </div>

                            {poolType === 'eth-token' && (
                                <div className="flex justify-center mb-2">
                                    <button
                                        className={`btn btn-sm ${fromToken === 'ETH' ? 'btn-primary' : 'btn-outline'} mr-2`}
                                        onClick={() => {
                                            setFromToken('ETH');
                                            setFromAmount("");
                                            setToAmount("");
                                        }}
                                    >
                                        ETH → {tokenAName}
                                    </button>
                                    <button
                                        className={`btn btn-sm ${fromToken === tokenAName ? 'btn-primary' : 'btn-outline'} ml-2`}
                                        onClick={() => {
                                            setFromToken(tokenAName);
                                            setFromAmount("");
                                            setToAmount("");
                                        }}
                                    >
                                        {tokenAName} → ETH
                                    </button>
                                </div>
                            )}

                            {poolType === 'token-token' && (
                                <div className="flex justify-center mb-2">
                                    <button
                                        className={`btn btn-sm ${fromToken === tokenAName ? 'btn-primary' : 'btn-outline'} mr-2`}
                                        onClick={() => {
                                            setFromToken(tokenAName);
                                            setFromAmount("");
                                            setToAmount("");
                                        }}
                                    >
                                        {tokenAName} → {tokenBName}
                                    </button>
                                    <button
                                        className={`btn btn-sm ${fromToken === tokenBName ? 'btn-primary' : 'btn-outline'} ml-2`}
                                        onClick={() => {
                                            setFromToken(tokenBName || "");
                                            setFromAmount("");
                                            setToAmount("");
                                        }}
                                    >
                                        {tokenBName} → {tokenAName}
                                    </button>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-primary-content text-lg mt-4">
                            Liquidity ({totalLiquidity ? parseFloat(formatEther(totalLiquidity || 0n)).toFixed(4) : "None"})
                        </p>
                        <p className="text-center text-primary-content text-sm">
                            Your Liquidity: {parseFloat(formatEther(userLiquidity || 0n)).toFixed(4)}
                        </p>

                        <div className="px-4 py-3">
                            <div className="flex mb-4 justify-center items-center">
                                <span className="w-full">
                                    {poolType === 'eth-token' ? 'ETH Amount' : `${tokenAName} Amount`}
                                    <EtherInput value={depositAmount} onChange={value => setDepositAmount(value)} />
                                </span>
                            </div>

                            <div className="flex mb-4 justify-center items-center">
                                <span className="w-full">
                                    {poolType === 'eth-token' ? `${tokenAName} Amount` : `${tokenBName} Amount`}
                                    <IntegerInput
                                        value={depositTokenAmount}
                                        onChange={value => setDepositTokenAmount(value.toString())}
                                        disableMultiplyBy1e18
                                    />
                                </span>
                            </div>

                            <button
                                className="btn btn-primary w-full mb-4"
                                onClick={handleAddLiquidity}
                                disabled={!NUMBER_REGEX.test(depositAmount) || !NUMBER_REGEX.test(depositTokenAmount)}
                            >
                                Add Liquidity
                            </button>

                            <div className="flex justify-center items-center">
                                <span className="w-full">
                                    Withdraw Amount
                                    <EtherInput value={withdrawAmount} onChange={value => setWithdrawAmount(value)} />
                                </span>
                            </div>

                            <button
                                className="btn btn-primary w-full mt-2"
                                onClick={handleWithdrawLiquidity}
                                disabled={!NUMBER_REGEX.test(withdrawAmount)}
                            >
                                Withdraw
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto p-4">
                    {poolType === 'eth-token' && (
                        <Curve
                            addingEth={fromToken === 'ETH' && fromAmount !== "" ? parseFloat(fromAmount.toString()) : 0}
                            addingToken={fromToken === tokenAName && fromAmount !== "" ? parseFloat(fromAmount.toString()) : 0}
                            ethReserve={parseFloat(formatEther(poolETHBalance?.value || 0n))}
                            tokenReserve={parseFloat(formatEther(poolTokenABalance || 0n))}
                            width={400}
                            height={400}
                        />
                    )}
                    {poolType === 'token-token' && (
                        <Curve
                            addingEth={fromToken === tokenAName && fromAmount !== "" ? parseFloat(fromAmount.toString()) : 0}
                            addingToken={fromToken === tokenBName && fromAmount !== "" ? parseFloat(fromAmount.toString()) : 0}
                            ethReserve={parseFloat(formatEther(poolTokenABalance || 0n))}
                            tokenReserve={parseFloat(formatEther(poolTokenBBalance || 0n))}
                            width={400}
                            height={400}
                            xAxisLabel={tokenAName}
                            yAxisLabel={tokenBName}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Pool;