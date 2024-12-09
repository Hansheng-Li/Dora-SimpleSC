const { Wallet } = require("ethers");

// 生成一个新的随机钱包
const wallet = Wallet.createRandom();
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
