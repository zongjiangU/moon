
const { ethers, network } = require("hardhat");


const ERC20_ABI = require("./erc20_abi.json");
const MARKET_ABI = require("./market_abi.json");
const CONTROL_ABI = require("./cotrol_abi.json");
const ORACLE_ABI = require("./oracle_abi.json");

const WETH_TOKEN_ADDRESS = "0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C";
const USDC_TOKEN_ADDRESS = "0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D";

const mockAddress = "0x624f1B50966d8884708C3457a21D577D7307f704";

const CONTROL_ADDRESS = "0x0983B43A40A2e36ce1EA55B2aC88041Fc88E2613";

const USDC_MARKET_ADDRESS = "0x8153303F72aB12f13180c946723BCACAe05A4C4a";
const WETH_MARKET_ADDRESS = "0xB5Dc005D89D0b4D0bC4a9459C7f77A403e9bFEea";
const ORACLE_ADDRESS = "0xA7ad08399bce6dd0f7110D88CC6303F9561aCD48";

let provider,borrower;
let COMP,WETH,USDT;
let USDC_M,WETH_M;

describe("Fork", function () {
    this.timeout(6000000); // 设置超时时间为60秒
    it("Testing fork data", async function () {
        provider = ethers.provider;

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [mockAddress],
        });

        borrower = await ethers.getSigner(mockAddress);


        await network.provider.send("hardhat_setBalance", [
            mockAddress, // 这是你想设置余额的以太坊地址
            "0x1BC16D674EC80000" // 2 ETH 对应的 wei 数量，以十进制字符串表示
          ]);


        WETH = new ethers.Contract(WETH_TOKEN_ADDRESS, ERC20_ABI, borrower);
        USDC = new ethers.Contract(USDC_TOKEN_ADDRESS, ERC20_ABI,borrower);
        WETH_M = new ethers.Contract(WETH_MARKET_ADDRESS, MARKET_ABI, borrower);
        USDC_M = new ethers.Contract(USDC_MARKET_ADDRESS, MARKET_ABI,borrower);
        CONTROL = new ethers.Contract(CONTROL_ADDRESS, CONTROL_ABI,borrower);
        ORACLE = new ethers.Contract(ORACLE_ADDRESS,ORACLE_ABI,borrower);


        await checkBalance(USDC,mockAddress,"USDC:");
        await checkBalance(WETH,mockAddress,"WETH");
        await USDC.connect(borrower).approve(USDC_MARKET_ADDRESS,10000000000000);
        await checkSupply(USDC_M,"初始供应：");
        await USDC_M.connect(borrower).mint(10000000000);
        await checkSupply(USDC_M,"mint供应：");
        await checkBalance(WETH,WETH_MARKET_ADDRESS,"现有的数量：");       
        await WETH_M.connect(borrower).borrow("29387094");
        await checkBalance(WETH,mockAddress,"我的钱包现有WETH");

        let a = await CONTROL.getAccountLiquidity(mockAddress);
        let b = await USDC_M.getAccountSnapshot(mockAddress);
        console.log(a);
        console.log(b);
        await checkBalance(USDC_M,mockAddress,"LP");
        let c = await CONTROL.getAssetsIn(mockAddress);
        console.log(c);
        let d = await ORACLE.getUnderlyingPrice(USDC_MARKET_ADDRESS);
        console.log(d);


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