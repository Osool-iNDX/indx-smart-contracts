// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IPancakeRouter02 {
    function WETH() external pure returns (address);
    
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
}

contract Cap10 {
    IPancakeRouter02 public immutable pancakeRouter;
    address public immutable CAKE;
    address public immutable BUSD;
    
    constructor() {
        // PancakeSwap Router v2 address on BSC Testnet
        pancakeRouter = IPancakeRouter02(0xD99D1c33F9fC3444f8101754aBC46c52416550D1);
        
        // BSC Testnet addresses
        CAKE = 0xF9f93cF501BFaDB6494589Cb4b4C15dE49E85D0e; // CAKE token
        BUSD = 0xaB1a4d4f1D656d2450692D237fdD6C7f9146e814; // BUSD token
    }
    
    function swapBNBForTokens() external payable {
        require(msg.value > 0, "Must send BNB");
        
        uint256 halfBNB = msg.value / 2;
        
        // Swap half BNB for CAKE
        address[] memory pathToCake = new address[](2);
        pathToCake[0] = pancakeRouter.WETH();
        pathToCake[1] = CAKE;
        
        pancakeRouter.swapExactETHForTokens{value: halfBNB}(
            0, // no minimum amount (since it's testnet)
            pathToCake,
            msg.sender, // send directly to caller
            block.timestamp // deadline
        );
        
        // Swap other half BNB for BUSD
        address[] memory pathToBusd = new address[](2);
        pathToBusd[0] = pancakeRouter.WETH();
        pathToBusd[1] = BUSD;
        
        pancakeRouter.swapExactETHForTokens{value: halfBNB}(
            0, // no minimum amount (since it's testnet)
            pathToBusd,
            msg.sender, // send directly to caller
            block.timestamp // deadline
        );
    }
    
    // Function to receive BNB
    receive() external payable {}
}
