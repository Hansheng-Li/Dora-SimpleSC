// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {
    const Donation = await ethers.getContractAt("Donation","0x0eba532B0Bf861ae8aF87B65effaf114705b9838");
    tx = await Donation.depositEther({value:ethers.parseEther("0.000001")});
    await tx.wait()
    console.log("donate finish");
}

// 处理错误并启动部署
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });