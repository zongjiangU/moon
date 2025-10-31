const { ethers, network } = require("hardhat");
const ERC20_ABI = require("./ERC20.json");
const CM_ABI = require("./Cm.json");

// 合约地址和代币地址
const CONTRACT_ADDRESS = "0x81AF467CDf226E32945F974A44d209a47f433002";
const TOKEN_ADDRESS = "0xE72B141DF173b999AE7c1aDcbF60Cc9833Ce56a8";
const RECIPIENT_ADDRESS = "0x0000000000000000000000000000000000000001"; // 接收地址（请根据需要修改）
const CM_CONTRACT_ADDRESS = "0x79C6C1ce5B12abCC3E407ce8C160eE1160250921"; // Credit Manager 合约地址
const CREDIT_ACCOUNT_ADDRESS = "0x81AF467CDf226E32945F974A44d209a47f433002"; // isLiquidatable 的第一个参数
const MIN_HEALTH_FACTOR = 10000; // isLiquidatable 的第二个参数

// 清算相关地址
const CREDIT_FACADE_ADDRESS = "0x9515AB9BB73A9642F1a93Ba7C2790e9d08227f9a"; // CreditFacadeV3 合约地址
const ADAPTER_ADDRESS = "0x48034cdD70658c23c67009494691413afe2a4D52"; // Adapter 地址


describe("从合约地址转账代币到指定地址", function () {
  this.timeout(120000);

  it("将合约地址作为用户执行 transfer", async function () {
    // 1. Impersonate 合约地址，使其可以作为用户使用
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CONTRACT_ADDRESS],
    });

    // 2. 给合约地址设置足够的 ETH 余额用于支付 gas 费
    await network.provider.send("hardhat_setBalance", [
      CONTRACT_ADDRESS,
      "0x1000000000000000000", // 1 ETH (足够支付 gas)
    ]);

    // 3. 获取合约地址的 signer
    const contractSigner = await ethers.getSigner(CONTRACT_ADDRESS);

    // 4. 创建代币合约实例
    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      ERC20_ABI,
      contractSigner
    );

    // 5. 获取代币的精度（decimals）
    let decimals = 18; // 默认值
    try {
      decimals = await tokenContract.decimals();
    } catch (e) {
      // 使用默认值 18
    }

    // 6. 检查转账前的代币余额
    const balanceBefore = await tokenContract.balanceOf(CONTRACT_ADDRESS);
    
    if (balanceBefore === 0n) {
      return;
    }

    // 7. 设置转账金额为 8 * 10^18
    const transferAmount = ethers.parseEther("8"); // 8 * 10^18

    // 检查余额是否足够
    if (balanceBefore < transferAmount) {
      return;
    }

    // 8.5. 调用 isLiquidatable (转账前)
    const cmContract = new ethers.Contract(
      CM_CONTRACT_ADDRESS,
      CM_ABI,
      ethers.provider
    );
    let isLiquidatableBefore = null;
    try {
      isLiquidatableBefore = await cmContract.isLiquidatable(
        CREDIT_ACCOUNT_ADDRESS,
        MIN_HEALTH_FACTOR
      );
      console.log(`转账前 isLiquidatable: ${isLiquidatableBefore}`);
    } catch (error) {
      // 忽略错误
    }

    // 9. 执行 transfer 到接收地址
    const tx = await tokenContract.transfer(RECIPIENT_ADDRESS, transferAmount);
    await tx.wait();

    // 10. 检查转账后的代币余额
    const balanceAfter = await tokenContract.balanceOf(CONTRACT_ADDRESS);

    // 11.5. 再次调用 isLiquidatable (转账后)
    let isLiquidatableAfter = null;
    try {
      isLiquidatableAfter = await cmContract.isLiquidatable(
        CREDIT_ACCOUNT_ADDRESS,
        MIN_HEALTH_FACTOR
      );
      console.log(`转账后 isLiquidatable: ${isLiquidatableAfter}`);
    } catch (error) {
      // 忽略错误
    }

    // 13. 部署清算合约并执行清算操作
    await deployAndLiquidate(contractSigner);

    // 14. 编译并部署 SFWbtcs 合约
    const DD = await ethers.getContractFactory("SFWbtcs");
    const Demo = await DD.deploy();
    await Demo.waitForDeployment();
  });
});

/**
 * 部署 LiquidationHelper 合约并执行清算
 * @param {ethers.Signer} signer - 用于发送交易的 signer
 */
async function deployAndLiquidate(signer) {
  try {
    // 部署清算合约
    const LiquidationHelperFactory = await ethers.getContractFactory("LiquidationHelper");
    const liquidationHelper = await LiquidationHelperFactory.deploy(
      CREDIT_FACADE_ADDRESS,
      CM_CONTRACT_ADDRESS,
      ADAPTER_ADDRESS
    );
    
    await liquidationHelper.waitForDeployment();
    
    // 执行清算
    const tx = await liquidationHelper.connect(signer).liquidate(
      CREDIT_ACCOUNT_ADDRESS,
      signer.address
    );
    
    await tx.wait();
  } catch (error) {
    console.error(`清算失败: ${error.message}`);
    throw error;
  }
}


