import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.23',
  },
  networks: {
    // for mainnet
    'base-mainnet': {
      url: 'https://mainnet.base.org',
      accounts: [process.env.WALLET2_KEY as string],
      gasPrice: 1000000000,
    },
    // for testnet
    'sepolia-base': {
      url: 'https://sepolia.base.org',
      accounts: [process.env.WALLET1_KEY as string],
      gasPrice: 1000000000,
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      gasPrice: 10000000000,
      accounts: [`9bc510273724b51afce1d5f01a3f3084dc74a7d2cb430f6b3a751efa885ba07b`],
      timeout: 12000
    },

  },
  //sepolia-base API key : 	8J74KN1H6P8BI7EFH6WUPRDN7S42NR65TY

  //bsc testnet    API key :     SZFSYH67GS98XWZPITZP7RBG5CV1375GPU
  
  etherscan: {
    apiKey: "SZFSYH67GS98XWZPITZP7RBG5CV1375GPU"
  },
  defaultNetwork: 'hardhat',
  paths: {
    sources: "./contracts",        // Directory for contract files
    tests: "./test",              // Directory for test files
    cache: "./cache",             // Cache directory
    artifacts: "./artifacts",     // Artifacts directory
  },
};

export default config;