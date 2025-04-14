// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EthTokenPool {
    /* ========== GLOBAL VARIABLES ========== */

    IERC20 public token;
    string public tokenName;
    address public tokenAddress;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    /* ========== EVENTS ========== */

    event EthToTokenSwap(address swapper, uint256 tokenOutput, uint256 ethInput);
    event TokenToEthSwap(address swapper, uint256 tokensInput, uint256 ethOutput);
    event LiquidityProvided(address liquidityProvider, uint256 liquidityMinted, uint256 ethInput, uint256 tokensInput);
    event LiquidityRemoved(
        address liquidityRemover,
        uint256 liquidityWithdrawn,
        uint256 tokensOutput,
        uint256 ethOutput
    );

    /* ========== CONSTRUCTOR ========== */

    constructor(address tokenAddr) {
        token = IERC20(tokenAddr);
        tokenAddress = tokenAddr;
        
        // Try to get the token name if available
        // This is optional and may fail if the token contract doesn't implement name()
        try IERC20Metadata(tokenAddr).name() returns (string memory name) {
            tokenName = name;
        } catch {
            tokenName = "Unknown";
        }
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function init(uint256 tokens) public payable returns (uint256) {
        require(totalLiquidity == 0, "SwapPool: already initialized");
        require(tokens > 0 && msg.value > 0, "SwapPool: zero amounts");
        
        totalLiquidity = msg.value;
        liquidity[msg.sender] = totalLiquidity;
        
        require(token.transferFrom(msg.sender, address(this), tokens), "SwapPool: token transfer failed");
        
        emit LiquidityProvided(msg.sender, totalLiquidity, msg.value, tokens);
        
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

    function ethToToken() public payable returns (uint256 tokenOutput) {
        require(msg.value > 0, "SwapPool: zero ETH amount");
        
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));
        
        tokenOutput = price(msg.value, ethReserve, tokenReserve);
        
        require(token.transfer(msg.sender, tokenOutput), "SwapPool: token transfer failed");
        
        emit EthToTokenSwap(msg.sender, tokenOutput, msg.value);
        
        return tokenOutput;
    }

    function tokenToEth(uint256 tokenInput) public returns (uint256 ethOutput) {
        require(tokenInput > 0, "SwapPool: zero token amount");
        
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 ethReserve = address(this).balance;
        
        ethOutput = price(tokenInput, tokenReserve, ethReserve);
        
        require(token.transferFrom(msg.sender, address(this), tokenInput), "SwapPool: token transfer failed");
        (bool success, ) = msg.sender.call{value: ethOutput}("");
        require(success, "SwapPool: ETH transfer failed");
        
        emit TokenToEthSwap(msg.sender, tokenInput, ethOutput);
        
        return ethOutput;
    }

    function deposit() public payable returns (uint256 tokensDeposited) {
        require(msg.value > 0, "SwapPool: zero ETH amount");
        
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));
        
        tokensDeposited = (msg.value * tokenReserve / ethReserve) + 1;
        uint256 liquidityMinted = (msg.value * totalLiquidity) / ethReserve;
        
        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;
        
        require(token.transferFrom(msg.sender, address(this), tokensDeposited), "SwapPool: token transfer failed");
        emit LiquidityProvided(msg.sender, liquidityMinted, msg.value, tokensDeposited);
        return tokensDeposited;
    }

    function withdraw(uint256 amount) public returns (uint256 ethAmount, uint256 tokenAmount) {
        require(amount > 0, "SwapPool: zero liquidity amount");
        require(liquidity[msg.sender] >= amount, "SwapPool: insufficient liquidity");
        
        uint256 ethReserve = address(this).balance;
        uint256 tokenReserve = token.balanceOf(address(this));
        
        ethAmount = (amount * ethReserve) / totalLiquidity;
        tokenAmount = (amount * tokenReserve) / totalLiquidity;
        
        liquidity[msg.sender] -= amount;
        totalLiquidity -= amount;
        
        require(token.transfer(msg.sender, tokenAmount), "SwapPool: token transfer failed");
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "SwapPool: ETH transfer failed");
        
        emit LiquidityRemoved(msg.sender, amount, tokenAmount, ethAmount);
        return (ethAmount, tokenAmount);
    }
}

// Interface to get token name if available
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
}