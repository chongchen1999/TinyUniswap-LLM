# Uniswap Web3 UI  

## 📌 **Project Overview**  
This project is a Web3 user interface (UI) for the upgraded Uniswap smart contracts built in Homework 5. The UI enables users to interact with Uniswap liquidity pools directly from the browser. The goal is to provide a seamless experience for selecting pools, managing liquidity, and visualizing market data.  

## 🚀 **Features**  
### ✅ **Core Functionality**  
- **Pool Selection:**  
   - Browse and select available liquidity pools.  

- **Deposit, Redeem, and Swap:**  
   - Deposit tokens into a pool to provide liquidity.  
   - Redeem liquidity tokens to withdraw assets.  
   - Swap tokens within the pool at market rates.  

### 📊 **Visualizations**  
- **Reserves Curve:**  
   - A dynamic chart showing the real-time reserves of each pool.  
   - Updated automatically with every pool action.  

- **Execution Price Distribution:**  
   - A histogram or line chart displaying the distribution of execution prices for past swaps.  
   - Updated in real-time with new swap data.  

## 🛠️ **Tech Stack**  
### **Smart Contracts**  
- **Solidity:** Upgraded UniswapV2 smart contracts.  
- **Foundry:** Used for contract development and testing.  
- **Public Testnet:** Contracts deployed on a public Ethereum testnet (e.g., Goerli).  

### **Frontend**  
- **Framework:** [Scaffold-ETH](https://github.com/scaffold-eth/scaffold-eth)  
- **React:** UI components and state management.  
- **Ethers.js:** Web3 library for contract interactions.  
- **Chart.js / Recharts:** For building interactive charts.  

### **Deployment**  
- **Smart Contracts:** Deployed on a public Ethereum testnet.  
- **UI:** Hosted on [Vercel](https://vercel.com).  

## 🏗️ **Setup & Installation**  
### 1. **Clone the Repository**  
```bash
git clone https://github.com/your-username/uniswap-web3-ui.git
cd uniswap-web3-ui
```

### 2. **Install Dependencies**  
```bash
npm install
```

### 3. **Set Up Environment Variables**  
Create a `.env` file in the project root and add the following:  
```env
NEXT_PUBLIC_RPC_URL=<YOUR_TESTNET_RPC_URL>
NEXT_PUBLIC_CONTRACT_ADDRESS=<DEPLOYED_CONTRACT_ADDRESS>
NEXT_PUBLIC_WALLET_PRIVATE_KEY=<YOUR_PRIVATE_KEY>
```

### 4. **Run the Project**  
```bash
npm run dev
```

### 5. **Deploy the Smart Contracts**  
Using Foundry:  
```bash
forge script deploy.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
```

### 6. **Deploy the UI to Vercel**  
```bash
vercel --prod
```

## 🎯 **Usage**  
1. Connect your wallet using MetaMask.  
2. Select a pool from the list of available pools.  
3. Deposit liquidity, redeem assets, or swap tokens.  
4. Monitor pool performance using real-time charts.  

## ✅ **Best Practices**  
- Follow the ERC-20 standard for token compatibility.  
- Ensure slippage protection during swaps.  
- Use try-catch blocks for smart contract calls.  

## 📝 **Future Improvements**  
- Add historical data for deeper analysis.  
- Improve chart interactivity.  
- Optimize gas fees for contract interactions.  

## 🏆 **Contributors**  
- **[Your Name]** – Smart Contracts, UI Development, Charting  

---

✅ **Live Demo:** [https://uniswap-web3-ui.vercel.app](https://uniswap-web3-ui.vercel.app)  
✅ **Smart Contract Address:** `<DEPLOYED_CONTRACT_ADDRESS>`  
✅ **License:** MIT  