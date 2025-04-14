# Homework 7: Add NL Interactivity to your Uniswap UI

## Project Overview
This project extends the Uniswap UI from Homework 6 with natural language interactivity, allowing users to interact with Uniswap contracts through conversational commands. The application interprets natural language instructions to perform operations like depositing liquidity, redeeming tokens, and executing swaps, as well as answering queries about pool data.

## Key Features

### Natural Language Processing
- Conversion of natural language instructions to structured function calls
- Support for all core Uniswap operations through conversational commands
- Data analysis capabilities for Uniswap pool metrics and events

### LLM Integration
- Dual integration with OpenAI's models and open-source LLMs 
- Side-by-side comparison of performance between models
- Custom API endpoint configuration for using your own LLM

### Transaction Flow
1. NL instruction parsing to structured representation
2. Conversion to Ethereum transaction parameters
3. Transaction signing with MetaMask integration
4. Submission to Ethereum network via JSON-RPC

### Evaluation Framework
- 10 standard test cases with varying complexity
- 10 challenging test cases to demonstrate system limitations
- Interactive test case execution with result comparison
- Capability to add custom test cases through the UI

## Contract Deployment
All smart contracts have been deployed and verified on the Sepolia testnet:
- TokenA: `0xB667f5e8171468F12F47eF7E03C76F5594F33248`
- TokenB: `0xC215279133800AFca77eF50C6651db656831138e`
- TokenATokenBPool: `0x117F180f4bB2235c075b4a3FB5Dc5ff72d74A739`

## Development Setup
To run the application locally:

```bash
# Start local blockchain
yarn chain

# Deploy contracts
yarn deploy --reset

# Start frontend application
yarn start
```

## Open Source LLM Integration
The application allows users to select or configure their preferred LLM:

- Default OpenAI integration
- Support for locally hosted open-source models
- Custom endpoint configuration via UI settings
- Performance comparison metrics across different models

## Public Deployment
The application is publicly accessible at:
[https://tinyuniswap-llm.vercel.app/](https://tinyuniswap-llm.vercel.app/)

## Source Code
All source code is available on GitHub:
[https://github.com/chongchen1999/TinyUniswap-LLM.git](https://github.com/chongchen1999/TinyUniswap-LLM.git)

## Future Improvements
- Enhanced error handling for complex or ambiguous natural language instructions
- Support for more advanced pool analysis queries
- Integration with additional open-source LLMs
- Improved performance optimization for on-chain data analysis