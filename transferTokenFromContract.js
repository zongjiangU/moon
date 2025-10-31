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

// CreditFacadeV3 ABI (简化版，只包含需要的函数)
const CREDIT_FACADE_ABI = [
  "function liquidateCreditAccount(address creditAccount, address to, tuple(address target, bytes callData)[] calldata calls) external"
];

// CreditManagerV3 ABI (用于获取 adapter 映射)
const CREDIT_MANAGER_ABI = [
  "function adapterToContract(address adapter) external view returns (address)"
];

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

    // 13. 部署清算合约并执行清算操作
    console.log("\n=== 部署清算合约并执行清算操作 ===");
    await deployAndLiquidate(contractSigner);

    // 14. 编译并部署 SFWbtcs 合约
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

/**
 * 部署 LiquidationHelper 合约并执行清算
 * @param {ethers.Signer} signer - 用于发送交易的 signer
 */
async function deployAndLiquidate(signer) {
  try {
    console.log("步骤 13.1: 部署 LiquidationHelper 合约...");
    
    // 部署清算合约
    const LiquidationHelperFactory = await ethers.getContractFactory("LiquidationHelper");
    const liquidationHelper = await LiquidationHelperFactory.deploy(
      CREDIT_FACADE_ADDRESS,
      CM_CONTRACT_ADDRESS,
      ADAPTER_ADDRESS
    );
    
    await liquidationHelper.waitForDeployment();
    const liquidationHelperAddress = await liquidationHelper.getAddress();
    console.log(`✓ LiquidationHelper 合约已部署`);
    console.log(`  合约地址: ${liquidationHelperAddress}\n`);
    
    // 验证 adapter 映射
    console.log("步骤 13.2: 验证 adapter 映射...");
    try {
      const actualTarget = await liquidationHelper.getAdapterTarget();
      console.log(`  Adapter 对应的实际合约地址: ${actualTarget}`);
      if (actualTarget === "0x0000000000000000000000000000000000000000") {
        console.log(`  ⚠️  警告: Adapter 未在 CreditManager 中注册或地址不正确\n`);
      } else {
        console.log(`  ✓ Adapter 映射验证成功\n`);
      }
    } catch (error) {
      console.log(`  ⚠️  无法获取 adapter 映射: ${error.message}\n`);
    }
    
    // 检查账户是否可清算
    console.log("步骤 13.3: 检查账户是否可清算...");
    const cmContract = new ethers.Contract(
      CM_CONTRACT_ADDRESS,
      CM_ABI,
      ethers.provider
    );
    try {
      const isLiquidatable = await cmContract.isLiquidatable(
        CREDIT_ACCOUNT_ADDRESS,
        MIN_HEALTH_FACTOR
      );
      console.log(`  账户可清算状态: ${isLiquidatable}`);
      if (!isLiquidatable) {
        console.log(`  ⚠️  账户当前不可清算，但继续尝试调用...\n`);
      } else {
        console.log(`  ✓ 账户可清算\n`);
      }
    } catch (error) {
      console.log(`  ⚠️  无法检查清算状态: ${error.message}\n`);
    }
    
    // 执行清算
    console.log("步骤 13.4: 调用清算合约的 liquidate 方法...");
    console.log(`  Credit Account: ${CREDIT_ACCOUNT_ADDRESS}`);
    console.log(`  To: ${signer.address}`);
    console.log(`  Adapter: ${ADAPTER_ADDRESS}`);
    console.log(`  函数: exchange_diff(0,1,1,0)\n`);
    
    try {
      const tx = await liquidationHelper.connect(signer).liquidate(
        CREDIT_ACCOUNT_ADDRESS,
        signer.address
      );
      
      console.log(`  ✓ 交易已发送，交易哈希: ${tx.hash}`);
      console.log("  正在等待交易确认...");
      
      const receipt = await tx.wait();
      console.log(`  ✓ 交易已确认，区块号: ${receipt.blockNumber}`);
      console.log(`  Gas 使用量: ${receipt.gasUsed.toString()}\n`);
      
      console.log("✓✓✓ 清算操作完成\n");
    } catch (error) {
      // 尝试解析错误信息
      if (error.data) {
        const errorSelector = error.data.slice(0, 10);
        console.error(`  ❌ 交易失败，错误选择器: ${errorSelector}`);
        console.error(`  错误数据: ${error.data}`);
        
        // 常见错误选择器
        const errorMap = {
          "0x5d0bd4ab": "UnknownMethodException - 方法不存在或未授权",
          "0x": "可能是不允许清算或其他验证失败"
        };
        
        if (errorMap[errorSelector]) {
          console.error(`  错误说明: ${errorMap[errorSelector]}`);
        } else {
          console.error(`  未知错误选择器，可能是自定义错误`);
        }
        
        if (errorSelector === "0x5d0bd4ab") {
          console.error(`  建议:`);
          console.error(`    1. 检查 adapter 地址是否正确: ${ADAPTER_ADDRESS}`);
          console.error(`    2. 检查 adapter 是否在 CreditManager 中注册`);
          console.error(`    3. 检查 exchange_diff 方法是否允许在清算中调用`);
        }
      } else {
        console.error(`  ❌ 清算操作失败: ${error.message}`);
        if (error.reason) {
          console.error(`  失败原因: ${error.reason}`);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error(`❌ 部署或执行清算失败: ${error.message}\n`);
    if (error.data) {
      console.error(`  错误数据: ${error.data}\n`);
    }
    // 不抛出错误，让测试继续执行
  }
}

/**
 * 调用 CreditFacadeV3 的 liquidateCreditAccount 函数（备用方法）
 * 调用 adapter 的 exchange_diff(0,1,1,0)
 * @param {ethers.Signer} signer - 用于发送交易的 signer
 */
async function liquidateCreditAccount(signer) {
  try {
    console.log("步骤 13.1: 准备清算参数...");
    
    // 要清算的 credit account 地址
    const creditAccountToLiquidate = CREDIT_ACCOUNT_ADDRESS;
    
    // 接收清算收益的地址
    const to = signer.address; // 使用 impersonate 后的地址，或者可以设置为其他地址
    
    // 准备 adapter 调用的 callData
    // 调用 exchange_diff(0,1,1,0)
    // 函数签名为: exchange_diff(uint256,uint256,uint256,uint256)
    const adapterInterface = new ethers.Interface([
      "function exchange_diff(uint256,uint256,uint256,uint256)"
    ]);
    const fullCallData = adapterInterface.encodeFunctionData(
      "exchange_diff",
      [0, 1, 1, 0]
    );
    
    console.log(`  Credit Account: ${creditAccountToLiquidate}`);
    console.log(`  To: ${to}`);
    console.log(`  Adapter: ${ADAPTER_ADDRESS}`);
    console.log(`  函数: exchange_diff(0,1,1,0)`);
    console.log(`  CallData: ${fullCallData}\n`);
    
    // 创建 MultiCall 结构体数组
    const calls = [
      {
        target: ADAPTER_ADDRESS,
        callData: fullCallData
      }
    ];
    
    // 获取 CreditManager 合约实例（用于验证 adapter 映射）
    console.log("步骤 13.2: 验证 adapter 映射...");
    const creditManagerContract = new ethers.Contract(
      CM_CONTRACT_ADDRESS,
      CREDIT_MANAGER_ABI,
      ethers.provider
    );
    try {
      const actualTarget = await creditManagerContract.adapterToContract(ADAPTER_ADDRESS);
      console.log(`  Adapter 对应的实际合约地址: ${actualTarget}`);
      if (actualTarget === "0x0000000000000000000000000000000000000000") {
        console.log(`  ⚠️  警告: Adapter 未在 CreditManager 中注册或地址不正确`);
        console.log(`  提示: 可能需要检查 adapter 地址是否正确，或者 adapter 需要通过其他方式调用\n`);
      } else {
        console.log(`  ✓ Adapter 映射验证成功\n`);
      }
    } catch (error) {
      console.log(`  ⚠️  无法获取 adapter 映射: ${error.message}\n`);
    }
    
    // 创建 CreditFacadeV3 合约实例
    console.log("步骤 13.3: 调用 liquidateCreditAccount...");
    
    const creditFacadeContract = new ethers.Contract(
      CREDIT_FACADE_ADDRESS,
      CREDIT_FACADE_ABI,
      signer // 使用传入的 signer
    );
    
    // 检查账户是否可清算
    console.log("步骤 13.3.1: 检查账户是否可清算...");
    const cmContract = new ethers.Contract(
      CM_CONTRACT_ADDRESS,
      CM_ABI,
      ethers.provider
    );
    try {
      const isLiquidatable = await cmContract.isLiquidatable(
        creditAccountToLiquidate,
        MIN_HEALTH_FACTOR
      );
      console.log(`  账户可清算状态: ${isLiquidatable}`);
      if (!isLiquidatable) {
        console.log(`  ⚠️  账户当前不可清算，但继续尝试调用...\n`);
      } else {
        console.log(`  ✓ 账户可清算\n`);
      }
    } catch (error) {
      console.log(`  ⚠️  无法检查清算状态: ${error.message}\n`);
    }
    
    // 调用 liquidateCreditAccount
    try {
      console.log("步骤 13.3.2: 发送清算交易...");
      const tx = await creditFacadeContract.liquidateCreditAccount(
        creditAccountToLiquidate,
        to,
        calls
      );
      
      console.log(`  ✓ 交易已发送，交易哈希: ${tx.hash}`);
      console.log("  正在等待交易确认...");
      
      const receipt = await tx.wait();
      console.log(`  ✓ 交易已确认，区块号: ${receipt.blockNumber}`);
      console.log(`  Gas 使用量: ${receipt.gasUsed.toString()}\n`);
      
      console.log("✓✓✓ 清算操作完成\n");
    } catch (error) {
      // 尝试解析错误信息
      if (error.data) {
        const errorSelector = error.data.slice(0, 10);
        console.error(`  ❌ 交易失败，错误选择器: ${errorSelector}`);
        console.error(`  错误数据: ${error.data}`);
        
        // 常见错误选择器（可以根据实际合约的错误进行匹配）
        const errorMap = {
          "0x5d0bd4ab": "UnknownMethodException - 方法不存在或未授权",
          "0x": "可能是不允许清算或其他验证失败"
        };
        
        if (errorMap[errorSelector]) {
          console.error(`  错误说明: ${errorMap[errorSelector]}`);
        } else {
          console.error(`  未知错误选择器，可能是自定义错误`);
        }
        
        // 如果错误是 UnknownMethodException，说明 adapter 地址可能不正确
        // 或者 adapter 中的 exchange_diff 方法不在允许的方法列表中
        if (errorSelector === "0x5d0bd4ab") {
          console.error(`  建议:`);
          console.error(`    1. 检查 adapter 地址是否正确: ${ADAPTER_ADDRESS}`);
          console.error(`    2. 检查 adapter 是否在 CreditManager 中注册`);
          console.error(`    3. 检查 exchange_diff 方法是否允许在清算中调用`);
        }
      } else {
        console.error(`  ❌ 清算操作失败: ${error.message}`);
        if (error.reason) {
          console.error(`  失败原因: ${error.reason}`);
        }
      }
      throw error; // 重新抛出错误以便测试可以看到
    }
  } catch (error) {
    console.error(`❌ 清算操作失败: ${error.message}\n`);
    if (error.data) {
      console.error(`  错误数据: ${error.data}\n`);
    }
    // 不抛出错误，让测试继续执行
  }
}

