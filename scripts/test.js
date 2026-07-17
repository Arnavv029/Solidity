const hre = require("hardhat");

async function main() {
    const contractAddress="0x02fA79d6efdD391dF136486e79bb8fda356142dE";

    const Escrow = await hre.ethers.getContractFactory("Escrow");

    const escrow = Escrow.attach(contractAddress);

    const [client, freelancer] = await hre.ethers.getSigners();

    const tx = await escrow.createJob(
        freelancer.address,
        client.address,
        "Website",
        "Build React Website",
        {
            value: hre.ethers.parseEther("0.01"),
        }
    );

    await tx.wait();

    console.log("Job Created!");
}

main().catch(console.error);