const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  try {
    // Get the contract factory
    const Cap10 = await ethers.getContractFactory("Cap10");
    
    // Get the deployed contract instance
    const contractAddress = "0x93a638fd40f77430F64fd747025977665d5BEC39";
    const contract = await Cap10.attach(contractAddress);

    console.log("Checking contract state before transaction:");
    
    // Get WBNB address
    const wbnbAddress = await contract.wBNB();
    console.log("WBNB address:", wbnbAddress);
    
    // Get router address
    const routerAddress = await contract.pancakeRouter();
    console.log("PancakeSwap Router address:", routerAddress);
    
    // Get signer's balance
    const [signer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("Signer address:", signer.address);
    console.log("Signer BNB balance:", ethers.formatEther(balance));

    console.log("\nCalling buyIndex function...");
    const amountToSend = ethers.parseEther("0.001");
    console.log("Amount to send:", ethers.formatEther(amountToSend), "BNB");
    
    // Estimate gas first
    try {
      const gasEstimate = await contract.buyIndex.estimateGas({ value: amountToSend });
      console.log("Estimated gas:", gasEstimate.toString());
    } catch (error) {
      console.log("Gas estimation failed. Error:", error.message);
      if (error.data) {
        console.log("Error data:", error.data);
      }
    }

    // Call buyIndex with the specified amount
    console.log("\nSending transaction...");
    const tx = await contract.buyIndex({ 
      value: amountToSend,
      gasLimit: 1000000 // Set higher gas limit since estimation failed
    });
    
    console.log("Transaction submitted!");
    console.log("Transaction hash:", tx.hash);
    
    console.log("\nWaiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Parse and display events
    const events = receipt.logs.map(log => {
      try {
        return contract.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    if (events.length > 0) {
      console.log("\nEvents emitted:");
      events.forEach(event => {
        console.log(`\n${event.name}:`);
        Object.keys(event.args).forEach(key => {
          if (isNaN(key)) {
            const value = event.args[key];
            if (typeof value === 'bigint') {
              console.log(`  ${key}: ${ethers.formatEther(value)} BNB`);
            } else if (Array.isArray(value)) {
              console.log(`  ${key}: [${value.join(', ')}]`);
            } else {
              console.log(`  ${key}: ${value.toString()}`);
            }
          }
        });
      });
    }

    // Query test array
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
    console.error("\nTransaction failed!");
    console.error("Error message:", error.message);
    
    if (error.data) {
      console.error("Error data:", error.data);
    }
    
    if (error.transaction) {
      console.error("\nTransaction details:");
      console.error("To:", error.transaction.to);
      console.error("From:", error.transaction.from);
      console.error("Data:", error.transaction.data);
      console.error("Value:", error.transaction.value?.toString());
    }
    
    if (error.receipt) {
      console.error("\nTransaction receipt:");
      console.error("Status:", error.receipt.status);
      console.error("Gas used:", error.receipt.gasUsed.toString());
      if (error.receipt.logs && error.receipt.logs.length > 0) {
        console.error("Event logs:", error.receipt.logs);
      }
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
