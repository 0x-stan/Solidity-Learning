import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';

import { ethers } from 'hardhat';
import { Signer, Contract, utils, BigNumber } from 'ethers';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';

import {
  passBlocks,
  getBlcokTimestamp,
  GAS_PRICE,
  extendDecimals,
} from '../../utils';

chai.use(solidity);

const { expect } = chai;

const one_eth = extendDecimals(1);
describe('BlindAuction', function () {
  let owner: Signer, user1: Signer, user2: Signer;
  let ownerAddress: string, user1Address: string, user2Address: string;
  let blindAuction: Contract;

  let beginTime: number;
  let biddingTime: number;
  let revealTime: number;

  async function initializeProccess(
    _biddingTime: number,
    _revealTime: number,
    _onwerAddress: string
  ) {
    biddingTime = _biddingTime;
    revealTime = _revealTime;
    const BlindAuction = await ethers.getContractFactory('BlindAuction');
    blindAuction = await BlindAuction.deploy(biddingTime, revealTime, ownerAddress);

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
    it('should BlindAuction initialize correctly.', async function () {
      await initializeProccess(60, 60, ownerAddress);

      expect(await blindAuction.biddingEnd()).to.equals(
        beginTime + biddingTime
      );
      expect(await blindAuction.revealEnd()).to.equals(
        beginTime + biddingTime + revealTime
      );
      expect(await blindAuction.beneficiary()).to.equals(ownerAddress);
    });
  });

  describe('bid()', async function () {
    
  });

  describe('auctionEnd()', async function () {
    
  });
});
