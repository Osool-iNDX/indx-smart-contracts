const { ethers } = require('ethers');

// Contract Addresses
const FACTORY_ADDRESS = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
const USDC_ADDRESS = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'; // BSC USDC

// ABIs
const FACTORY_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "allPairs",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "allPairsLength",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

const PAIR_ABI = [
    {
        "inputs": [],
        "name": "token0",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "token1",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getReserves",
        "outputs": [
            {"internalType": "uint112", "name": "_reserve0", "type": "uint112"},
            {"internalType": "uint112", "name": "_reserve1", "type": "uint112"},
            {"internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const TOKEN_ABI = [
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function getTokenInfo(tokenContract) {
    try {
        const [symbol, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals()
        ]);
        return { symbol, decimals };
    } catch (error) {
        console.error('Error fetching token info:', error);
        return { symbol: 'UNKNOWN', decimals: 18 };
    }
}

function convertToNumber(bigIntValue, decimals) {
    return Number(ethers.formatUnits(bigIntValue, decimals));
}

function isUSDC(address) {
    return address.toLowerCase() === USDC_ADDRESS.toLowerCase();
}

async function getPairInfo(pairAddress, provider) {
    try {
        const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        
        // Get token addresses
        const [token0Address, token1Address] = await Promise.all([
            pairContract.token0(),
            pairContract.token1()
        ]);

        // Check if either token is USDC
        if (!isUSDC(token0Address) && !isUSDC(token1Address)) {
            return null;
        }

        // Create token contracts
        const token0Contract = new ethers.Contract(token0Address, TOKEN_ABI, provider);
        const token1Contract = new ethers.Contract(token1Address, TOKEN_ABI, provider);

        // Get token info
        const [token0Info, token1Info] = await Promise.all([
            getTokenInfo(token0Contract),
            getTokenInfo(token1Contract)
        ]);

        // Get reserves
        const reserves = await pairContract.getReserves();
        const reserve0 = reserves[0];
        const reserve1 = reserves[1];

        // Calculate liquidity in USD (using USDC as the base)
        const usdcDecimals = 18; // USDC decimals
        const usdcReserve = isUSDC(token0Address) ? reserve0 : reserve1;
        const liquidityUSD = convertToNumber(usdcReserve, usdcDecimals) * 2;

        return {
            address: pairAddress,
            token0: {
                address: token0Address,
                symbol: token0Info.symbol,
                decimals: token0Info.decimals,
                reserve: reserve0.toString()
            },
            token1: {
                address: token1Address,
                symbol: token1Info.symbol,
                decimals: token1Info.decimals,
                reserve: reserve1.toString()
            },
            liquidityUSD
        };
    } catch (error) {
        console.error(`Error fetching pair info for ${pairAddress}:`, error);
        return null;
    }
}

async function getUSDCPairs(startIndex = 0, batchSize = 100) {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org');
    const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    
    try {
        const pairsLength = await factoryContract.allPairsLength();
        const totalPairs = Number(pairsLength);
        console.log(`Total number of pairs: ${totalPairs}`);
        console.log(`Scanning from index ${startIndex} to ${startIndex + batchSize}`);
        console.log('Looking for USDC pairs...\n');

        const pairs = [];
        const endIndex = Math.min(startIndex + batchSize, totalPairs);
        
        for (let i = startIndex; i < endIndex; i++) {
            const pairAddress = await factoryContract.allPairs(i);
            const pairInfo = await getPairInfo(pairAddress, provider);
            
            if (pairInfo && pairInfo.liquidityUSD > 0) {
                pairs.push(pairInfo);
                console.log(`Found USDC pair ${pairs.length}: ${pairInfo.token0.symbol}-${pairInfo.token1.symbol}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const sortedPairs = pairs.sort((a, b) => b.liquidityUSD - a.liquidityUSD);

        console.log('\nUSDC Pairs (Sorted by Liquidity):');
        sortedPairs.forEach((pair, index) => {
            console.log(`\n${index + 1}. ${pair.token0.symbol}-${pair.token1.symbol} Pair`);
            console.log(`Address: ${pair.address}`);
            console.log(`Token0: ${pair.token0.symbol} (${pair.token0.address})`);
            console.log(`Token1: ${pair.token1.symbol} (${pair.token1.address})`);
            console.log(`Liquidity: $${pair.liquidityUSD.toLocaleString(undefined, {maximumFractionDigits: 2})}`);
            console.log(`Reserves: ${ethers.formatUnits(pair.token0.reserve, pair.token0.decimals)} ${pair.token0.symbol} / ${ethers.formatUnits(pair.token1.reserve, pair.token1.decimals)} ${pair.token1.symbol}`);
        });

        return sortedPairs;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Execute the script
// Parameters: startIndex, batchSize
getUSDCPairs(1000, 3000)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });