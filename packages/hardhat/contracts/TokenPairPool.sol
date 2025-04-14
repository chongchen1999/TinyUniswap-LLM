// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenPairPool {
    /* ========== GLOBAL VARIABLES ========== */

    IERC20 public tokenA;
    IERC20 public tokenB;
    string public tokenAName;
    string public tokenBName;
    address public tokenAAddress;
    address public tokenBAddress;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    /* ========== EVENTS ========== */

    event TokenAToTokenBSwap(address swapper, uint256 tokenBOutput, uint256 tokenAInput);
    event TokenBToTokenASwap(address swapper, uint256 tokenBInput, uint256 tokenAOutput);
    event LiquidityProvided(address liquidityProvider, uint256 liquidityMinted, uint256 tokenAInput, uint256 tokenBInput);
    event LiquidityRemoved(
        address liquidityRemover,
        uint256 liquidityWithdrawn,
        uint256 tokenAOutput,
        uint256 tokenBOutput
    );

    /* ========== CONSTRUCTOR ========== */

    constructor(address tokenAAddr, address tokenBAddr) {
        tokenA = IERC20(tokenAAddr);
        tokenB = IERC20(tokenBAddr);
        tokenAAddress = tokenAAddr;
        tokenBAddress = tokenBAddr;
        
        // Try to get the token names if available
        // This is optional and may fail if the token contracts don't implement name()
        try IERC20Metadata(tokenAAddr).name() returns (string memory name) {
            tokenAName = name;
        } catch {
            tokenAName = "Unknown";
        }
        
        try IERC20Metadata(tokenBAddr).name() returns (string memory name) {
            tokenBName = name;
        } catch {
            tokenBName = "Unknown";
        }
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function init(uint256 tokenAAmount, uint256 tokenBAmount) public returns (uint256) {
        require(totalLiquidity == 0, "SwapPool: already initialized");
        require(tokenAAmount > 0 && tokenBAmount > 0, "SwapPool: zero amounts");
        
        totalLiquidity = tokenAAmount; // Use tokenA amount as the initial liquidity value
        liquidity[msg.sender] = totalLiquidity;
        
        require(tokenA.transferFrom(msg.sender, address(this), tokenAAmount), "SwapPool: tokenA transfer failed");
        require(tokenB.transferFrom(msg.sender, address(this), tokenBAmount), "SwapPool: tokenB transfer failed");
        
        emit LiquidityProvided(msg.sender, totalLiquidity, tokenAAmount, tokenBAmount);
        
        return totalLiquidity;
    }

    function price(uint256 xInput, uint256 xReserves, uint256 yReserves) public pure returns (uint256 yOutput) {
        require(xReserves > 0 && yReserves > 0, "SwapPool: zero reserves");
        
        uint256 xInputWithFee = xInput * 997;
        uint256 numerator = xInputWithFee * yReserves;
        uint256 denominator = (xReserves * 1000) + xInputWithFee;
        
        return numerator / denominator;
    }

    function getLiquidity(address lp) public view returns (uint256) {
        return liquidity[lp];
    }

    function tokenAToTokenB(uint256 tokenAInput) public returns (uint256 tokenBOutput) {
        require(tokenAInput > 0, "SwapPool: zero tokenA amount");
        
        uint256 tokenAReserve = tokenA.balanceOf(address(this));
        uint256 tokenBReserve = tokenB.balanceOf(address(this));
        
        tokenBOutput = price(tokenAInput, tokenAReserve, tokenBReserve);
        
        require(tokenA.transferFrom(msg.sender, address(this), tokenAInput), "SwapPool: tokenA transfer failed");
        require(tokenB.transfer(msg.sender, tokenBOutput), "SwapPool: tokenB transfer failed");
        
        emit TokenAToTokenBSwap(msg.sender, tokenBOutput, tokenAInput);
        
        return tokenBOutput;
    }

    function tokenBToTokenA(uint256 tokenBInput) public returns (uint256 tokenAOutput) {
        require(tokenBInput > 0, "SwapPool: zero tokenB amount");
        
        uint256 tokenBReserve = tokenB.balanceOf(address(this));
        uint256 tokenAReserve = tokenA.balanceOf(address(this));
        
        tokenAOutput = price(tokenBInput, tokenBReserve, tokenAReserve);
        
        require(tokenB.transferFrom(msg.sender, address(this), tokenBInput), "SwapPool: tokenB transfer failed");
        require(tokenA.transfer(msg.sender, tokenAOutput), "SwapPool: tokenA transfer failed");
        
        emit TokenBToTokenASwap(msg.sender, tokenBInput, tokenAOutput);
        
        return tokenAOutput;
    }

    function deposit(uint256 tokenAAmount, uint256 tokenBAmount) public returns (uint256 liquidityMinted) {
        require(tokenAAmount > 0 && tokenBAmount > 0, "SwapPool: zero token amounts");
        
        uint256 tokenAReserve = tokenA.balanceOf(address(this));
        uint256 tokenBReserve = tokenB.balanceOf(address(this));
        
        // Calculate what would be a balanced deposit based on current reserves
        uint256 tokenBOptimal = (tokenAAmount * tokenBReserve) / tokenAReserve;
        
        // Determine the actual deposit amounts
        uint256 tokenADeposit = tokenAAmount;
        uint256 tokenBDeposit;
        
        if (tokenBOptimal <= tokenBAmount) {
            // User provided enough or more tokenB than needed
            tokenBDeposit = tokenBOptimal;
        } else {
            // User provided less tokenB than optimal, recalculate tokenA deposit
            tokenBDeposit = tokenBAmount;
            tokenADeposit = (tokenBAmount * tokenAReserve) / tokenBReserve;
        }
        
        // Calculate liquidity to be minted
        liquidityMinted = (tokenADeposit * totalLiquidity) / tokenAReserve;
        
        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;
        
        require(tokenA.transferFrom(msg.sender, address(this), tokenADeposit), "SwapPool: tokenA transfer failed");
        require(tokenB.transferFrom(msg.sender, address(this), tokenBDeposit), "SwapPool: tokenB transfer failed");
        
        emit LiquidityProvided(msg.sender, liquidityMinted, tokenADeposit, tokenBDeposit);
        
        return liquidityMinted;
    }

    function withdraw(uint256 amount) public returns (uint256 tokenAAmount, uint256 tokenBAmount) {
        require(amount > 0, "SwapPool: zero liquidity amount");
        require(liquidity[msg.sender] >= amount, "SwapPool: insufficient liquidity");
        
        uint256 tokenAReserve = tokenA.balanceOf(address(this));
        uint256 tokenBReserve = tokenB.balanceOf(address(this));
        
        tokenAAmount = (amount * tokenAReserve) / totalLiquidity;
        tokenBAmount = (amount * tokenBReserve) / totalLiquidity;
        
        liquidity[msg.sender] -= amount;
        totalLiquidity -= amount;
        
        require(tokenA.transfer(msg.sender, tokenAAmount), "SwapPool: tokenA transfer failed");
        require(tokenB.transfer(msg.sender, tokenBAmount), "SwapPool: tokenB transfer failed");
        
        emit LiquidityRemoved(msg.sender, amount, tokenAAmount, tokenBAmount);
        
        return (tokenAAmount, tokenBAmount);
    }
}

// Interface to get token name if available
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
}