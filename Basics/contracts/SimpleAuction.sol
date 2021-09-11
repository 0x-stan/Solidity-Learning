// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.7;

contract SimpleAuction {
    address payable public beneficiary; // 受益人的收款地址
    uint256 public auctionEndTime; // 拍卖结束时间 (unix timestamps)

    address public highestBidder; // 当前出价最高的出标者
    uint256 public highestBid; // 当前出价最高的出标

    mapping(address => uint256) pendingReturns; // 记录出标的价格，允许赎回

    bool ended; // 拍卖是否结束

    event HighestBidIncreased(address bidder, uint256 ammount); // 更新最高出标价的事件
    event AuctionEnded(address winner, uint256 amount); // 拍卖结束事件

    error AuctionAlreadyEnded();
    error BidNotHighEnough(uint256 highestBid);
    error AuctionNotYetEnded();
    error AuctionEndAlreadyCalled();

    constructor(uint256 biddingTime, address payable beneficaryAddress) {
        beneficiary = beneficaryAddress;
        auctionEndTime = block.timestamp + biddingTime;
    }

    // 竞标函数
    // 不需要入参，因为竞标人地址和出价都在msg中
    function bid() external payable {
        // 拍卖结束不能接受竞标
        if (block.timestamp > auctionEndTime) {
            revert AuctionAlreadyEnded();
        }

        // 竞标价需要比当前最高价高
        if (msg.value <= highestBid) {
            revert BidNotHighEnough(highestBid);
        }

        // 最高价不为0，代表之前已发生过竞标
        // 当程序再次走到这里，意味着最新的出价一定比之前的最高价要高
        // 即之前的出价最高者，马上被替代，那么他的钱应当被累加到可赎回的数量上
        // 而当最价格为0，意味着本函数第一次被调用，不需要进行赎回数量的累加操作
        if (highestBid != 0) {
            // 这里的 highestBidder 依然是之前的最高者
            pendingReturns[highestBidder] += highestBid;
        }

        // 累加可赎回数量之后，这里再更改最价格信息
        highestBidder = msg.sender;
        highestBid = msg.value;
        emit HighestBidIncreased(msg.sender, msg.value);
    }

    // 赎回出标金额，返回成功还是失败的布尔值
    function withdraw() external returns (bool) {
        // 缓存可赎回数量
        uint256 amount = pendingReturns[msg.sender];
        // 当数量大于0，进入赎回操作
        if (amount > 0) {
            // 清空赎回数量
            pendingReturns[msg.sender] = 0;

            // 尝试发送回赎回的金额
            // 当发送失败，还原可赎回数量，返回false
            if (!payable(msg.sender).send(amount)) {
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        // 其他情况返回true
        // 当可赎回数量为0 的时候，也会返回true
        return true;
    }

    function auctionEnd() external {
        // 这是构建交互函数的一个很好的结构
        // 1. 检查条件
        // 2. 执行操作（可能改变条件）
        // 3. 和其他合约交互
        // 如果三个操作混合在一起，可能会有安全问题，比如重入攻击

        // 1. Conditions
        if (block.timestamp < auctionEndTime) revert AuctionNotYetEnded();
        if (ended) revert AuctionEndAlreadyCalled();

        // 2. Effects
        ended = true;
        emit AuctionEnded(highestBidder, highestBid);

        // 3. Interaction
        beneficiary.transfer(highestBid);
    }
}
