const { ethers } = require("hardhat");
const ERC20_ABI = require("./ERC20.json");
const DEMO_ABI = require("./ALK.json")


const USDC_ADDR = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const mockAddress = "0xdE86EA8867E63a4133E255a3E2FF912dfeA6D658";
const mockAddress2 = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const mockAddress3 = "0x8Da17BBb1456D3839aC6a6Fe64607769e0c85140";
const mockAddress4 = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
const mockAddress5 = "0x36cc7B13029B5DEe4034745FB4F24034f3F2ffc6";
const WETH_A = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const KNC_A = "0xdd974D5C2e2928deA5F71b9825b8b646686BD200";
const ZH_A = "0x837010619aeb2AE24141605aFC8f66577f6fb2e7";
const rHC_A = "0x47C0aD2aE6c0Ed4bcf7bc5b380D7205E89436e84";
const WBTC_A = "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D";
const BA_A = "0x3472A5A71965499acd81997a54BBA8D852C6E53d";
const BAO_A = "0x374CB8C27130E2c9E04F44303f3c8351B9De61C1";

describe("Fork", function () {
  it("Testing fork data", async function () {
    console.log((await ethers.provider.getBlockNumber()).toString());
    const provider = ethers.provider;
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mockAddress],
    });

    const DD = await ethers.getContractFactory("OO");
    const Demo = await DD.deploy();
    
    const signer = await ethers.provider.getSigner(mockAddress);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mockAddress2],
    });
    const s2 = await ethers.provider.getSigner(mockAddress2);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mockAddress3],
    });
    const s3 = await ethers.provider.getSigner(mockAddress3);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mockAddress4],
    });
    const s4 = await ethers.provider.getSigner(mockAddress4);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mockAddress5],
    });
    const s5 = await ethers.provider.getSigner(mockAddress5);


    console.log("Demo address", Demo.target);

    const USDC = new ethers.Contract(USDC_ADDR, ERC20_ABI, provider);
    const WETH = new ethers.Contract(WETH_A, ERC20_ABI, provider);
    const KNC = new ethers.Contract(KNC_A, ERC20_ABI, provider);
    const ZH = new ethers.Contract(ZH_A, ERC20_ABI, provider);
    const rHC = new ethers.Contract(rHC_A, ERC20_ABI, provider);
    const WBTC =  new ethers.Contract(WBTC_A, ERC20_ABI, provider);
    const BAN = new ethers.Contract(BA_A, ERC20_ABI, provider);
    const BAO = new ethers.Contract(BAO_A, ERC20_ABI, provider);
    //await rHC.connect(signer).transfer(Demo.target, "3769880000000000000");
    //await KNC.connect(s2).transfer(Demo.target, "710000000000000000");
    await ZH.connect(s3).transfer(Demo.target, "1576000000000000000000");
    await BAO.connect(s5).transfer(Demo.target, "1289177000000000000000000");
    //await Demo.connect(signer).st();
    //await Demo.connect(signer).fuck(51);
    await BAN.connect(s4).approve(Demo.target, "3500000000000000000000000");
    await Demo.connect(s4).st();
    await Demo.connect(s4).bad();
  });
});