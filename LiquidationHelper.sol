// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";

// MultiCall 结构体定义
struct MultiCall {
    address target;
    bytes callData;
}

// CreditFacadeV3 接口
interface ICreditFacadeV3 {
    function liquidateCreditAccount(
        address creditAccount,
        address to,
        MultiCall[] calldata calls
    ) external;
}

// CreditManagerV3 接口（用于获取 adapter 映射）
interface ICreditManagerV3 {
    function adapterToContract(address adapter) external view returns (address);
}

/**
 * @title LiquidationHelper
 * @notice 用于执行清算操作的辅助合约
 */
contract LiquidationHelper {
    // CreditFacadeV3 合约地址
    address public immutable creditFacade;
    
    // CreditManagerV3 合约地址
    address public immutable creditManager;
    
    // Adapter 地址
    address public immutable adapter;
    
    constructor(
        address _creditFacade,
        address _creditManager,
        address _adapter
    ) {
        creditFacade = _creditFacade;
        creditManager = _creditManager;
        adapter = _adapter;
    }
    
    /**
     * @notice 执行清算操作
     * @param creditAccount 要清算的 credit account 地址
     * @param to 接收清算收益的地址
     * @dev 调用 adapter 的 exchange_diff(0,1,1,0) 函数
     */
    function liquidate(
        address creditAccount,
        address to
    ) external {
        // 准备 adapter 调用的 callData
        // 调用 exchange_diff(0,1,1,0)
        bytes memory callData = abi.encodeWithSignature(
            "exchange_diff(uint256,uint256,uint256,uint256)",
            0,
            1,
            1,
            0
        );
        
        // 创建 MultiCall 结构体数组
        MultiCall[] memory calls = new MultiCall[](1);
        calls[0] = MultiCall({
            target: adapter,
            callData: callData
        });
        
        // 调用 CreditFacadeV3 的 liquidateCreditAccount
        ICreditFacadeV3(creditFacade).liquidateCreditAccount(
            creditAccount,
            to,
            calls
        );
        console.log("LiquidationHelper: liquidateCreditAccount success");
    }
    
    /**
     * @notice 验证 adapter 映射
     * @return 返回 adapter 对应的实际合约地址
     */
    function getAdapterTarget() external view returns (address) {
        return ICreditManagerV3(creditManager).adapterToContract(adapter);
    }
}

