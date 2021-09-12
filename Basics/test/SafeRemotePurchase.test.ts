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

describe("SafeRemotePurchase", function () {
  let owner: Signer, user1: Signer, user2: Signer;
  let ownerAddress: string, user1Address: string, user2Address: string;
  let safeRemotePurchase: Contract;

  async function initializeProccess(value: BigNumber) {
    const SafeRemotePurchase = await ethers.getContractFactory(
      "SafeRemotePurchase"
    );
    safeRemotePurchase = await SafeRemotePurchase.deploy({ value });
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
  });

  describe("constructor()", async function () {
    it("Revert init with an odd number value", async function () {
      await expect(initializeProccess(one_eth.add(1))).to.revertedWith(
        "ValueNotEven()"
      );
    });

    it("should SafeRemotePurchase initialize correctly.", async function () {
      await initializeProccess(one_eth.mul(2));
      expect(await safeRemotePurchase.value()).to.equals(one_eth);
    });
  });

  describe("abort()", async function () {
    it("should seller can reclaim his ether by abort().", async function () {
      await initializeProccess(one_eth.mul(2));

      const balance_1 = await owner.getBalance();
      const tx = await safeRemotePurchase.abort();
      const { gasUsed } = await tx.wait();

      expect(
        balance_1.sub(gasUsed.mul(GAS_PRICE)).add(one_eth.mul(2))
      ).to.equals(await owner.getBalance());
    });

    it("Revert when buyer has confirmed.", async function () {
      await initializeProccess(one_eth.mul(2));
      await safeRemotePurchase
        .connect(user1)
        .confirmPurchase({ value: one_eth.mul(2) });
      await expect(safeRemotePurchase.connect(owner).abort()).to.be.reverted;
    });
  });

  describe("confirmPurchase()", async function () {
    it("should seller can reclaim his ether by abort().", async function () {
      await initializeProccess(one_eth.mul(2));

      const balance_1 = await owner.getBalance();
      const tx = await safeRemotePurchase.abort();
      const { gasUsed } = await tx.wait();

      // state = Inactive
      expect(await safeRemotePurchase.state()).to.equals(3);
      expect(
        balance_1.sub(gasUsed.mul(GAS_PRICE)).add(one_eth.mul(2))
      ).to.equals(await owner.getBalance());
    });

    it("Revert when buyer has confirmed.", async function () {
      await initializeProccess(one_eth.mul(2));
      await safeRemotePurchase
        .connect(user1)
        .confirmPurchase({ value: one_eth.mul(2) });
      await expect(safeRemotePurchase.connect(owner).abort()).to.be.reverted;
    });
  });

  describe("confirmReceived()", async function () {
    it("Should release the locked ehter.", async function () {
      await initializeProccess(one_eth.mul(2));

      await safeRemotePurchase
        .connect(user1)
        .confirmPurchase({ value: one_eth.mul(2) });

      const balance_1 = await user1.getBalance();
      const tx = await safeRemotePurchase.connect(user1).confirmReceived();
      const { gasUsed } = await tx.wait();

      expect(await safeRemotePurchase.state()).to.equals(2);
      expect(
        balance_1.sub(gasUsed.mul(GAS_PRICE)).add(one_eth.mul(1))
      ).to.equals(await user1.getBalance());
    });

    it("Revert when buyer has confirmed.", async function () {
      await initializeProccess(one_eth.mul(2));

      await safeRemotePurchase
        .connect(user1)
        .confirmPurchase({ value: one_eth.mul(2) });

      await safeRemotePurchase.connect(user1).confirmReceived();

      await expect(
        safeRemotePurchase.connect(user1).confirmReceived()
      ).to.be.revertedWith("InvalidState()");

      await expect(
        safeRemotePurchase.connect(user2).confirmReceived()
      ).to.be.revertedWith("OnlyBuyer()");
    });
  });

  describe("refundSeller()", async function () {
    it("Should pays back the locked funds of the seller (3 * value).", async function () {
      await initializeProccess(one_eth.mul(2));

      await safeRemotePurchase
        .connect(user1)
        .confirmPurchase({ value: one_eth.mul(2) });

      await safeRemotePurchase.connect(user1).confirmReceived();

      const balance_1 = await owner.getBalance();
      const tx = await safeRemotePurchase.connect(owner).refundSeller();
      const { gasUsed } = await tx.wait()

      expect(await safeRemotePurchase.state()).to.equals(3);
      expect(
        balance_1.sub(gasUsed.mul(GAS_PRICE)).add(one_eth.mul(3))
      ).to.equals(await owner.getBalance());
    });

  });
});
