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

pragma solidity 0.8.27;
import "hardhat/console.sol";

interface Alk{
    function liquidateBorrow(
        address targetAccount,
        address assetBorrow,
        address assetCollateral,
        uint256 requestedAmountClose
    ) external payable returns (uint256);

    function withdraw(address asset, uint256 requestedAmount)
        external
        returns (uint256);
}

interface ERC20{
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address _owner) external view returns (uint256 balance);
}

contract Demo{
    address USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

    address ALK_CONTRACT = 0x4822D9172e5b76b9Db37B75f5552F9988F98a888;
    address TARGET = 0x7E5F80BD3DE220eBFaa713A07b3B1605E06ccD5b;

    function fuck() public{
        ERC20(USDC).transferFrom(msg.sender,address(this),15000*1e6);
        ERC20(USDC).approve(ALK_CONTRACT,1500000000*1e6);
        console.log("USDC:",ERC20(USDC).balanceOf(address(this)));
        uint256 res = Alk(ALK_CONTRACT).liquidateBorrow(TARGET, USDC, WBTC, 5000*1e6);
        console.log("USDC:",ERC20(USDC).balanceOf(address(this)));
        console.log("res:",res);
        Alk(ALK_CONTRACT).withdraw(WBTC, type(uint256).max);
        console.log("wbtc: ",ERC20(WBTC).balanceOf(address(this)));
    }
}