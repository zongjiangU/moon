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

describe("从合约地址转账代币到指定地址", function () {
  this.timeout(120000);

  it("将合约地址作为用户执行 transfer", async function () {
    console.log("=== 开始执行代币转账 ===");
    console.log(`合约地址: ${CONTRACT_ADDRESS}`);
    console.log(`代币地址: ${TOKEN_ADDRESS}`);
    console.log(`目标地址: ${RECIPIENT_ADDRESS}`);
    console.log(`当前区块号: ${(await ethers.provider.getBlockNumber()).toString()}\n`);

    // 1. Impersonate 合约地址，使其可以作为用户使用
    console.log("步骤 1: 正在 impersonate 合约地址...");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [CONTRACT_ADDRESS],
    });
    console.log("✓ 合约地址已 impersonate\n");

    // 2. 给合约地址设置足够的 ETH 余额用于支付 gas 费
    console.log("步骤 2: 正在设置合约地址的 ETH 余额...");
    await network.provider.send("hardhat_setBalance", [
      CONTRACT_ADDRESS,
      "0x1000000000000000000", // 1 ETH (足够支付 gas)
    ]);
    console.log("✓ ETH 余额已设置\n");

    // 3. 获取合约地址的 signer
    console.log("步骤 3: 获取合约地址的 signer...");
    const contractSigner = await ethers.getSigner(CONTRACT_ADDRESS);
    console.log("✓ Signer 已获取\n");

    // 4. 创建代币合约实例
    console.log("步骤 4: 创建代币合约实例...");
    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      ERC20_ABI,
      contractSigner
    );
    console.log("✓ 代币合约实例已创建\n");

    // 5. 获取代币的精度（decimals）
    let decimals = 18; // 默认值
    try {
      decimals = await tokenContract.decimals();
      console.log(`代币精度: ${decimals}\n`);
    } catch (e) {
      console.log(`无法获取代币精度，使用默认值 18\n`);
    }

    // 6. 检查转账前的代币余额
    console.log("步骤 5: 检查转账前的代币余额...");
    const balanceBefore = await tokenContract.balanceOf(CONTRACT_ADDRESS);
    const formattedBalanceBefore = ethers.formatUnits(balanceBefore, decimals);
    console.log(`合约地址代币余额（转账前）: ${formattedBalanceBefore}`);
    console.log(`原始值: ${balanceBefore.toString()}\n`);

    if (balanceBefore === 0n) {
      console.log("⚠️  警告: 合约地址的代币余额为 0，无法执行转账");
      return;
    }

    // 7. 设置转账金额为 8 * 10^18
    const transferAmount = ethers.parseEther("8"); // 8 * 10^18
    console.log("步骤 6: 设置转账金额...");
    console.log(`转账金额: 8 tokens (${transferAmount.toString()})\n`);

    // 检查余额是否足够
    if (balanceBefore < transferAmount) {
      console.log(`⚠️  警告: 合约地址余额不足，当前余额: ${formattedBalanceBefore}，需要: 8 tokens`);
      return;
    }

    // 8. 检查接收地址转账前的余额
    console.log("步骤 7: 检查接收地址转账前的余额...");
    const recipientBalanceBefore = await tokenContract.balanceOf(RECIPIENT_ADDRESS);
    const formattedRecipientBalanceBefore = ethers.formatUnits(recipientBalanceBefore, decimals);
    console.log(`接收地址代币余额（转账前）: ${formattedRecipientBalanceBefore}`);
    console.log(`原始值: ${recipientBalanceBefore.toString()}\n`);

    // 8.5. 创建 Credit Manager 合约实例并调用 isLiquidatable (转账前)
    console.log("步骤 7.5: 调用 isLiquidatable (转账前)...");
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
      console.log(`转账前 isLiquidatable(${CREDIT_ACCOUNT_ADDRESS}, ${MIN_HEALTH_FACTOR}): ${isLiquidatableBefore}\n`);
    } catch (error) {
      console.error(`❌ 调用 isLiquidatable 失败: ${error.message}\n`);
    }

    // 9. 执行 transfer 到接收地址
    console.log("步骤 8: 执行 transfer 到接收地址...");
    try {
      const tx = await tokenContract.transfer(RECIPIENT_ADDRESS, transferAmount);
      console.log(`✓ 交易已发送，交易哈希: ${tx.hash}`);
      console.log("正在等待交易确认...");
      
      const receipt = await tx.wait();
      console.log(`✓ 交易已确认，区块号: ${receipt.blockNumber}`);
      console.log(`Gas 使用量: ${receipt.gasUsed.toString()}\n`);
    } catch (error) {
      console.error("❌ 转账失败:", error.message);
      throw error;
    }

    // 10. 检查转账后的代币余额
    console.log("步骤 9: 检查转账后的代币余额...");
    const balanceAfter = await tokenContract.balanceOf(CONTRACT_ADDRESS);
    const formattedBalanceAfter = ethers.formatUnits(balanceAfter, decimals);
    console.log(`合约地址代币余额（转账后）: ${formattedBalanceAfter}`);
    console.log(`原始值: ${balanceAfter.toString()}\n`);

    // 11. 验证接收地址的余额
    console.log("步骤 10: 验证接收地址的代币余额...");
    const recipientBalanceAfter = await tokenContract.balanceOf(RECIPIENT_ADDRESS);
    const formattedRecipientBalanceAfter = ethers.formatUnits(recipientBalanceAfter, decimals);
    console.log(`接收地址代币余额（转账后）: ${formattedRecipientBalanceAfter}`);
    console.log(`原始值: ${recipientBalanceAfter.toString()}\n`);

    // 11.5. 再次调用 isLiquidatable (转账后)
    console.log("步骤 10.5: 调用 isLiquidatable (转账后)...");
    let isLiquidatableAfter = null;
    try {
      isLiquidatableAfter = await cmContract.isLiquidatable(
        CREDIT_ACCOUNT_ADDRESS,
        MIN_HEALTH_FACTOR
      );
      console.log(`转账后 isLiquidatable(${CREDIT_ACCOUNT_ADDRESS}, ${MIN_HEALTH_FACTOR}): ${isLiquidatableAfter}\n`);
    } catch (error) {
      console.error(`❌ 调用 isLiquidatable 失败: ${error.message}\n`);
    }

    // 12. 打印总结
    const formattedTransferAmount = ethers.formatUnits(transferAmount, decimals);
    console.log("=== 执行结果总结 ===");
    console.log(`合约地址转账前余额: ${formattedBalanceBefore} (${balanceBefore.toString()})`);
    console.log(`合约地址转账后余额: ${formattedBalanceAfter} (${balanceAfter.toString()})`);
    console.log(`接收地址转账前余额: ${formattedRecipientBalanceBefore} (${recipientBalanceBefore.toString()})`);
    console.log(`接收地址转账后余额: ${formattedRecipientBalanceAfter} (${recipientBalanceAfter.toString()})`);
    console.log(`转账数量: ${formattedTransferAmount} (${transferAmount.toString()})`);
    
    // 打印 isLiquidatable 的结果对比
    console.log(`\n=== isLiquidatable 结果对比 ===`);
    if (isLiquidatableBefore !== null && isLiquidatableAfter !== null) {
      console.log(`转账前: isLiquidatable(${CREDIT_ACCOUNT_ADDRESS}, ${MIN_HEALTH_FACTOR}) = ${isLiquidatableBefore}`);
      console.log(`转账后: isLiquidatable(${CREDIT_ACCOUNT_ADDRESS}, ${MIN_HEALTH_FACTOR}) = ${isLiquidatableAfter}`);
    } else {
      console.log(`⚠️  无法完整显示 isLiquidatable 结果（可能之前调用失败）`);
      if (isLiquidatableBefore !== null) {
        console.log(`转账前: ${isLiquidatableBefore}`);
      }
      if (isLiquidatableAfter !== null) {
        console.log(`转账后: ${isLiquidatableAfter}`);
      }
    }
    console.log("===============================\n");

    // 验证结果
    const expectedRecipientBalance = recipientBalanceBefore + transferAmount;
    const expectedContractBalance = balanceBefore - transferAmount;
    if (balanceAfter === expectedContractBalance && recipientBalanceAfter === expectedRecipientBalance) {
      console.log("✓✓✓ 验证成功: 8 tokens 已成功转移到接收地址");
    } else {
      console.log("⚠️  验证结果: 余额变化与预期不完全一致");
      console.log(`预期合约地址余额: ${expectedContractBalance.toString()}`);
      console.log(`实际合约地址余额: ${balanceAfter.toString()}`);
      console.log(`预期接收地址余额: ${expectedRecipientBalance.toString()}`);
      console.log(`实际接收地址余额: ${recipientBalanceAfter.toString()}`);
    }

    // 13. 编译并部署 SFWbtcs 合约
    console.log("\n=== 编译并部署 SFWbtcs 合约 ===");
    try {
      const DD = await ethers.getContractFactory("SFWbtcs");
      console.log("✓ 合约工厂已获取");
      
      const Demo = await DD.deploy();
      console.log(`✓ 部署交易已发送，等待确认...`);
      
      await Demo.waitForDeployment();
      const deployedAddress = await Demo.getAddress();
      console.log(`✓ SFWbtcs 合约已部署`);
      console.log(`  合约地址: ${deployedAddress}\n`);
    } catch (error) {
      console.error(`❌ 部署 SFWbtcs 合约失败: ${error.message}\n`);
    }
  });
});

