// scripts/deploy.js

async function main() {

    const Cap = await ethers.getContractFactory("Cap10");
  
    const cap = await Cap.deploy();
  
    await cap.waitForDeployment();
  
    console.log("Contract deployed to:",await  cap.getAddress());
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  