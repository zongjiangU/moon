const { ethers } = require("hardhat");


const USDC_ADDR = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const mockAddress = "0x54edC2D90BBfE50526E333c7FfEaD3B0F22D39F0";

describe("Fork", function () {
  it("Testing fork data", async function () {
    console.log((await ethers.provider.getBlockNumber()).toString());
    const provider = ethers.provider;
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [mockAddress],
    });

    const Demo = await ethers.getContractFactory("Demo");
    const token = await Demo.deploy();
  });
});