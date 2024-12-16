const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Donation", function () {
    let donation;
    let token;
    let owner;
    let addr1;
    let addr2;
    let donationAddress;
    let tokenAddress;

    // 定义常用数值常量
    const ONE_ETHER = ethers.parseEther("1.0");
    const HALF_ETHER = ethers.parseEther("0.5");
    const TWO_ETHER = ethers.parseEther("2.0");
    const ZERO_ETHER = ethers.parseEther("0");
    const ONE_HUNDRED_TOKENS = ethers.parseEther("100");
    const ONE_THOUSAND_TOKENS = ethers.parseEther("1000");

    beforeEach(async function () {
        // 获取签名者
        [owner, addr1, addr2] = await ethers.getSigners();

        // 部署可配置行为的ERC20代币 (MockERC20)
        const Token = await ethers.getContractFactory("MockERC20");
        token = await Token.deploy("Mock Token", "MTK", ethers.parseEther("1000000"));
        await token.waitForDeployment();

        // 部署Donation合约
        const Donation = await ethers.getContractFactory("Donation");
        donation = await Donation.deploy(owner.address);
        await donation.waitForDeployment();

        // 缓存合约地址
        donationAddress = await donation.getAddress();
        tokenAddress = await token.getAddress();

        // 给测试账户转一些代币(正常模式)
        await token.transfer(addr1.address, ONE_THOUSAND_TOKENS);
        await token.transfer(addr2.address, ONE_THOUSAND_TOKENS);

        // 确保token默认在正常模式下 (0:正常模式)
        await token.connect(owner).setMode(0);
    });

    describe("Ether操作", function () {
        it("存入ETH", async function () {
            await expect(donation.connect(addr1).depositEther({ value: ONE_ETHER }))
                .to.emit(donation, "EtherDeposited")
                .withArgs(addr1.address, ONE_ETHER);

            expect(await donation.userEtherBalances(addr1.address)).to.equal(ONE_ETHER);
            expect(await donation.getEtherBalance()).to.equal(ONE_ETHER);
        });

        it("存款为0时应失败", async function () {
            await expect(
                donation.connect(addr1).depositEther({ value: ZERO_ETHER })
            ).to.be.revertedWith("Must send ether");
        });

        it("只有owner可以提取ETH", async function () {
            await donation.connect(addr1).depositEther({ value: ONE_ETHER });

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await donation.connect(owner).withdrawEther(ONE_ETHER);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            const actualReceived = ownerBalanceAfter - ownerBalanceBefore + gasUsed;
            expect(actualReceived).to.equal(ONE_ETHER);
        });

        it("提取金额超出余额时应失败", async function () {
            await donation.connect(addr1).depositEther({ value: HALF_ETHER });

            await expect(
                donation.connect(owner).withdrawEther(ONE_ETHER)
            ).to.be.revertedWith("Insufficient balance");
        });

        it("提取金额为0应失败", async function () {
            await donation.connect(addr1).depositEther({ value: ONE_ETHER });

            await expect(
                donation.connect(owner).withdrawEther(ZERO_ETHER)
            ).to.be.revertedWith("Amount must be greater than zero");
        });
    });

    describe("Token操作", function () {
        describe("成功的存入操作", function () {
            it("存入ERC20代币", async function () {
                await token.connect(addr1).approve(donationAddress, ONE_HUNDRED_TOKENS);
                await expect(donation.connect(addr1).depositToken(tokenAddress, ONE_HUNDRED_TOKENS))
                    .to.emit(donation, "TokenDeposited")
                    .withArgs(tokenAddress, addr1.address, ONE_HUNDRED_TOKENS);

                expect(await donation.getTokenBalance(tokenAddress, addr1.address))
                    .to.equal(ONE_HUNDRED_TOKENS);
            });
        });

        describe("失败的存入操作", function () {
            it("存入金额不得超过100", async function () {
                await expect(
                    donation.connect(addr1).depositToken(tokenAddress, ethers.parseEther("101"))
                ).to.be.revertedWith("Amount must be less than or equal to 100");
            });

            it("存入金额必须大于0", async function () {
                await expect(
                    donation.connect(addr1).depositToken(tokenAddress, 0)
                ).to.be.revertedWith("Amount must be greater than 0");
            });

            it("代币地址不能为零地址", async function () {
                await expect(
                    donation.connect(addr1).depositToken(ethers.ZeroAddress, 100)
                ).to.be.revertedWith("Invalid token address");
            });

            // 测试transferFrom失败分支（mode=1）
            it("当transferFrom失败时应revert", async function () {
                await token.connect(owner).setMode(1); // 设置为失败模式
                await token.connect(addr1).approve(donationAddress, ONE_HUNDRED_TOKENS);

                await expect(
                    donation.connect(addr1).depositToken(tokenAddress, ONE_HUNDRED_TOKENS)
                ).to.be.revertedWith("Transfer failed");
            });

            // 测试数量不匹配分支（mode=2）
            it("当转账数量不匹配时应revert", async function () {
                await token.connect(owner).setMode(2); // 部分转账模式
                await token.connect(addr1).approve(donationAddress, ONE_HUNDRED_TOKENS);

                await expect(
                    donation.connect(addr1).depositToken(tokenAddress, ONE_HUNDRED_TOKENS)
                ).to.be.revertedWith("Token transfer amount mismatch");
            });
        });
    });

    describe("Receive函数", function () {
        it("通过转账接收ETH", async function () {
            await expect(addr1.sendTransaction({
                to: donationAddress,
                value: ONE_ETHER
            }))
                .to.emit(donation, "EtherDeposited")
                .withArgs(addr1.address, ONE_ETHER);

            expect(await donation.userEtherBalances(addr1.address)).to.equal(ONE_ETHER);
        });
    });

    describe("暂停和紧急操作", function () {
        it("owner可以暂停和恢复合约", async function () {
            await donation.connect(owner).pause();
            await expect(
                donation.connect(addr1).depositEther({ value: ONE_ETHER })
            ).to.be.revertedWith("Contract is paused");

            await donation.connect(owner).unpause();
            await donation.connect(addr1).depositEther({ value: ONE_ETHER });
            expect(await donation.userEtherBalances(addr1.address)).to.equal(ONE_ETHER);
        });

        it("非owner不能暂停或恢复合约", async function () {
            await expect(donation.connect(addr1).pause())
                .to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);

            await donation.connect(owner).pause();
            await expect(donation.connect(addr1).unpause())
                .to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);
        });

        it("紧急提取所有ETH", async function () {
            await donation.connect(addr1).depositEther({ value: TWO_ETHER });

            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await donation.connect(owner).emergencyWithdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

            const actualReceived = ownerBalanceAfter - ownerBalanceBefore + gasUsed;
            expect(actualReceived).to.equal(TWO_ETHER);
        });

        it("非owner无法调用紧急提取", async function () {
            await donation.connect(addr1).depositEther({ value: ONE_ETHER });

            await expect(
                donation.connect(addr1).emergencyWithdraw()
            ).to.be.revertedWithCustomError(donation, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);
        });

        it("在没有ETH时紧急提取应失败", async function () {
            await expect(
                donation.connect(owner).emergencyWithdraw()
            ).to.be.revertedWith("No Ether available");
        });

        it("在未暂停时调用unpause应失败", async function () {
            await expect(
                donation.connect(owner).unpause()
            ).to.be.revertedWith("Contract is not paused");
        });

        it("在已暂停时再次调用pause应失败", async function () {
            await donation.connect(owner).pause();
            await expect(
                donation.connect(owner).pause()
            ).to.be.revertedWith("Contract is paused");
        });

        // 新增测试: 在暂停状态下通过receive函数接收ETH应失败
        it("在暂停状态下通过receive函数接收ETH应失败", async function () {
            await donation.connect(owner).pause();
            await expect(
                addr1.sendTransaction({ to: donationAddress, value: ONE_ETHER })
            ).to.be.revertedWith("Contract is paused");
        });
    });

    // 针对MockERC20的额外测试，测试setMode无效值的分支
    describe("MockERC20额外测试", function () {
        it("设置无效模式应失败", async function () {
            await expect(
                token.connect(owner).setMode(3)
            ).to.be.revertedWith("Invalid mode");
        });
    });
});