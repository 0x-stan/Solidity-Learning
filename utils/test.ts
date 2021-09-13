import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";

// @ts-ignore: Unreachable code error
import { ethers, web3 } from "hardhat";

const provider = ethers.provider;

export async function getBlcokTimestamp() {
  const blockNumber = await provider.getBlockNumber();
  return (await provider.getBlock(blockNumber)).timestamp;
}

export async function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}

export async function advanceBlock() {
  // evm_mine is a method of hardhat network
  // https://hardhat.org/hardhat-network/explanation/mining-modes.html#mining-modes
  return provider.send("evm_mine", []);
}

export async function passBlocks(num: number) {
  if (num < 0) return;
  for (let i = 0; i < num; i++) {
    await advanceBlock();
  }
}

