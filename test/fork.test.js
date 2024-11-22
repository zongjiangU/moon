const { ethers } = require("hardhat");
const ERC20_ABI = require("./ERC20.json");
const DEMO_ABI = require("./ALK.json")


const USDC_ADDR = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const mockAddress = "0xdE86EA8867E63a4133E255a3E2FF912dfeA6D658";
const  WETH_A = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const KNC_A = "0xdd974D5C2e2928deA5F71b9825b8b646686BD200";
const ZH_A = "0x837010619aeb2AE24141605aFC8f66577f6fb2e7";
const rHC_A = "0x47C0aD2aE6c0Ed4bcf7bc5b380D7205E89436e84";

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
    console.log("Demo address", Demo.target);

    const USDC = new ethers.Contract(USDC_ADDR, ERC20_ABI, provider);
    const WETH = new ethers.Contract(WETH_A, ERC20_ABI, provider);
    const KNC = new ethers.Contract(KNC_A, ERC20_ABI, provider);
    const ZH = new ethers.Contract(ZH_A, ERC20_ABI, provider);
    const rHC = new ethers.Contract(rHC_A, ERC20_ABI, provider);
    await rHC.connect(signer).approve(Demo.target, "10000000000000000000000");
    await Demo.connect(signer).fuck();
  });
});