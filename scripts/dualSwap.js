require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
    
    const contractAddress = "0x267aD6563bFfF12B59c05B18C74230B04e3e6EAC"; 
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    
    const wallet = new ethers.Wallet(process.env.WALLET2_KEY, provider);
    
    
    const contractABI = [
        "function buyIndex(uint256 amount) external",
        "function getTokenAddresses() external view returns (address usdc, address wnb, address wbtc, address router)",
        "event SwapExecuted(address indexed user, uint256 amountIn, uint256 amountOutBNB, uint256 amountOutBTC)"
    ];

    
    const tokenABI = [
        "function decimals() view returns (uint8)",
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)"
    ];

    // Initialize contracts
    const indexContract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    // Get token addresses from contract
    const {
        usdc: usdcAddress,
        wnb: wbnbAddress,
        wbtc: wbtcAddress
    } = await indexContract.getTokenAddresses();
    
    // Initialize token contracts
    const usdcContract = new ethers.Contract(usdcAddress, tokenABI, wallet);
    const wbnbContract = new ethers.Contract(wbnbAddress, tokenABI, wallet);
    const wbtcContract = new ethers.Contract(wbtcAddress, tokenABI, wallet);

    try {
        // Get network and gas price
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.name);
        const gasPrice = await provider.getFeeData();
        console.log("Current gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");

        // Get decimals for all tokens
        const usdcDecimals = await usdcContract.decimals();
        const wbnbDecimals = await wbnbContract.decimals();
        const wbtcDecimals = await wbtcContract.decimals();

        // Check initial balances
        const initialBalances = await checkBalances(wallet.address, {
            usdcContract,
            wbnbContract,
            wbtcContract,
            usdcDecimals,
            wbnbDecimals,
            wbtcDecimals
        });
        
        // Amount to swap (e.g., 10 USDC)
        const swapAmount = ethers.parseUnits("1", usdcDecimals);
        console.log("\nAmount to swap:", ethers.formatUnits(swapAmount, usdcDecimals), "USDC");

        // Check if we have enough balance
        if (initialBalances.usdc < swapAmount) {
            throw new Error("Insufficient USDC balance");
        }

        // Approve USDC
        console.log("\nApproving USDC...");
        const approveTx = await usdcContract.approve(contractAddress, swapAmount, {
            gasLimit: 100000,
            gasPrice: gasPrice.gasPrice
        });
        console.log("Approval transaction sent:", approveTx.hash);
        
        // Wait for approval confirmation
        const approvalReceipt = await approveTx.wait(3);
        console.log("USDC approved, confirmation blocks:", approvalReceipt.confirmations);

        // Execute swap
        console.log("\nExecuting index swap...");
        const swapTx = await indexContract.buyIndex(swapAmount, {
            gasLimit: 1000000, // Higher gas limit for multiple swaps
            gasPrice: gasPrice.gasPrice
        });
        console.log("Swap transaction sent:", swapTx.hash);
        
        // Wait for swap confirmation
        const swapReceipt = await swapTx.wait(3);
        console.log("Swap completed with", swapReceipt.confirmations, "confirmations");

        // Find and parse the SwapExecuted event
        const swapEvent = swapReceipt.logs
            .filter(log => indexContract.interface.parseLog(log)?.name === "SwapExecuted")
            .map(log => indexContract.interface.parseLog(log))[0];

        if (swapEvent) {
            console.log("\nSwap Results:");
            console.log("Amount In:", ethers.formatUnits(swapEvent.args.amountIn, usdcDecimals), "USDC");
            console.log("BNB Received:", ethers.formatUnits(swapEvent.args.amountOutBNB, wbnbDecimals), "wBNB");
            console.log("BTC Received:", ethers.formatUnits(swapEvent.args.amountOutBTC, wbtcDecimals), "wBTC");
        }

        // Check final balances
        console.log("\nChecking final balances...");
        await checkBalances(wallet.address, {
            usdcContract,
            wbnbContract,
            wbtcContract,
            usdcDecimals,
            wbnbDecimals,
            wbtcDecimals
        });

    } catch (error) {
        console.error("\nError occurred:");
        if (error.reason) {
            console.error("Reason:", error.reason);
        } else {
            console.error(error);
        }
        throw error;
    }
}

async function checkBalances(address, contracts) {
    const {
        usdcContract,
        wbnbContract,
        wbtcContract,
        usdcDecimals,
        wbnbDecimals,
        wbtcDecimals
    } = contracts;

    const usdcBalance = await usdcContract.balanceOf(address);
    const wbnbBalance = await wbnbContract.balanceOf(address);
    const wbtcBalance = await wbtcContract.balanceOf(address);

    console.log("\nCurrent balances:");
    console.log("USDC:", ethers.formatUnits(usdcBalance, usdcDecimals));
    console.log("wBNB:", ethers.formatUnits(wbnbBalance, wbnbDecimals));
    console.log("wBTC:", ethers.formatUnits(wbtcBalance, wbtcDecimals));

    return {
        usdc: usdcBalance,
        wbnb: wbnbBalance,
        wbtc: wbtcBalance
    };
}

// Execute the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });