// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {
    const owneraddress = "0xFF8E2c1b5b4f951903043adC211520e691aBe2B4"
    const Donation = await ethers.getContractFactory("Donation");

    const contract = await Donation.deploy(owneraddress);
    // 部署代理合约
    console.log("合约部署成功，部署地址为：", contract.target);
}

// 处理错误并启动部署
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });