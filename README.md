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

## 离线 ETL

若需离线提取捐赠数据用于分析：

1. 运行 `getEvent.js` 脚本获取链上事件。
2. 使用您喜欢的 ETL 工具解析输出数据。

---

## 参考资料

- [Ethers.js 文档](https://docs.ethers.io/v5/)
- [Hardhat 文档](https://hardhat.org/docs)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
