const hre = require("hardhat");

console.log("Script started...");

async function main() {
    console.log("Inside main()");

    const Escrow = await hre.ethers.getContractFactory("Escrow");

    console.log("Factory created");

    const escrow = await Escrow.deploy();

    console.log("Deploy transaction sent");

    await escrow.waitForDeployment();

    console.log("Deployment completed");

    console.log(await escrow.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});