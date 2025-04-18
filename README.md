# TinyUniswap with Natural Language Integration

A Uniswap interface enhanced with natural language processing capabilities, allowing users to interact with Uniswap contracts through conversational commands.

## Features

- **Natural Language Interaction**: Execute Uniswap operations using conversational commands
- **Multiple LLM Support**: Compare performance between OpenAI and open-source models
- **Full Uniswap Functionality**: Liquidity provision, token swaps, and pool analysis
- **Interactive Testing**: Built-in test cases with performance metrics
- **MetaMask Integration**: Seamless transaction signing and submission

## Contract Deployment

All smart contracts have been deployed and verified on the Sepolia testnet:

- TokenA: `0xB667f5e8171468F12F47eF7E03C76F5594F33248`
- TokenB: `0xC215279133800AFca77eF50C6651db656831138e`
- TokenATokenBPool: `0x117F180f4bB2235c075b4a3FB5Dc5ff72d74A739`

## Live Demo

Access the application at: [https://tinyuniswap-llm.vercel.app/](https://tinyuniswap-llm.vercel.app/)

## Video Link

Homework 6: Uniswap Web3 UI: https://youtu.be/6EZNUZK5jOg
Homework 7: Add NL Interactivity to your Uniswap UI: https://www.youtube.com/watch?v=AYupXadXCyc

## Development Setup

### Prerequisites

- Node.js (v16+)
- Yarn package manager
- MetaMask browser extension
- Access to Ethereum testnet (Sepolia)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/chongchen1999/TinyUniswap-LLM.git
   cd TinyUniswap-LLM
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key
   REACT_APP_ALCHEMY_API_KEY=your_alchemy_api_key
   ```

### Running Locally

#### Option 1: Using Local Blockchain

1. Start local blockchain:
   ```bash
   yarn chain
   ```

2. Deploy contracts:
   ```bash
   yarn deploy --reset
   ```

3. Start frontend application:
   ```bash
   yarn start
   ```

#### Option 2: Using Sepolia Testnet

1. Configure MetaMask to connect to Sepolia testnet

2. Start the frontend application:
   ```bash
   yarn start
   ```

## Using the Application

1. Connect your MetaMask wallet (ensure you have Sepolia ETH)
2. Get test tokens from the faucet section
3. Use the natural language interface to interact with the Uniswap contracts
   - Example commands:
     - "Swap 10 TokenA for TokenB"
     - "Add liquidity with 5 TokenA and 5 TokenB"
     - "Show me the current pool stats"
     - "What's the price impact of swapping 100 TokenA?"

## Testing Framework

The application includes a built-in testing framework:
1. Navigate to the Testing tab
2. Choose from standard or challenging test cases
3. Run tests to compare performance between different LLM models
4. Add your own custom test cases through the UI

## Acknowledgments

- Uniswap for the original DEX implementation
- OpenAI for providing API access
- The Ethereum community for continuous support and innovation