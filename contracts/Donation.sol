// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Donation Contract
 * @notice 一个支持捐赠（存入ETH和ERC20代币）、提取的合约，并且可以暂停/恢复。
 */
contract Donation is ReentrancyGuard, Ownable {
    // 用户ETH余额映射：{用户地址 => ETH余额}
    mapping(address => uint256) public userEtherBalances;

    // 用户代币余额映射：{代币地址 => {用户地址 => 代币余额}}
    mapping(address => mapping(address => uint256)) public userTokenBalances;

    // 合约是否处于暂停状态
    bool private isPaused;

    // 事件：用户存入ETH
    event EtherDeposited(address indexed user, uint256 amount);

    // 事件：提取ETH
    event EtherWithdrawn(address indexed user, uint256 amount);

    // 事件：用户存入代币
    event TokenDeposited(address indexed token, address indexed user, uint256 amount);

    /**
     * @dev 构造函数，设置合约所有者。
     * @param owner 合约初始化的所有者地址
     */
    constructor(address owner) Ownable(owner) {
        _transferOwnership(owner);
    }

    /**
     * @notice 修饰器：当合约未暂停时才能执行。
     * @dev 若 isPaused == true 则抛出 "Contract is paused"。
     */
    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    /**
     * @notice 修饰器：当合约已暂停时才能执行。
     * @dev 若 isPaused == false 则抛出 "Contract is not paused"。
     */
    modifier whenPaused() {
        require(isPaused, "Contract is not paused");
        _;
    }

    /**
     * @notice 用户可存入ETH到合约。
     * @dev 使用nonReentrant可防止重入攻击。
     */
    function depositEther() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ether");
        userEtherBalances[msg.sender] += msg.value;
        emit EtherDeposited(msg.sender, msg.value);
    }

    /**
     * @notice 合约所有者提取指定数量的ETH。
     * @param amount 要提取的ETH数量（wei）
     * @dev 使用nonReentrant防重入，whenNotPaused防止在暂停中执行。
     */
    function withdrawEther(uint256 amount) external onlyOwner nonReentrant whenNotPaused {
        require(address(this).balance >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be greater than zero");

        payable(owner()).transfer(amount);
        emit EtherWithdrawn(msg.sender, amount);
    }

    /**
     * @notice 用户存入指定数量的ERC20代币到合约。
     * @param tokenAddress ERC20代币合约地址
     * @param amount 要存入的代币数量
     */
    function depositToken(address tokenAddress, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenAddress != address(0), "Invalid token address");

        IERC20 token = IERC20(tokenAddress);

        uint256 balanceBefore = token.balanceOf(address(this));
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        uint256 balanceAfter = token.balanceOf(address(this));

        // 确保实际转入数量正确
        require(balanceAfter == balanceBefore + amount, "Token transfer amount mismatch");
        userTokenBalances[tokenAddress][msg.sender] += amount;
        emit TokenDeposited(tokenAddress, msg.sender, amount);
    }

    /**
     * @notice 获取合约当前持有的ETH总余额（全部用户的ETH聚合）。
     */
    function getEtherBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice 获取指定用户的特定ERC20代币余额。
     * @param tokenAddress ERC20代币地址
     * @param user 用户地址
     * @return 用户在合约中的代币余额
     */
    function getTokenBalance(address tokenAddress, address user) external view returns (uint256) {
        return userTokenBalances[tokenAddress][user];
    }

    /**
     * @notice 回退函数，用于接收ETH。
     * @dev 当not paused时才可接收ETH。
     */
    receive() external payable whenNotPaused {
        userEtherBalances[msg.sender] += msg.value;
        emit EtherDeposited(msg.sender, msg.value);
    }

    /**
     * @notice 暂停合约（仅所有者）。
     * @dev 当合约未暂停时才可执行。
     */
    function pause() external onlyOwner whenNotPaused {
        isPaused = true;
    }

    /**
     * @notice 恢复合约（仅所有者）。
     * @dev 当合约已暂停时才可执行。
     */
    function unpause() external onlyOwner whenPaused {
        isPaused = false;
    }

    /**
     * @notice 紧急提取合约中所有ETH，仅限所有者。
     * @dev 在紧急情况下用来提取全部ETH。
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No Ether available");

        payable(owner()).transfer(contractBalance);
        emit EtherWithdrawn(owner(), contractBalance);
    }
}
