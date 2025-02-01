const { ethers } = require('ethers');

// Contract Addresses
const FACTORY_ADDRESS = '0x6725F303b657a9451d8BA641348b6761A6CC7a17';
const WBNB_ADDRESS = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';

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

async function getBNBPrice() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
        const data = await response.json();
        return parseFloat(data.price);
    } catch (error) {
        console.error('Error fetching BNB price:', error);
        return 0;
    }
}

function convertToNumber(bigIntValue, decimals) {
    return Number(ethers.formatUnits(bigIntValue, decimals));
}

async function getPairInfo(pairAddress, provider, bnbPrice) {
    try {
        const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        
        // Get token addresses
        const [token0Address, token1Address] = await Promise.all([
            pairContract.token0(),
            pairContract.token1()
        ]);

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

        // Calculate liquidity (simplified - assumes one token is WBNB)
        let liquidityUSD = 0;
        if (token0Address.toLowerCase() === WBNB_ADDRESS.toLowerCase()) {
            const bnbAmount = convertToNumber(reserve0, token0Info.decimals);
            liquidityUSD = bnbAmount * bnbPrice * 2;
        } else if (token1Address.toLowerCase() === WBNB_ADDRESS.toLowerCase()) {
            const bnbAmount = convertToNumber(reserve1, token1Info.decimals);
            liquidityUSD = bnbAmount * bnbPrice * 2;
        }

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

async function getTopLiquidityPairs(numberOfPairs = 10) {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org');
    const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    
    try {
        // Get BNB price
        const bnbPrice = await getBNBPrice();
        console.log(`Current BNB Price: $${bnbPrice}`);

        // Get pair addresses
        const pairsLength = await factoryContract.allPairsLength();
        console.log(`Total number of pairs: ${pairsLength}`);

        // Fetch first batch of pairs
        const pairs = [];
        for (let i = 0; i < numberOfPairs; i++) {
            const pairAddress = await factoryContract.allPairs(i);
            const pairInfo = await getPairInfo(pairAddress, provider, bnbPrice);
            if (pairInfo && pairInfo.liquidityUSD > 0) {
                pairs.push(pairInfo);
            }
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Sort pairs by liquidity
        const sortedPairs = pairs.sort((a, b) => b.liquidityUSD - a.liquidityUSD);

        // Print results
        console.log('\nTop Liquidity Pairs:');
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
getTopLiquidityPairs(10)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });