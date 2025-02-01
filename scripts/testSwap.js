const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    try {
        const [signer] = await ethers.getSigners();
        
        // Contract addresses
        const CAP10_ADDRESS = "0x7770D9B0a8a690b1e0687A4fE2Be8937A4620F17";
        const CAKE_ADDRESS = "0xF9f93cF501BFaDB6494589Cb4b4C15dE49E85D0e";
        const BUSD_ADDRESS = "0xaB1a4d4f1D656d2450692D237fdD6C7f9146e814";

        // Get contract instance
        const Cap10 = await ethers.getContractFactory("Cap10");
        const cap10 = await Cap10.attach(CAP10_ADDRESS);

        // Get token contracts for balance checking
        const CAKE = await ethers.getContractAt("IERC20", CAKE_ADDRESS);
        const BUSD = await ethers.getContractAt("IERC20", BUSD_ADDRESS);

        // Get initial balances
        const initialCAKEBalance = await CAKE.balanceOf(signer.address);
        const initialBUSDBalance = await BUSD.balanceOf(signer.address);

        console.log("Initial CAKE balance:", ethers.formatEther(initialCAKEBalance));
        console.log("Initial BUSD balance:", ethers.formatEther(initialBUSDBalance));

        // Amount of BNB to swap (0.01 BNB)
        const swapAmount = ethers.parseEther("0.01");

        console.log("\nSwapping", ethers.formatEther(swapAmount), "BNB...");

        // Perform the swap
        console.log("Sending transaction...");
        const tx = await cap10.swapBNBForTokens({ 
            value: swapAmount,
            gasLimit: 1000000 // Set higher gas limit
        });
        
        console.log("Transaction submitted!");
        console.log("Waiting for confirmation...");
        await tx.wait();
        console.log("Transaction confirmed!");

        // Get final balances
        const finalCAKEBalance = await CAKE.balanceOf(signer.address);
        const finalBUSDBalance = await BUSD.balanceOf(signer.address);

        console.log("\nFinal CAKE balance:", ethers.formatEther(finalCAKEBalance));
        console.log("Final BUSD balance:", ethers.formatEther(finalBUSDBalance));

        // Calculate differences
        const CAKEReceived = Number(ethers.formatEther(finalCAKEBalance)) - Number(ethers.formatEther(initialCAKEBalance));
        const BUSDReceived = Number(ethers.formatEther(finalBUSDBalance)) - Number(ethers.formatEther(initialBUSDBalance));

        console.log("\nCAKE received:", CAKEReceived.toFixed(18));
        console.log("BUSD received:", BUSDReceived.toFixed(18));
    } catch (error) {
        console.error("Error occurred:", error);
        if (error.data) {
            console.log("Error data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
