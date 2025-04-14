"use client";

import React, { useEffect, useState } from "react";
import { formatEther } from "viem";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDeployedContractInfo, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

interface SwapEvent {
    blockNumber: number;
    inputAmount: number;
    outputAmount: number;
    executionPrice: number;
    type: 'EthToToken' | 'TokenToEth' | 'TokenAToTokenB' | 'TokenBToTokenA';
}

interface ChartData {
    priceRange: string;
    count: number;
    avgPrice: number;
}

interface TrendData {
    blockNumber: number;
    executionPrice: number;
}

const SwapLogsPage = () => {
    const [selectedPool, setSelectedPool] = useState("ETHTokenAPool");
    const [isLoading, setIsLoading] = useState(true);
    const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([]);
    const [histogramData, setHistogramData] = useState<ChartData[]>([]);
    const [trendData, setTrendData] = useState<TrendData[]>([]);

    // Get pool info
    const { data: currentPoolInfo } = useDeployedContractInfo({ contractName: selectedPool });

    // Get all relevant swap events for the selected pool
    const { data: ethToTokenEvents } = useScaffoldEventHistory({
        contractName: selectedPool,
        eventName: "EthToTokenSwap",
        fromBlock: 0n,
    });

    const { data: tokenToEthEvents } = useScaffoldEventHistory({
        contractName: selectedPool,
        eventName: "TokenToEthSwap",
        fromBlock: 0n,
    });

    const { data: tokenAToTokenBEvents } = useScaffoldEventHistory({
        contractName: selectedPool,
        eventName: "TokenAToTokenBSwap",
        fromBlock: 0n,
    });

    const { data: tokenBToTokenAEvents } = useScaffoldEventHistory({
        contractName: selectedPool,
        eventName: "TokenBToTokenASwap",
        fromBlock: 0n,
    });

    // Process swap events when data changes
    useEffect(() => {
        const processedEvents: SwapEvent[] = [];

        if (selectedPool.startsWith("ETH")) {
            // Process ETH-Token pool events
            ethToTokenEvents?.forEach(event => {
                const ethInput = Number(formatEther(BigInt(event.args.ethInput || 0)));
                const tokenOutput = Number(formatEther(BigInt(event.args.tokenOutput || 0)));
                
                processedEvents.push({
                    blockNumber: Number(event.blockNumber),
                    inputAmount: ethInput,
                    outputAmount: tokenOutput,
                    executionPrice: tokenOutput / ethInput,
                    type: 'EthToToken'
                });
            });

            tokenToEthEvents?.forEach(event => {
                const tokensInput = Number(formatEther(BigInt(event.args.tokensInput || 0)));
                const ethOutput = Number(formatEther(BigInt(event.args.ethOutput || 0)));
                
                processedEvents.push({
                    blockNumber: Number(event.blockNumber),
                    inputAmount: tokensInput,
                    outputAmount: ethOutput,
                    executionPrice: ethOutput / tokensInput,
                    type: 'TokenToEth'
                });
            });
        } else {
            // Process Token-Token pool events
            tokenAToTokenBEvents?.forEach(event => {
                const tokenAInput = Number(formatEther(BigInt(event.args.tokenAInput || 0)));
                const tokenBOutput = Number(formatEther(BigInt(event.args.tokenBOutput || 0)));
                
                processedEvents.push({
                    blockNumber: Number(event.blockNumber),
                    inputAmount: tokenAInput,
                    outputAmount: tokenBOutput,
                    executionPrice: tokenBOutput / tokenAInput,
                    type: 'TokenAToTokenB'
                });
            });

            tokenBToTokenAEvents?.forEach(event => {
                const tokenBInput = Number(formatEther(BigInt(event.args.tokenBInput || 0)));
                const tokenAOutput = Number(formatEther(BigInt(event.args.tokenAOutput || 0)));
                
                processedEvents.push({
                    blockNumber: Number(event.blockNumber),
                    inputAmount: tokenBInput,
                    outputAmount: tokenAOutput,
                    executionPrice: tokenAOutput / tokenBInput,
                    type: 'TokenBToTokenA'
                });
            });
        }

        if (processedEvents.length > 0) {
            // Sort events by block number
            processedEvents.sort((a, b) => a.blockNumber - b.blockNumber);
            setSwapEvents(processedEvents);

            // Create histogram data
            const prices = processedEvents.map(e => e.executionPrice);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const binCount = 15;
            const binSize = (maxPrice - minPrice) / binCount;

            const bins: { [key: string]: { count: number; sum: number } } = {};
            
            prices.forEach(price => {
                const binIndex = Math.floor((price - minPrice) / binSize);
                const binStart = (minPrice + binIndex * binSize).toFixed(4);
                const binEnd = (minPrice + (binIndex + 1) * binSize).toFixed(4);
                const binKey = `${binStart}-${binEnd}`;
                
                if (!bins[binKey]) {
                    bins[binKey] = { count: 0, sum: 0 };
                }
                bins[binKey].count++;
                bins[binKey].sum += price;
            });

            const processedHistogramData = Object.entries(bins)
                .map(([range, data]) => ({
                    priceRange: range,
                    count: data.count,
                    avgPrice: data.sum / data.count
                }))
                .sort((a, b) => {
                    const [aStart] = a.priceRange.split('-').map(Number);
                    const [bStart] = b.priceRange.split('-').map(Number);
                    return aStart - bStart;
                });

            setHistogramData(processedHistogramData);

            // Create trend data
            const processedTrendData = processedEvents.map(event => ({
                blockNumber: event.blockNumber,
                executionPrice: event.executionPrice
            }));

            setTrendData(processedTrendData);
        }

        setIsLoading(false);
    }, [ethToTokenEvents, tokenToEthEvents, tokenAToTokenBEvents, tokenBToTokenAEvents, selectedPool]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-4xl font-bold mb-8">Swap Analysis</h1>
                <p className="text-xl">Loading swap history...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-4xl font-bold text-center mb-8">Swap Analysis</h1>
            
            <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mb-8">
                {/* Pool Selection */}
                <div className="flex justify-center mb-8 space-x-4">
                    <button
                        className={`btn ${selectedPool === "ETHTokenAPool" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setSelectedPool("ETHTokenAPool")}
                    >
                        ETH-TokenA Pool
                    </button>
                    <button
                        className={`btn ${selectedPool === "ETHTokenBPool" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setSelectedPool("ETHTokenBPool")}
                    >
                        ETH-TokenB Pool
                    </button>
                    <button
                        className={`btn ${selectedPool === "TokenATokenBPool" ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setSelectedPool("TokenATokenBPool")}
                    >
                        TokenA-TokenB Pool
                    </button>
                </div>

                {/* Pool Info */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Selected Pool: {selectedPool}</h2>
                    <p className="text-lg">Pool Address: {currentPoolInfo?.address}</p>
                </div>

                {/* Price Distribution Histogram */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-center mb-6">Price Distribution</h2>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={histogramData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="priceRange" 
                                    label={{ value: 'Execution Price Range', position: 'bottom' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis 
                                    label={{ value: 'Number of Swaps', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-base-200 p-4 rounded-lg">
                                                    <p>Price Range: {payload[0].payload.priceRange}</p>
                                                    <p>Number of Swaps: {payload[0].payload.count}</p>
                                                    <p>Average Price: {payload[0].payload.avgPrice.toFixed(4)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="count" fill="#8884d8" name="Number of Swaps" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Price Trend Chart */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-center mb-6">Price Trend</h2>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="blockNumber" 
                                    label={{ value: 'Block Number', position: 'bottom' }}
                                />
                                <YAxis 
                                    label={{ value: 'Execution Price', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-base-200 p-4 rounded-lg">
                                                    <p>Block: {payload[0].payload.blockNumber}</p>
                                                    <p>Price: {payload[0].payload.executionPrice.toFixed(4)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="executionPrice" 
                                    stroke="#82ca9d" 
                                    name="Execution Price"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Swaps Table */}
                <div>
                    <h2 className="text-2xl font-semibold text-center mb-6">Recent Swaps</h2>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Block</th>
                                    <th>Type</th>
                                    <th>Input Amount</th>
                                    <th>Output Amount</th>
                                    <th>Execution Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {swapEvents.slice(-10).reverse().map((event, index) => (
                                    <tr key={index}>
                                        <td>{event.blockNumber}</td>
                                        <td>{event.type}</td>
                                        <td>{event.inputAmount.toFixed(4)}</td>
                                        <td>{event.outputAmount.toFixed(4)}</td>
                                        <td>{event.executionPrice.toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwapLogsPage;