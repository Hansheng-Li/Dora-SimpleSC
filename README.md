# 捐赠智能合约

这是一个用 Solidity 编写的智能合约，允许用户捐赠以太币 (Ether) 或 ERC20 代币。它能够记录每位捐赠者的累计捐赠金额，并提供多种查询和管理功能。

## 功能特性

1. **以太币捐赠**:

   - 任何用户都可以捐赠以太币。
   - 记录每个捐赠者的累计以太币捐赠额。

2. **ERC20 代币捐赠**:

   - 支持用户捐赠任意 ERC20 代币。
   - 记录每位用户的代币捐赠额。

3. **查询捐赠记录**:

   - 用户可以查询自己或他人的累计捐赠记录（包括以太币和代币）。

4. **合约所有者权限**:

   - 仅所有者可提取资金或在紧急情况下暂停合约。

5. **离线 ETL**:

   - 提供脚本，用于离线收集捐赠历史和事件数据。

6. **安全性**:

   - 防范重入攻击和未授权访问。
   - 对代币转账和以太币提取进行严格验证。

---

## 部署说明

### 环境准备

1. **安装依赖**:

   ```bash
   yarn
   ```

2. **编译合约**:

   ```bash
   npx hardhat compile
   ```

3. **部署合约**:
   更新 `deploy.js` 文件中的所有者地址，然后运行:

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

   部署地址: [0x0eba532B0Bf861ae8aF87B65effaf114705b9838](https://sepolia.etherscan.io/address/0x0eba532B0Bf861ae8aF87B65effaf114705b9838)

---

## 使用说明

### 捐赠以太币

运行脚本 `donate.js` 捐赠以太币:

```bash
npx hardhat run scripts/donate.js --network sepolia
```

### 查询捐赠记录

运行 `getEvent.js` 脚本获取历史捐赠数据:

```bash
npx hardhat run scripts/getEvent.js --network sepolia
```

---

## 测试说明

合约已通过 Hardhat 进行全面测试。运行测试命令:

```bash
npx hardhat test
```

测试覆盖内容包括：

- 以太币存取款操作
- ERC20 代币捐赠功能
- 合约暂停与紧急处理机制

## 测试结果

```scss
Donation
    Ether操作
      ✔ 存入ETH
      ✔ 存款为0时应失败
      ✔ 只有owner可以提取ETH
      ✔ 提取金额超出余额时应失败
      ✔ 提取金额为0应失败
    Token操作
      成功的存入操作
        ✔ 存入ERC20代币
      失败的存入操作
        ✔ 存入金额必须大于0
        ✔ 代币地址不能为零地址
        ✔ 当transferFrom失败时应revert
        ✔ 当转账数量不匹配时应revert
    Receive函数
      ✔ 通过转账接收ETH
    暂停和紧急操作
      ✔ owner可以暂停和恢复合约
      ✔ 非owner不能暂停或恢复合约
      ✔ 紧急提取所有ETH
      ✔ 非owner无法调用紧急提取
      ✔ 在没有ETH时紧急提取应失败
      ✔ 在未暂停时调用unpause应失败
      ✔ 在已暂停时再次调用pause应失败
      ✔ 在暂停状态下通过receive函数接收ETH应失败
    MockERC20额外测试
      ✔ 设置无效模式应失败

20 passing (2s)
```

## 覆盖率报告

```bash
npx hardhat coverage
```

```sql
----------------|----------|----------|----------|----------|----------------|
File            |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------|----------|----------|----------|----------|----------------|
 contracts/     |      100 |    86.54 |      100 |      100 |                |
  Donation.sol  |      100 |    84.78 |      100 |      100 |                |
  MockERC20.sol |      100 |      100 |      100 |      100 |                |
----------------|----------|----------|----------|----------|----------------|
All files       |      100 |    86.54 |      100 |      100 |                |
----------------|----------|----------|----------|----------|----------------|
```

---

## 配置说明

在 `hardhat.config.js` 中配置您的私钥和 Sepolia 网络的 RPC URL:

```javascript
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
};
```

---

## 脚本说明

1. **部署合约**:
   `scripts/deploy.js` - 用于部署智能合约。
2. **捐赠以太币**:
   `scripts/donate.js` - 用于向合约发送以太币。
3. **获取历史记录**:
   `scripts/getEvent.js` - 获取历史捐赠事件数据。
4. **测试钱包**:
   `scripts/testWallet.js` - 生成新的以太坊钱包。

---

## 安全特性

- **重入保护**:
  防止以太币提取时的重入攻击。
- **权限管理**:
  限制敏感操作（提取、暂停）仅限所有者执行。
- **输入验证**:
  确保所有用户操作的输入有效。

---

## 高级功能

- **ERC20 代币捐赠**:
  用户可捐赠已批准的代币。
- **紧急提取**:
  所有者可在紧急情况下提取全部资金。
- **合约暂停**:
  所有者可暂停或恢复合约，阻止所有用户交互。

---

### 离线 ETL 获取捐赠日志

运行以下命令获取智能合约的事件日志：

```bash
npx hardhat run scripts/getEvent.js --network sepolia
```

#### 输出示例：

```
Compiled 9 Solidity files successfully (evm target: paris).
Found 4 events
User 0xFF8E2c1b5b4f951903043adC211520e691aBe2B4 deposited 0.000001 Ether
User 0x4584ea2D7bfE668151925886982617E30Ee0e5C6 deposited 0.000001 Ether
User 0x64f0931813a2973e948315EE04185E4419f5A804 deposited 0.000001 Ether
User 0x64f0931813a2973e948315EE04185E4419f5A804 deposited 0.000001 Ether
```

#### 说明：

- 每行代表一个事件，格式为：
  ```
  User [用户地址] deposited [存款金额] Ether
  ```
- 使用网络为 `sepolia`，请确保在 `hardhat.config.js` 中正确配置。

---

### 快速入门与参考文档

- [Hardhat 快速入门](https://hardhat.cn/hardhat/readme.html)
- [Solidity 快速入门](https://leapwhale.com/article/8r581039)
- [Solidity 在线编译](https://remix.ethereum.org/)
- [智能合约 Gas 优化技巧](https://www.rpubs.com/liam/optmizeGas)
- [Level Up Solidity](https://www.levelup.xyz/)
- [智能合约官方中文文档](https://learnblockchain.cn/docs/solidity/introduction-to-smart-contracts.html)

### 综合学习与课程

- [开发者的 Web3 开源大学](https://www.wtf.academy/)：涵盖 Solidity 入门、进阶、应用、合约安全和交易分析。
- [WTF Academy](https://www.wtf.academy/)：Solidity 入门与进阶课程。
- [区块链应用开发系统课 - 60 天入门到入行](https://learnblockchain.cn/course/28)
- [知识图谱：Web3 学习路线图](https://learnblockchain.cn/maps/Roadmap)

### 视频教程

- [Web3 开发入门教程，从 0 到 1 开发你的第一个 DAPP](https://www.bilibili.com/video/BV1VxDwY8EQx/)
- [up 主：Keegan 小钢 的区块链开发视频](https://space.bilibili.com/60539794/video)

### 实践与工具

- [5 种流行的 NFT 投放方式及其优缺点](https://www.theblockbeats.info/news/31314)
- [代码规范](https://learnblockchain.cn/article/9404)
