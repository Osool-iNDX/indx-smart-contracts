const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  try {
    // Get the contract factory
    const Cap10 = await ethers.getContractFactory("Cap10");
    
    // Get the deployed contract instance at the specified address
    // Replace this address with your deployed contract address
    const contractAddress = "0x30D95671B9CF8C7925B76C973709Cf344aaf4b19";
    const contract = await Cap10.attach(contractAddress);

    console.log("Calling buyingTest function...");
    
    // Send 0.1 BNB (reduced from 1 BNB)
    const amountToSend = ethers.parseEther("0.001");
    
    // Call buyingTest with the specified amount
    const tx = await contract.buyingTest({ value: amountToSend });
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    // Get the return value from the transaction (if needed)
    console.log("Transaction hash:", tx.hash);
    console.log("Amount sent:", ethers.formatEther(amountToSend), "BNB");
    
    console.log("\nQuerying test array values:");
    let index = 0;
    while (true) {
      try {
        const value = await contract.test(index);
        console.log(`Index ${index}: ${ethers.formatEther(value)} (${value.toString()} wei)`);
        index++;
      } catch (error) {
        if (index === 0) {
          console.log("Test array is empty");
        } else {
          console.log(`\nTotal items in test array: ${index}`);
        }
        break;
      }
    }

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
