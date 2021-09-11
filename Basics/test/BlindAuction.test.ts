import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";

import { ethers } from "hardhat";
import { Signer, Contract, utils, BigNumber } from "ethers";
const { keccak256, solidityPack } = utils
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

const packRevealParams = (value: BigNumber, fake: boolean, secret: string) => {
  return keccak256(
    solidityPack(
      ["uint256", 'bool', 'bytes32'],
      [value, fake, secret]
    )
  )
}

describe("BlindAuction", function () {
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
    const BlindAuction = await ethers.getContractFactory("BlindAuction");
    blindAuction = await BlindAuction.deploy(
      biddingTime,
      revealTime,
      ownerAddress
    );

    // get block.timestamp when contract deployed
    beginTime = await getBlcokTimestamp();
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
  });

  describe("contructor()", async function () {
    it("should BlindAuction initialize correctly.", async function () {
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

  describe("bid()", async function () {
    it("should bids stored bid data.", async function () {
      await initializeProccess(10, 10, ownerAddress);
      const bidid = ethers.utils.formatBytes32String("user1_bid1");
      await blindAuction.connect(user1).bid(bidid, { value: one_eth });

      const bidData = await blindAuction.bids(user1Address, 0);
      expect(bidData.blindedBid).to.equals(bidid);
      expect(bidData.deposit).to.equals(one_eth);
    });

    it("Revert when bid time ended.", async function () {
      await initializeProccess(10, 1, ownerAddress);
      const bid1 = ethers.utils.formatBytes32String("user1_bid1");
      await blindAuction.connect(user1).bid(bid1, { value: one_eth });

      await passBlocks(11);

      const bid2 = ethers.utils.formatBytes32String("user1_bid1");
      await expect(
        blindAuction.connect(user1).bid(bid2, { value: one_eth })
      ).to.revertedWith(`TooLate(${beginTime + biddingTime})`);
    });

  });

  describe("reveal()", async function () {
    const values_user1 = [one_eth.mul(1), one_eth.mul(2)]
    const values_user2 = [one_eth.mul(3), one_eth.mul(1)]
    const fakes_user1 = [true, false]
    const fakes_user2 = [false, true]
    const secrects_user1 = ["user1_bid1", "user1_bid2"]
    const secrects_user2 = ["user2_bid1", "user2_bid2"]
    
    const bid1 = packRevealParams(values_user1[0], fakes_user1[0], secrects_user1[0]);
    const bid2 = packRevealParams(values_user1[1], fakes_user1[1], secrects_user1[1]);
    const bid3 = packRevealParams(values_user2[0], fakes_user2[0], secrects_user2[0]);
    const bid4 = packRevealParams(values_user2[1], fakes_user2[1], secrects_user2[1]);
    console.log(bid1)

    beforeEach(async function() {
      await initializeProccess(10, 10, ownerAddress);
      await blindAuction.connect(user1).bid(bid1, { value:  values_user1[0]});
      await blindAuction.connect(user1).bid(bid2, { value: values_user1[1] });
      await blindAuction.connect(user2).bid(bid3, { value: values_user2[0] });
      await blindAuction.connect(user2).bid(bid4, { value: values_user2[1] });
    })

    it("Revert when bid is not ended", async function() {
      // await passBlocks(11);

      await expect(
        blindAuction.connect(user1).reveal(values_user1, fakes_user1, secrects_user1)
      ).to.revertedWith(`TooLate(${beginTime + biddingTime})`);
    })

  });
});
