// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPancakeRouter02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract Cap10 is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    address public owner;
    address public operator;
    IERC20 public USDC;
    IERC20 public wBNB;
    IPancakeRouter02 public constant pancakeRouter = IPancakeRouter02(0xD99D1c33F9fC3444f8101754aBC46c52416550D1); // BSC Testnet Router

    event OperatorSet(address indexed oldOperator, address indexed newOperator);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // BSC Testnet addresses
        USDC = IERC20(0x64544969ed7EBf5f083679233325356EbE738930); // USDC on BSC testnet
        wBNB = IERC20(0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd); // wBNB on BSC testnet
    }

    function buyIndex(uint256 amount) public nonReentrant {
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        
        
        USDC.approve(address(pancakeRouter), amount);

        
        address[] memory path = new address[](2);
        path[0] = address(USDC);
        path[1] = address(wBNB);

        
        pancakeRouter.swapExactTokensForTokens(
            amount,
            0, // Be careful with this in production!
            path,
            msg.sender,
            block.timestamp + 15 minutes
        );
    }

    function withdrawStuckTokens(IERC20 token, uint256 _value)
        external
        onlyOwner
        nonReentrant
    {
        token.safeTransfer(owner, _value);
    }

    function withdrawStuckEth(uint256 _value) external onlyOwner nonReentrant {
        payable(msg.sender).transfer(_value);
    }

    modifier onlyOwnerOrOperator() {
        require(owner == msg.sender || operator == msg.sender, "Caller is not the owner or operator");
        _;
    }

    function setOperator(address _operator) external onlyOwner {
        address oldOperator = operator;
        operator = _operator;
        emit OperatorSet(oldOperator, _operator);
    }

    receive() external payable {}
}