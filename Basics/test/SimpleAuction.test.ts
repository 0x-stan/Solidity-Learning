import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';

import { ethers } from 'hardhat';
import { Signer, Contract, utils, BigNumber } from 'ethers';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';

import { passBlocks, getBlcokTimestamp } from '../../utils';

chai.use(solidity);

const { expect } = chai;

describe('SimpleAuction', function () {
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
    const SimpleAuction = await ethers.getContractFactory('SimpleAuction');
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

  describe('contructor()', async function () {

    it('should SimpleAuction initialize correctly.', async function () {
      await initializeProccess(60 * 1000, ownerAddress);

      expect(await simpleAuction.auctionEndTime()).to.equals(
        beginTime + biddingTime
      );
      expect(await simpleAuction.beneficiary()).to.equals(ownerAddress);
    });
  });

  describe('bid()', async function () {
    it('Revert the call if the bidding period is over.', async function () {
      await initializeProccess(1, ownerAddress);

      await simpleAuction.connect(user1).bid({ value: 1 });
      expect((await simpleAuction.highestBid()).toNumber()).to.greaterThan(0);
      // if we want to `block.timestamp` changed,
      // we need to pass a block instead of waiting time passed.
      await passBlocks(1);
      await expect(
        simpleAuction.connect(user1).bid({ value: 2 })
      ).to.revertedWith('AuctionAlreadyEnded()');
    });

    it('Revert the call if the bid is not greater then highestBid.', async function () {
      await initializeProccess(60 * 1000, ownerAddress);

      await simpleAuction.connect(user1).bid({ value: 1 });
      await expect(
        simpleAuction.connect(user1).bid({ value: 1 })
      ).to.revertedWith('BidNotHighEnough(1)');
    });

    it('Should highest changed and no pendingReturns increaseed after first bid().', async function () {
      await initializeProccess(60 * 1000, ownerAddress);

      await simpleAuction.connect(user1).bid({ value: 1 });
      await expect(
        simpleAuction.connect(user1).bid({ value: 1 })
      ).to.revertedWith('BidNotHighEnough(1)');
    });
  });
});
