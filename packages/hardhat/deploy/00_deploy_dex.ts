import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";

import { MockERC20 } from "../typechain-types/contracts/MockERC20";
import { EthTokenPool } from "../typechain-types/contracts/EthTokenPool.sol/EthTokenPool";
import { TokenPairPool } from "../typechain-types/contracts/TokenPairPool.sol/TokenPairPool";

// Load environment variables
dotenv.config();

/**
 * Deploys tokens and swap pools
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySwapPools: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    // Get frontend address from .env
    const frontendAddress = process.env.FRONTEND_ADDRESS_1 || deployer;
    
    // Check if we're in local or testnet environment
    const isLocal = process.env.IF_LOCAL ? process.env.IF_LOCAL.toLowerCase() === 'true' : true;

    console.log("Deployer address:", deployer);
    console.log("Frontend address:", frontendAddress);
    console.log("Is local environment:", isLocal);
    
    // Get initial liquidity values from .env with fallback values
    // Only parse these values if we're in local environment
    let ethTokenALiquidity = ethers.parseEther("0.1"); // Reduced default to 0.1 ETH
    let ethTokenBLiquidity = ethers.parseEther("0.1"); // Reduced default to 0.1 ETH
    
    if (isLocal) {
        ethTokenALiquidity = process.env.ETH_TOKEN_A_LIQUIDITY 
            ? ethers.parseEther(process.env.ETH_TOKEN_A_LIQUIDITY) 
            : ethers.parseEther("0.1");
        
        ethTokenBLiquidity = process.env.ETH_TOKEN_B_LIQUIDITY 
            ? ethers.parseEther(process.env.ETH_TOKEN_B_LIQUIDITY) 
            : ethers.parseEther("0.1");
    }
    
    const tokenATokenBLiquidityA = process.env.TOKEN_A_TOKEN_B_LIQUIDITY_A 
        ? ethers.parseEther(process.env.TOKEN_A_TOKEN_B_LIQUIDITY_A) 
        : ethers.parseEther("100");
    
    const tokenATokenBLiquidityB = process.env.TOKEN_A_TOKEN_B_LIQUIDITY_B 
        ? ethers.parseEther(process.env.TOKEN_A_TOKEN_B_LIQUIDITY_B) 
        : ethers.parseEther("100");

    // Log initial liquidity values
    console.log("Initial liquidity values:");
    if (isLocal) {
        console.log(`ETH-TokenA Pool: ${ethers.formatEther(ethTokenALiquidity)} ETH and ${ethers.formatEther(ethTokenALiquidity)} TokenA`);
        console.log(`ETH-TokenB Pool: ${ethers.formatEther(ethTokenBLiquidity)} ETH and ${ethers.formatEther(ethTokenBLiquidity)} TokenB`);
    }
    console.log(`TokenA-TokenB Pool: ${ethers.formatEther(tokenATokenBLiquidityA)} TokenA and ${ethers.formatEther(tokenATokenBLiquidityB)} TokenB`);

    // Deploy TokenA
    await deploy("TokenA", {
        contract: "MockERC20",
        from: deployer,
        args: ["TokenA", "TKA", ethers.parseEther("100000")], // 100_000 tokens with 18 decimals
        log: true,
        autoMine: true,
    });

    // Deploy TokenB
    await deploy("TokenB", {
        contract: "MockERC20",
        from: deployer,
        args: ["TokenB", "TKB", ethers.parseEther("100000")], // 100_00 tokens with 18 decimals
        log: true,
        autoMine: true,
    });

    // Get deployed token contracts
    const tokenA = await hre.ethers.getContract<MockERC20>("TokenA", deployer);
    const tokenB = await hre.ethers.getContract<MockERC20>("TokenB", deployer);

    const tokenAAddress = await tokenA.getAddress();
    const tokenBAddress = await tokenB.getAddress();

    console.log("TokenA deployed to:", tokenAAddress);
    console.log("TokenB deployed to:", tokenBAddress);

    // Only deploy ETH pools if in local environment
    let ethTokenAPool, ethTokenBPool;
    let ethTokenAPoolAddress, ethTokenBPoolAddress;
    
    if (isLocal) {
        // Deploy ETH-TokenA Pool
        await deploy("ETHTokenAPool", {
            contract: "EthTokenPool",
            from: deployer,
            args: [tokenAAddress],
            log: true,
            autoMine: true,
        });

        // Deploy ETH-TokenB Pool
        await deploy("ETHTokenBPool", {
            contract: "EthTokenPool",
            from: deployer,
            args: [tokenBAddress],
            log: true,
            autoMine: true,
        });
        
        // Get deployed ETH pool contracts
        ethTokenAPool = await hre.ethers.getContract<EthTokenPool>("ETHTokenAPool", deployer);
        ethTokenBPool = await hre.ethers.getContract<EthTokenPool>("ETHTokenBPool", deployer);

        ethTokenAPoolAddress = await ethTokenAPool.getAddress();
        ethTokenBPoolAddress = await ethTokenBPool.getAddress();

        console.log("ETH-TokenA Pool deployed to:", ethTokenAPoolAddress);
        console.log("ETH-TokenB Pool deployed to:", ethTokenBPoolAddress);
    }

    // Always deploy TokenA-TokenB Pool
    await deploy("TokenATokenBPool", {
        contract: "TokenPairPool",
        from: deployer,
        args: [tokenAAddress, tokenBAddress],
        log: true,
        autoMine: true,
    });

    // Get deployed Token-Token pool contract
    const tokenATokenBPool = await hre.ethers.getContract<TokenPairPool>("TokenATokenBPool", deployer);
    const tokenATokenBPoolAddress = await tokenATokenBPool.getAddress();
    console.log("TokenA-TokenB Pool deployed to:", tokenATokenBPoolAddress);

    // Transfer some tokens to frontend address
    if (frontendAddress !== deployer) {
        console.log(`Transferring tokens to frontend address: ${frontendAddress}`);
        await tokenA.transfer(frontendAddress, ethers.parseEther("10000"));
        await tokenB.transfer(frontendAddress, ethers.parseEther("10000"));
    }

    // Initialize pools with liquidity
    if (isLocal) {
        // Initialize ETH-TokenA Pool
        console.log("Approving ETH-TokenA Pool to take TokenA...");
        await tokenA.approve(ethTokenAPoolAddress, ethTokenALiquidity);

        console.log("Initializing ETH-TokenA Pool...");
        await ethTokenAPool.init(ethTokenALiquidity, {
            value: ethTokenALiquidity,
            gasLimit: 300000,
        });

        // Initialize ETH-TokenB Pool
        console.log("Approving ETH-TokenB Pool to take TokenB...");
        await tokenB.approve(ethTokenBPoolAddress, ethTokenBLiquidity);

        console.log("Initializing ETH-TokenB Pool...");
        await ethTokenBPool.init(ethTokenBLiquidity, {
            value: ethTokenBLiquidity,
            gasLimit: 300000,
        });
    }

    // Always initialize TokenA-TokenB Pool
    console.log("Approving TokenA-TokenB Pool to take tokens...");
    await tokenA.approve(tokenATokenBPoolAddress, tokenATokenBLiquidityA);
    await tokenB.approve(tokenATokenBPoolAddress, tokenATokenBLiquidityB);

    console.log("Initializing TokenA-TokenB Pool...");
    await tokenATokenBPool.init(tokenATokenBLiquidityA, tokenATokenBLiquidityB);

    // Transfer liquidity tokens to frontend address if not the deployer
    if (frontendAddress !== deployer && isLocal) {
        // This section only runs in local environment
        // Get liquidity balances
        const ethTokenALiquidityBalance = await ethTokenAPool.getLiquidity(deployer);
        const ethTokenBLiquidityBalance = await ethTokenBPool.getLiquidity(deployer);
        console.log(`Liquidity balances for ETH pools would be transferred (if implemented)`);
    }
    
    if (frontendAddress !== deployer) {
        // This always runs
        const tokenATokenBLiquidityBalance = await tokenATokenBPool.getLiquidity(deployer);
        console.log(`TokenA-TokenB liquidity balance would be transferred (if implemented)`);
    }
};

export default deploySwapPools;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deploySwapPools.tags = ["SwapPools", "Tokens"];