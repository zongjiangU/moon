require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: "0.8.27",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/PwTuHRI1g3e3py3my0x46MeA5-_U2s90",
      }
    }
  }
};
