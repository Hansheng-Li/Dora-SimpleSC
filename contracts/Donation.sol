// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Donation is ReentrancyGuard, Ownable {
    // {用户地址 => 余额}
    mapping(address => uint256) public etherBalances;

    // {代币地址 : {用户地址 => 余额}}
    mapping(address => mapping(address => uint256)) public tokenBalances;

    // 是否暂停
    bool private _paused;

    // 事件：用户存入ETH
    event EtherDeposited(address indexed user, uint256 amount);
    
    // 事件：用户提取ETH
    event EtherWithdrawn(address indexed user, uint256 amount);

    // 事件：用户存入代币
    event TokenDeposited(address indexed token, address indexed user, uint256 amount);

    // 构造函数
    constructor(address owner) Ownable(owner) {
        _transferOwnership(owner);
    }

    // Modifiers
    // 当合约未暂停时才能执行所修饰的函数。
    // 如果 _paused 为 true，则会触发 "Contract is paused" 错误。
    modifier whenNotPaused() {
        require(!_paused, "Contract is paused");
        _;
    }

    // 当合约已暂停时才能执行所修饰的函数。
    // 如果 _paused 为 false，则会触发 "Contract is not paused" 错误。
    modifier whenPaused() {
        require(_paused, "Contract is not paused");
        _;
    }

    // 接收ETH的函数
    function depositEther() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ether");
        etherBalances[msg.sender] += msg.value;
        emit EtherDeposited(msg.sender, msg.value);
    }

    // 合约所有者提取ETH
    function withdrawEther(uint256 amount) external onlyOwner nonReentrant whenNotPaused {
        require(address(this).balance >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be greater than zero");

        // 使用transfer减少安全风险
        payable(owner()).transfer(amount);
        emit EtherWithdrawn(msg.sender, amount);
    }

    // 存入ERC20代币
    function depositToken(address tokenAddress, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenAddress != address(0), "Invalid token address");

        IERC20 token = IERC20(tokenAddress);

        // 确保代币的实际余额变化与转账金额一致
        uint256 balanceBefore = token.balanceOf(address(this));
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        uint256 balanceAfter = token.balanceOf(address(this));

        require(balanceAfter == balanceBefore + amount, "Token transfer amount mismatch");
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
    receive() external payable whenNotPaused {
        etherBalances[msg.sender] += msg.value;
        emit EtherDeposited(msg.sender, msg.value);
    }

    // 暂停合约
    function pause() external onlyOwner whenNotPaused {
        _paused = true;
    }

    // 恢复合约
    function unpause() external onlyOwner whenPaused {
        _paused = false;
    }

    // 紧急提取ETH（仅限所有者）
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No Ether available");

        payable(owner()).transfer(contractBalance);
        emit EtherWithdrawn(owner(), contractBalance);
    }
}
