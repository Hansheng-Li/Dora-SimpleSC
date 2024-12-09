// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Donation is ReentrancyGuard, Ownable {
    constructor(address owner) Ownable(owner) {
        _transferOwnership(owner);
    }
    // 用户余额映射
    mapping(address => uint256) public etherBalances;

    // 代币地址 => 用户地址 => 余额
    mapping(address => mapping(address => uint256)) public tokenBalances;

    // 事件
    event EtherDeposited(address indexed user, uint256 amount);
    event EtherWithdrawn(address indexed user, uint256 amount);
    event TokenDeposited(address indexed token, address indexed user, uint256 amount);

    // 接收ETH的函数
    function depositEther() external payable nonReentrant {
        require(msg.value > 0, "Must send ether");
        etherBalances[msg.sender] += msg.value;
        emit EtherDeposited(msg.sender, msg.value);
    }

    // 合约所有者提取ETH
    function withdrawEther(uint256 amount) external onlyOwner nonReentrant {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success,) = owner().call{value: amount}("");
        require(success, "Transfer failed");
        emit EtherWithdrawn(msg.sender, amount);
    }

    // 存入ERC20代币
    function depositToken(address tokenAddress, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenAddress != address(0), "Invalid token address");

        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        tokenBalances[tokenAddress][msg.sender] += amount;
        emit TokenDeposited(tokenAddress, msg.sender, amount);
    }

    // 获取合约ETH余额
    function getEtherBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // 获取用户代币余额
    function getTokenBalance(address tokenAddress, address user) external view returns (uint256) {
        return tokenBalances[tokenAddress][user];
    }

    // 接收ETH的回退函数
    receive() external payable {
        etherBalances[msg.sender] += msg.value;
        emit EtherDeposited(msg.sender, msg.value);
    }
}
