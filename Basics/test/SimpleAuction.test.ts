import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";

import { ethers } from "hardhat";
import { Signer, Contract, utils, BigNumber } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";

import {
  passBlocks,
  getBlcokTimestamp,
  GAS_PRICE,
  extendDecimals,
} from "../../utils";

chai.use(solidity);

const { expect } = chai;

const one_eth = extendDecimals(1);
describe("SimpleAuction", function () {
  let owner: Signer, user1: Signer, user2: Signer;
  let ownerAddress: string, user1Address: string, user2Address: string;
  let simpleAuction: Contract;

  let beginTime: number;
  let biddingTime: number;

  async function initializeProccess(
    _biddingTime: number,
    _onwerAddress: string
  ) {
    biddingTime = _biddingTime;
    const SimpleAuction = await ethers.getContractFactory("SimpleAuction");
    simpleAuction = await SimpleAuction.deploy(biddingTime, ownerAddress);

    // get block.timestamp when contract deployed
    beginTime = await getBlcokTimestamp();
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
  });

  describe("constructor()", async function () {
    it("should SimpleAuction initialize correctly.", async function () {
      await initializeProccess(60, ownerAddress);

      expect(await simpleAuction.auctionEndTime()).to.equals(
        beginTime + biddingTime
      );
      expect(await simpleAuction.beneficiary()).to.equals(ownerAddress);
    });
  });

  describe("bid()", async function () {
    it("Revert the call if the bidding period is over.", async function () {
      await initializeProccess(1, ownerAddress);

      await simpleAuction.connect(user1).bid({ value: 1 });
      expect((await simpleAuction.highestBid()).toNumber()).to.greaterThan(0);
      // if we want to `block.timestamp` changed,
      // we need to pass a block instead of waiting time passed.
      await passBlocks(1);
      await expect(
        simpleAuction.connect(user1).bid({ value: 2 })
      ).to.revertedWith("AuctionAlreadyEnded()");
    });

    it("Revert the call if the bid is not greater then highestBid.", async function () {
      await initializeProccess(60, ownerAddress);

      await simpleAuction.connect(user1).bid({ value: 1 });
      await expect(
        simpleAuction.connect(user1).bid({ value: 1 })
      ).to.revertedWith("BidNotHighEnough(1)");
    });

    it("Should highest changed and no pendingReturns increaseed when first bid().", async function () {
      await initializeProccess(60, ownerAddress);

      await simpleAuction.connect(user1).bid({ value: 1 });
      expect(await simpleAuction.highestBidder()).to.equals(user1Address);
      expect(await simpleAuction.highestBid()).to.equals(1);
    });

    it("Should pendingReturns increaseed after first bid() and withdraw() correct value.", async function () {
      await initializeProccess(60, ownerAddress);

      // first bid() and withdraw 0 eth
      await simpleAuction.connect(user1).bid({ value: one_eth });
      const balance1 = await user1.getBalance();
      const withdraw_tx_1 = await simpleAuction.connect(user1).withdraw();
      const { gasUsed: gasUsed1 } = await withdraw_tx_1.wait();
      // balance changed = gasUsed
      expect(balance1.sub(await user1.getBalance())).to.equals(
        gasUsed1.mul(GAS_PRICE)
      );

      // second bid() and withdraw 1 eth
      await simpleAuction.connect(user1).bid({ value: one_eth.mul(2) });
      const balance2 = await user1.getBalance();
      const withdraw_tx_2 = await simpleAuction.connect(user1).withdraw();
      const { gasUsed: gasUsed2 } = await withdraw_tx_2.wait();
      // balance changed = 1eth(withdraw) - gasUsed
      expect(balance2.add(one_eth).sub(await user1.getBalance())).to.equals(
        gasUsed2.mul(GAS_PRICE)
      );
    });
  });

  describe("auctionEnd()", async function () {
    it("Revert the call if still in the biddingTime.", async function () {
      await initializeProccess(60, ownerAddress);

      await expect(simpleAuction.auctionEnd()).to.be.revertedWith(
        "AuctionNotYetEnded()"
      );
    });

    it("Revert the call if already ended.", async function () {
      await initializeProccess(1, ownerAddress);

      await passBlocks(1);
      await simpleAuction.auctionEnd();
      await expect(simpleAuction.auctionEnd()).to.be.revertedWith(
        "AuctionEndAlreadyCalled()"
      );
    });

    it("Should owner recieve the bid.", async function () {
      await initializeProccess(60, ownerAddress);

      await simpleAuction.connect(user1).bid({ value: one_eth });
      await simpleAuction.connect(user2).bid({ value: one_eth.mul(2) });
      await passBlocks(100);
      const balance0 = await owner.getBalance();
      const auctionEndTx = await simpleAuction.auctionEnd();
      const { gasUsed, events } = await auctionEndTx.wait();
      const { data, decode } = events[0];
      const logAuctionEnded = decode(data);
      expect(logAuctionEnded.winner).to.equals(user2Address);
      expect(logAuctionEnded.amount).to.equals(one_eth.mul(2));
      expect(
        balance0.sub(gasUsed.mul(GAS_PRICE)).add(logAuctionEnded.amount)
      ).to.equals(await owner.getBalance());
    });
  });
});
