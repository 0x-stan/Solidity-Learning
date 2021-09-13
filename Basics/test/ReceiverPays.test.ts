import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";

// @ts-ignore: Unreachable code error
import { run, ethers, web3 } from "hardhat";
import type { Signer, Contract } from "ethers";
import { expect } from "chai";

import { GAS_PRICE, ONE_ETH } from "../../utils";

const { solidityKeccak256, solidityPack, keccak256, hashMessage } =
  ethers.utils;

const init_money = ONE_ETH.mul(10);
describe("ReceiverPays", function () {
  let Alice: Signer, Bob: Signer;
  let AliceAddress: string, BobAddress: string;
  let receiverPays: Contract;

  beforeEach(async function () {
    [Alice, Bob] = await ethers.getSigners();
    AliceAddress = await Alice.getAddress();
    BobAddress = await Bob.getAddress();
    const ReceiverPays = await ethers.getContractFactory("ReceiverPays");
    receiverPays = await ReceiverPays.deploy({ value: init_money });
  });

  describe("shutdown()", async function () {
    it("Revert when caller is not Alice.", async function () {
      await expect(receiverPays.connect(Bob).shutdown()).to.reverted;
    });

    it("Should contract selfdestruct and relaim eth leftover funds after shutdown().", async function () {
      const balance_1 = await Alice.getBalance();

      const tx = await receiverPays.connect(Alice).shutdown();
      const { gasUsed } = await tx.wait();

      expect(balance_1.sub(gasUsed.mul(GAS_PRICE)).add(init_money)).to.equals(
        await Alice.getBalance()
      );
    });
  });

  describe("claimPayment()", async function () {
    it("Should Bob can receive money by Alice's signature.", async function () {
      const message = hashMessage(
        solidityPack(
          ["address", "uint256", "uint256", "address"],
          [BobAddress, ONE_ETH, 1, receiverPays.address]
        )
      );
      const signature = await Alice.signMessage(message);

      const balance_1 = await Bob.getBalance();

      const tx = await receiverPays
        .connect(Bob)
        .claimPayment(ONE_ETH, 1, signature);
      const { gasUsed, events } = await tx.wait();
      console.log(message);
      console.log(await events[0].decode(events[0].data));

      expect(balance_1.sub(gasUsed.mul(GAS_PRICE)).add(ONE_ETH)).to.equals(
        await Bob.getBalance()
      );
    });
  });
});
