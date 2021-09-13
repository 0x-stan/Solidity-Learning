import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";

import { ethers } from "hardhat";
import { Signer, Contract, utils, BigNumber } from "ethers";
const { keccak256, solidityPack, formatBytes32String, solidityKeccak256 } =
  utils;
import chai from "chai";
import { solidity } from "ethereum-waffle";

import {
  passBlocks,
  getBlcokTimestamp,
  GAS_PRICE,
  ONE_ETH,
  extendDecimals,
} from "../../utils";

chai.use(solidity);

const { expect } = chai;

const packRevealParams = (value: BigNumber, fake: boolean, secret: string) => {
  return solidityKeccak256(
    ["uint256", "bool", "bytes32"],
    [value.toString(), fake, secret]
  );
};

const values_user1 = [ONE_ETH.mul(1), ONE_ETH.mul(2)];
const values_user2 = [ONE_ETH.mul(3), ONE_ETH.mul(1)];
const fakes_user1 = [true, false];
const fakes_user2 = [false, true];
const secrects_user1 = [
  formatBytes32String("user1_bid1"),
  formatBytes32String("user1_bid2"),
];
const secrects_user2 = [
  formatBytes32String("user2_bid1"),
  formatBytes32String("user2_bid2"),
];

const bid1 = packRevealParams(
  values_user1[0],
  fakes_user1[0],
  secrects_user1[0]
);
const bid2 = packRevealParams(
  values_user1[1],
  fakes_user1[1],
  secrects_user1[1]
);
const bid3 = packRevealParams(
  values_user2[0],
  fakes_user2[0],
  secrects_user2[0]
);
const bid4 = packRevealParams(
  values_user2[1],
  fakes_user2[1],
  secrects_user2[1]
);

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

  describe("constructor()", async function () {
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
      await blindAuction.connect(user1).bid(bidid, { value: ONE_ETH });

      const bidData = await blindAuction.bids(user1Address, 0);
      expect(bidData.blindedBid).to.equals(bidid);
      expect(bidData.deposit).to.equals(ONE_ETH);
    });

    it("Revert when bid time ended.", async function () {
      await initializeProccess(10, 1, ownerAddress);
      const bid1 = ethers.utils.formatBytes32String("user1_bid1");
      await blindAuction.connect(user1).bid(bid1, { value: ONE_ETH });

      await passBlocks(11);

      const bid2 = ethers.utils.formatBytes32String("user1_bid1");
      await expect(
        blindAuction.connect(user1).bid(bid2, { value: ONE_ETH })
      ).to.revertedWith(`TooLate(${beginTime + biddingTime})`);
    });
  });

  describe("reveal()", async function () {
    beforeEach(async function () {
      await initializeProccess(10, 10, ownerAddress);
      await blindAuction.connect(user1).bid(bid1, { value: values_user1[0] });
      await blindAuction.connect(user1).bid(bid2, { value: values_user1[1] });
      await blindAuction.connect(user2).bid(bid3, { value: values_user2[0] });
      await blindAuction.connect(user2).bid(bid4, { value: values_user2[1] });
    });

    it("Revert when bid is not ended", async function () {
      await expect(
        blindAuction
          .connect(user1)
          .reveal(values_user1, fakes_user1, secrects_user1)
      ).to.revertedWith(`TooEarly(${beginTime + biddingTime})`);
    });

    it("Revert when reveal is ended", async function () {
      await passBlocks(10 + 10 + 1);

      await expect(
        blindAuction
          .connect(user1)
          .reveal(values_user1, fakes_user1, secrects_user1)
      ).to.revertedWith(`TooLate(${beginTime + biddingTime + revealTime})`);
    });

    it("Reveal() work correctly.", async function () {
      // all bids value has been sended to contract
      const balance_user1 = await user1.getBalance();
      const balance_user2 = await user2.getBalance();

      await passBlocks(10);

      const reveal_tx_1 = await blindAuction
        .connect(user1)
        .reveal(values_user1, fakes_user1, secrects_user1);
      const { gasUsed: gasUsed1 } = await reveal_tx_1.wait();
      const reveal_tx_2 = await blindAuction
        .connect(user2)
        .reveal(values_user2, fakes_user2, secrects_user2);
      const { gasUsed: gasUsed2 } = await reveal_tx_2.wait();

      // user has received fake bid value
      expect(
        balance_user1.sub(gasUsed1.mul(GAS_PRICE)).add(values_user1[0])
      ).to.equals(await user1.getBalance());

      expect(
        balance_user2.sub(gasUsed2.mul(GAS_PRICE)).add(values_user2[1])
      ).to.equals(await user2.getBalance());
    });
  });

  describe("auctionEnd() and withdraw()", async function () {
    beforeEach(async function () {
      await initializeProccess(10, 10, ownerAddress);
      await blindAuction.connect(user1).bid(bid1, { value: values_user1[0] });
      await blindAuction.connect(user1).bid(bid2, { value: values_user1[1] });
      await blindAuction.connect(user2).bid(bid3, { value: values_user2[0] });
      await blindAuction.connect(user2).bid(bid4, { value: values_user2[1] });

      await passBlocks(10);

      const reveal_tx_1 = await blindAuction
        .connect(user1)
        .reveal(values_user1, fakes_user1, secrects_user1);
      await reveal_tx_1.wait();
      const reveal_tx_2 = await blindAuction
        .connect(user2)
        .reveal(values_user2, fakes_user2, secrects_user2);
      await reveal_tx_2.wait();

      await passBlocks(10 + 1);
    });

    it("Should beneficiary received true bid value after auctionEnd().", async function () {
      const balance_owner = await owner.getBalance();

      const auctionEnd_tx = await blindAuction.connect(owner).auctionEnd();
      const { gasUsed } = await auctionEnd_tx.wait();

      expect(
        balance_owner.sub(gasUsed.mul(GAS_PRICE)).add(values_user2[0])
      ).to.equals(await owner.getBalance());
    });

    it("Should user1 received overbid value after withdraw()", async function () {
      await blindAuction.connect(owner).auctionEnd();

      const balance_user1 = await user1.getBalance();

      const withdraw_tx = await blindAuction.connect(user1).withdraw();
      const { gasUsed } = await withdraw_tx.wait();

      expect(
        balance_user1.sub(gasUsed.mul(GAS_PRICE)).add(values_user1[1])
      ).to.equals(await user1.getBalance());

    });
  });
});
