// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    // 0: 正常模式
    // 1: transferFrom失败模式（总是返回 false）
    // 2: 部分转账模式（只转一半数量）
    uint8 private mode;

    constructor(string memory name, string memory symbol, uint256 initialSupply)
        ERC20(name, symbol)
    {
        _mint(msg.sender, initialSupply);
        mode = 0; // 默认正常模式
    }

    // 设置模式函数
    function setMode(uint8 _mode) external {
        require(_mode <= 2, "Invalid mode");
        mode = _mode;
    }

    // 根据mode执行不同逻辑
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        if (mode == 0) {
            // 正常模式，使用父类逻辑
            return super.transferFrom(sender, recipient, amount);
        } else if (mode == 1) {
            // 失败模式，直接返回false，不转账
            return false;
        } else {
            // 部分转账模式，只转入一半
            uint256 half = amount / 2;
            // 使用父类的_transfer来转账
            _spendAllowance(sender, msg.sender, amount);
            _transfer(sender, recipient, half);
            // 这里仍然返回true表示函数完成，但数量不匹配（测试合约会检测这一点）
            return true;
        }
    }
}
