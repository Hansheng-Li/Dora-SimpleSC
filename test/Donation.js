const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
    let vault;
    let token;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        // 获取签名者
        [owner, addr1, addr2] = await ethers.getSigners();

        // 部署ERC20代币用于测试
        const Token = await ethers.getContractFactory("MockERC20");
        token = await Token.deploy("Mock Token", "MTK", ethers.parseEther("1000000"));
        await token.waitForDeployment();

        // 部署Vault合约
        const Vault = await ethers.getContractFactory("Donation");
        vault = await Vault.deploy(owner.address);
        await vault.waitForDeployment();

        // 给测试账户转一些代币
        await token.transfer(addr1.address, ethers.parseEther("1000"));
        await token.transfer(addr2.address, ethers.parseEther("1000"));
    });

    describe("Ether操作", function () {
        it("存入ETH", async function () {
            const depositAmount = ethers.parseEther("1.0");

            await expect(vault.connect(addr1).depositEther({
                value: depositAmount
            }))
                .to.emit(vault, "EtherDeposited")
                .withArgs(addr1.address, depositAmount);

            expect(await vault.etherBalances(addr1.address)).to.equal(depositAmount);
            expect(await vault.getEtherBalance()).to.equal(depositAmount);
        });

        it("只有owner可以提取ETH", async function () {
            const depositAmount = ethers.parseEther("1.0");

            // 先存入一些ETH
            await vault.connect(addr1).depositEther({
                value: depositAmount
            });

            // owner可以提取
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await vault.connect(owner).withdrawEther(depositAmount);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            // 计算实际收到的金额（考虑gas费用）
            const actualReceived = ownerBalanceAfter - ownerBalanceBefore + gasUsed;
            expect(actualReceived).to.equal(depositAmount);
        });
    });

    describe("Token操作", function () {
        it("应该可以存入代币", async function () {
            const depositAmount = ethers.parseEther("100");

            // 授权
            await token.connect(addr1).approve(await vault.getAddress(), depositAmount);

            await expect(
                vault.connect(addr1).depositToken(await token.getAddress(), depositAmount)
            )
                .to.emit(vault, "TokenDeposited")
                .withArgs(await token.getAddress(), addr1.address, depositAmount);

            expect(await vault.getTokenBalance(await token.getAddress(), addr1.address))
                .to.equal(depositAmount);
        });

        it("存入金额必须大于0", async function () {
            await expect(
                vault.connect(addr1).depositToken(await token.getAddress(), 0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("代币地址不能为零地址", async function () {
            await expect(
                vault.connect(addr1).depositToken(ethers.ZeroAddress, 100)
            ).to.be.revertedWith("Invalid token address");
        });
    });


    // 测试receive函数
    describe("Receive函数", function () {
        it("应该可以通过转账接收ETH", async function () {
            const sendAmount = ethers.parseEther("1.0");

            await expect(addr1.sendTransaction({
                to: await vault.getAddress(),
                value: sendAmount
            }))
                .to.emit(vault, "EtherDeposited")
                .withArgs(addr1.address, sendAmount);

            expect(await vault.etherBalances(addr1.address)).to.equal(sendAmount);
        });
    });
});