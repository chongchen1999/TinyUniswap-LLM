# Homework 7: Add NL Interactivity to your Uniswap UI Submission Report

## Overview
This project implements a web3 UI for Uniswap smart contracts, allowing users to interact with liquidity pools through a user-friendly interface. The application provides functionality for pool selection, token operations (deposit, redeem, swap), and real-time visualization of pool metrics.

## Local Development Setup
To run the dapp locally, follow these steps:

```bash
# Start local blockchain
yarn chain

# Deploy contracts
yarn deploy --reset

# Start frontend application
yarn start
```

The application will be available at `http://localhost:3000`

## Contract Deployment
All smart contracts have been deployed and verified on the Sepolia testnet:

- TokenA: `0xB667f5e8171468F12F47eF7E03C76F5594F33248`
- TokenB: `0xC215279133800AFca77eF50C6651db656831138e`
- TokenATokenBPool: `0x117F180f4bB2235c075b4a3FB5Dc5ff72d74A739`

Verification was completed using:
```bash
yarn verify --network sepolia
```

## Features
- Pool selection interface
- Token operations (deposit, redeem, swap)
- Real-time visualization of:
  - Reserves curve
  - Historical swap execution prices
- Integration with Sepolia testnet
- Verified smart contracts

## Public Deployment
The application is publicly accessible through Vercel at:
[https://tiny-uniswap-9ohnriq03-chong-chens-projects.vercel.app/](https://tiny-uniswap-9ohnriq03-chong-chens-projects.vercel.app/)

## Source Code
All source code is available on GitHub:
[https://github.com/chongchen1999/TinyUniswap.git](https://github.com/chongchen1999/TinyUniswap.git)

## Video Demo
A video demo of the application's functionality is available on YouTube:
[https://youtu.be/6EZNUZK5jOg](https://youtu.be/6EZNUZK5jOg)