"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Address, AddressInput, IntegerInput } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// REGEX for number inputs (only allow numbers and a single decimal point)
const NUMBER_REGEX = /^\.?\d+\.?\d*$/;

const TokensPage = () => {
    const { address: connectedAccount } = useAccount();
    const [selectedToken, setSelectedToken] = useState("TokenA");
    const [approveSpender, setApproveSpender] = useState("");
    const [approveAmount, setApproveAmount] = useState("");
    const [accountBalanceOf, setAccountBalanceOf] = useState("");

    // Get contract info for TokenA and TokenB
    const { data: TokenAInfo } = useDeployedContractInfo("TokenA");
    const { data: TokenBInfo } = useDeployedContractInfo("TokenB");

    // Get current contract based on selected token (ETH has no contract)
    const currentContractInfo = selectedToken === "TokenA" ? TokenAInfo : 
                               selectedToken === "TokenB" ? TokenBInfo : null;

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

    // Get ETH balance of connected account using wagmi's useBalance hook
    const { data: userETHBalance } = useBalance({
        address: connectedAccount,
    });

    // Get ETH balance for lookup address
    const { data: ethBalanceOfAddress } = useBalance({
        address: accountBalanceOf || undefined,
        enabled: accountBalanceOf ? true : false,
    });

    // Read token balance for lookup address
    const { data: tokenBalanceOfAddress } = useScaffoldReadContract({
        contractName: selectedToken,
        functionName: "balanceOf",
        args: [accountBalanceOf],
        enabled: accountBalanceOf && selectedToken !== "ETH" ? true : false,
    });

    // Write contract functions
    const { writeContractAsync: writeTokenAContractAsync } = useScaffoldWriteContract("TokenA");
    const { writeContractAsync: writeTokenBContractAsync } = useScaffoldWriteContract("TokenB");

    // Handle write contract action
    const handleApprove = async () => {
        if (!approveSpender || !NUMBER_REGEX.test(approveAmount) || selectedToken === "ETH") return;

        try {
            const writeContractFunction =
                selectedToken === "TokenA" ? writeTokenAContractAsync : writeTokenBContractAsync;

            await writeContractFunction({
                functionName: "approve",
                args: [
                    approveSpender,
                    NUMBER_REGEX.test(approveAmount) ? parseEther(approveAmount) : 0n,
                ],
            });
        } catch (err) {
            console.error(`Error calling approve function for ${selectedToken}`, err);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-4xl font-bold text-center mb-8">Token Manager</h1>

            <div className="flex justify-center mb-6">
                <div className="btn-group">
                    <button
                        className={`btn ${selectedToken === "TokenA" ? "btn-active" : ""}`}
                        onClick={() => setSelectedToken("TokenA")}
                    >
                        TokenA
                    </button>
                    <button
                        className={`btn ${selectedToken === "TokenB" ? "btn-active" : ""}`}
                        onClick={() => setSelectedToken("TokenB")}
                    >
                        TokenB
                    </button>
                    <button
                        className={`btn ${selectedToken === "ETH" ? "btn-active" : ""}`}
                        onClick={() => setSelectedToken("ETH")}
                    >
                        ETH
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Token Info Panel */}
                <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-8">
                    <h2 className="text-3xl font-semibold text-center mb-4">{selectedToken} Info</h2>

                    {selectedToken !== "ETH" && (
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-xl mb-2">Contract Address:</span>
                            <Address size="xl" address={currentContractInfo?.address} />
                        </div>
                    )}

                    {selectedToken === "ETH" && (
                        <div className="flex flex-col items-center mb-6">
                            <span className="text-xl mb-2">Native Ethereum Currency</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-base-200 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">Your Balances</h3>
                            <div className="space-y-2">
                                <p>TokenA: {parseFloat(formatEther(userTokenABalance || 0n)).toFixed(4)}</p>
                                <p>TokenB: {parseFloat(formatEther(userTokenBBalance || 0n)).toFixed(4)}</p>
                                <p>ETH: {userETHBalance ? parseFloat(userETHBalance.formatted).toFixed(4) : "0.0000"}</p>
                            </div>
                        </div>

                        <div className="bg-base-200 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">Balance Lookup</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2">Address:</label>
                                    <AddressInput
                                        value={accountBalanceOf}
                                        onChange={value => setAccountBalanceOf(value)}
                                        placeholder="Enter address to check balance"
                                    />
                                </div>

                                {accountBalanceOf && selectedToken !== "ETH" && tokenBalanceOfAddress !== undefined && (
                                    <div className="bg-primary text-primary-content p-2 rounded-lg text-center">
                                        <p>{selectedToken} Balance: {parseFloat(formatEther(tokenBalanceOfAddress || 0n)).toFixed(4)}</p>
                                    </div>
                                )}

                                {accountBalanceOf && selectedToken === "ETH" && ethBalanceOfAddress && (
                                    <div className="bg-primary text-primary-content p-2 rounded-lg text-center">
                                        <p>ETH Balance: {parseFloat(ethBalanceOfAddress.formatted).toFixed(4)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Token Actions Panel */}
                <div className="bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-8">
                    <h2 className="text-3xl font-semibold text-center mb-4">{selectedToken} Actions</h2>

                    <div className="space-y-6">
                        {selectedToken !== "ETH" ? (
                            <div className="bg-base-200 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-4">Approve Spender</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-2">Spender Address:</label>
                                        <AddressInput
                                            value={approveSpender}
                                            onChange={value => setApproveSpender(value)}
                                            placeholder="Address to approve"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2">Amount:</label>
                                        <IntegerInput
                                            value={approveAmount}
                                            onChange={value => setApproveAmount(value.toString())}
                                            placeholder="Amount to approve"
                                            disableMultiplyBy1e18
                                        />
                                    </div>

                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={handleApprove}
                                        disabled={!approveSpender || !NUMBER_REGEX.test(approveAmount)}
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-base-200 p-4 rounded-lg text-center">
                                <p className="text-lg">ETH is the native currency and doesn't support ERC20 actions like approve.</p>
                                <p className="mt-2">You can use tokens for more advanced functionality.</p>
                            </div>
                        )}

                        {/* Can add more token actions here if needed */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TokensPage;