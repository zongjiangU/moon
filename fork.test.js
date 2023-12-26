const { ethers, network } = require("hardhat");


const ERC20_ABI = require("./erc20_abi.json");
const MARKET_ABI = require("./market_abi.json");
const CONTROL_ABI = require("./cotrol_abi.json");
const ORACLE_ABI = require("./oracle_abi.json");

const WETH_TOKEN_ADDRESS = "0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C";
const USDC_TOKEN_ADDRESS = "0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D";
const WBTC_TOKEN_ADDRESS = "0x6aB6d61428fde76768D7b45D8BFeec19c6eF91A8";

const mockAddress = "0x624f1B50966d8884708C3457a21D577D7307f704";

const CONTROL_ADDRESS = "0xD5B649c7d27C13a2b80425daEe8Cb6023015Dc6B";
const A_CONTROL_ADDRESS = "";

const USDC_MARKET_ADDRESS = "0x8153303F72aB12f13180c946723BCACAe05A4C4a";
const WETH_MARKET_ADDRESS = "0xB5Dc005D89D0b4D0bC4a9459C7f77A403e9bFEea";
const ORACLE_ADDRESS = "0xA7ad08399bce6dd0f7110D88CC6303F9561aCD48";
const WBTC_MARKET_ADDRESS = "0x7061adf5b2AF1542219de8D94e5C3DdF370a1cd6";
const APELL_WBTC_M_ADDRESS = "";
const APELL_WETH_M_ADDRESS = "";

let provider,borrower;
let COMP,WETH,WBTC;
let WBTC_M,WETH_M;

describe("Fork", function () {
    this.timeout(6000000);
    it("Testing fork data", async function () {
        provider = ethers.provider;

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [mockAddress],
        });

        borrower = await ethers.getSigner(mockAddress);


        WETH = new ethers.Contract(WETH_TOKEN_ADDRESS, ERC20_ABI, borrower);
        WBTC = new ethers.Contract(WBTC_TOKEN_ADDRESS, ERC20_ABI,borrower);
        WETH_M = new ethers.Contract(WETH_MARKET_ADDRESS, MARKET_ABI, borrower);
        WBTC_M = new ethers.Contract(WBTC_MARKET_ADDRESS, MARKET_ABI,borrower);
        A_WETH_M = new ethers.Contract(APELL_WETH_MARKET_ADDRESS, MARKET_ABI, borrower);
        A_WBTC_M = new ethers.Contract(APELL_WBTC_MARKET_ADDRESS, MARKET_ABI,borrower);
        CONTROL = new ethers.Contract(CONTROL_ADDRESS, CONTROL_ABI,borrower);
        A_CONTROL = new ethers.Contract(A_CONTROL_ADDRESS, CONTROL_ABI,borrower);


        await A_CONTROL.connect(borrower).enterMarkets([APELL_WBTC_M_ADDRESS,APELL_WETH_M_ADDRESS]);
        await CONTROL.connect(borrower).enterMarkets([WBTC_M_ADDRESS,WETH_M_ADDRESS]);

        await WETH.connect(borrower).approve(A_WETH_M,10000000000000000000);
        await A_WETH_M.connect(borrower).mint(ethers.parseUnits("10", 18));
        await A_BTC_M.connect(borrower).borrow(36341233);
        checkBalance(WBTC,mockAddress,"解出来的WBTC：");

        await WBTC.connect(borrower).approve(WBTC_MARKET_ADDRESS,10000000000000);
        await checkSupply(WBTC_M,"初始供应：");
        await WBTC_M.connect(borrower).mint(36341233);
        await checkSupply(WBTC_M,"mint供应：");
        await checkBalance(WETH,WETH_MARKET_ADDRESS,"现有的数量：");
        await WETH_M.connect(borrower).borrow("29387094995625137706");
        await checkBalance(WETH,mockAddress,"我的钱包现有WETH");

    });
});


async function doMintToStrike(){
    // 检查初始供应
    await checkSupply(STRIKE_COMP_MARKET, "开始时的供应");

    // 执行交易
    await COMP.connect(borrower).approve(STRIKE_COMP_MARKET_ADDRESS, ethers.parseUnits("100", 18));
    await STRIKE_COMP_MARKET.connect(borrower).mint(ethers.parseUnits("100", 18));

    // 检查最新供应
    await checkSupply(STRIKE_COMP_MARKET, "当前LP的供应");
    await STRIKE_COMP_MARKET.connect(borrower).redeem("4999999999999999999998");
    await checkSupply(STRIKE_COMP_MARKET, "redeem后LP的供应");

    await COMP.connect(borrower).transfer(STRIKE_COMP_MARKET_ADDRESS,"4999999999999999999999");
    await checkBalance(COMP,STRIKE_COMP_MARKET_ADDRESS,"transfer后market中COMP数量");
    await checkBalance(COMP,mockAddress,"转入后我的剩余COMP数量");

    let snap = await CONTROL.getAccountLiquidity(mockAddress);
    console.log("snap: ",snap);

    let snap1 = await STRIKE_COMP_MARKET.getAccountSnapshot(mockAddress);
    console.log("snap:",snap1);

    let s = await USDT.balanceOf("0x69702cfd7DAd8bCcAA24D6B440159404AAA140F5");
    console.log("USDT : ",s);
    let n = await CONTROL.connect(vault).borrowAllowed(STRIKE_USDT_MARKET_ADDRESS,mockAddress,ethers.parseUnits("5000", 6));
    console.log(n);
    let m = await STRIKE_USDT_MARKET.connect(borrower).borrow(ethers.parseUnits("5000", 6));
    console.log("m : ",m);
    let e = await USDT.balanceOf(mockAddress);
    console.log("USDT : ",e);

}

async function redeemUnderlyingToStrike(){
    await checkBalance(STRIKE_COMP_MARKET,mockAddress,"redeemUnserlying前我的LP");
    await STRIKE_COMP_MARKET.connect(borrower).redeemUnderlying("4999999999999999999998");
    await checkBalance(STRIKE_COMP_MARKET,mockAddress,"redeemUnserlying后我的LP");
    await checkBalance(COMP,STRIKE_COMP_MARKET_ADDRESS,"redeemUnserlying后剩余COMP数量");
}


async function checkSupply(tokenContract, msg) {
    let totalSupply = await tokenContract.totalSupply();
    console.log(msg, totalSupply.toString());
}
async function checkBalance(tokenContract, user, msg) {
    let balance = await tokenContract.balanceOf(user);
    console.log(msg, balance.toString());
}
