import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";

// @ts-ignore: Unreachable code error
import { run, ethers, web3 } from "hardhat";
import type { Signer, Contract } from "ethers";
import { expect } from "chai";

import { GAS_PRICE, ONE_ETH } from "../../utils";

describe("ReceiverPays", function () {
  let Alice: Signer, Bob: Signer;
  let AliceAddress: string, BobAddress: string;
  let receiverPays: Contract;

  beforeEach(async function () {
    [Alice, Bob] = await ethers.getSigners();
    AliceAddress = await Alice.getAddress();
    BobAddress = await Bob.getAddress();
    const ReceiverPays = await ethers.getContractFactory("ReceiverPays");
    receiverPays = await ReceiverPays.deploy({ value: ONE_ETH });
    // await receiverPays.deplyed();
  });

  describe("shutdown()", async function () {
    it("Revert when caller is not Alice.", async function () {
      await expect(receiverPays.connect(Bob).shutdown()).to.reverted;
    });

    it("Should contract selfdestruct and relaim eth leftover funds after shutdown().", async function () {
      const balance_1 = await Alice.getBalance();

      const tx = await receiverPays.connect(Alice).shutdown();
      const { gasUsed } = await tx.wait();

      expect(balance_1.sub(gasUsed.mul(GAS_PRICE)).add(ONE_ETH)).to.equals(
        await Alice.getBalance()
      );
    });
  });
});
