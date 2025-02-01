const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Calling contract with the account:", deployer.address);

  const Raffle = await hre.ethers.getContractFactory("Cap10");
  const raffle = await Raffle.attach("0x5B0d728eb846cD3Db1a9DCF575A1bf6494624075");

  console.log("Setting new operator...");

  // Replace with the address you want to set as the new operator
  const newOperatorAddress = "0xfe55e85c5E02cF9002ed977163942dA346fe5dBf";
  const tx = await raffle.setOperator(newOperatorAddress);
  
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for transaction to be mined...");
  const receipt = await tx.wait();

  console.log("Transaction was mined in block", receipt.blockNumber);

  console.log("\n\nNew operator set successfully");

  const currentOperator = await raffle.operator();
  console.log("Current operator:", currentOperator);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });