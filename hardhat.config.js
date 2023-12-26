/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-ethers");
module.exports = {
  solidity: "0.8.4",

  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.api.moonriver.moonbeam.network",
		blockNumber:5810800
      }
    }
  }
};