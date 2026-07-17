const hre = require("hardhat");

async function main() {
    const contractAddress = "0x02fA79d6efdD391dF136486e79bb8fda356142dE";

    const Escrow = await hre.ethers.getContractFactory("Escrow");

    const escrow = Escrow.attach(contractAddress);

    const freelancer = "0x33fcD2985EC89cd2afd72872D56186268C671205";
    const mediator = "0x4a260769Ca064623F700a5Cb60DC0b9913C15fC5";


    const tx = await escrow.createJob(
        freelancer,
        mediator,
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