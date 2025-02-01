# BSC Token Swap Smart Contract

This project implements a smart contract on the Binance Smart Chain (BSC) that enables multi-token swaps using PancakeSwap V2 Router. The contract allows users to split their BNB and swap it for multiple tokens in a single transaction.

## Contract Features

- **Multi-Token Swap**: Splits BNB amount into two equal parts and swaps them for different tokens
- **PancakeSwap Integration**: Uses PancakeSwap V2 Router for efficient token swaps
- **Direct Transfer**: Swapped tokens are directly transferred to the caller's address
- **Gas Optimized**: Includes appropriate gas limits for BSC network

## Deployed Contracts

- **Main Contract (Cap10)**: `0x7770D9B0a8a690b1e0687A4fE2Be8937A4620F17`
- **Network**: BSC Testnet
- **Token Pairs**: 
  - BNB -> CAKE (`0xF9f93cF501BFaDB6494589Cb4b4C15dE49E85D0e`)
  - BNB -> BUSD (`0xaB1a4d4f1D656d2450692D237fdD6C7f9146e814`)

## Usage

### Prerequisites

```bash
npm install
```

### Testing the Contract

Run the test script to perform a swap:

```bash
npx hardhat run scripts/testSwap.js --network testnet
```

The script will:
1. Check initial token balances
2. Perform the swap with 0.01 BNB
3. Display final balances and tokens received

### Contract Functions

#### `swapBNBForTokens()`
- Payable function that accepts BNB
- Splits the BNB amount equally
- Swaps for CAKE and BUSD tokens
- Transfers tokens directly to the caller

## Development

### Local Setup

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy contract
npx hardhat run scripts/deploy.js --network testnet
```

### Contract Architecture

The contract uses:
- PancakeSwap V2 Router for swaps
- WBNB as the intermediate token
- Standard ERC20 interface for token operations

## Security Notes

- Contract is for testnet demonstration
- No slippage protection implemented
- Use appropriate slippage and deadline checks for mainnet deployment

## Scripts

- `deploy.js`: Deploys the contract
- `testSwap.js`: Tests the swap functionality
- `buyIndexWithFactory.js`: Additional testing utilities

## License

MIT
