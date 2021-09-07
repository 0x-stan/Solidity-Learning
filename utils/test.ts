import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-web3';

// @ts-ignore: Unreachable code error
import { ethers, web3 } from 'hardhat';
const { BigNumber } = ethers;

export async function getBlcokTimestamp() {
  const blockNumber = await ethers.provider.getBlockNumber();
  return (await ethers.provider.getBlock(blockNumber)).timestamp;
}

export async function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}

export async function advanceBlock() {
  return new Promise((resolve, reject) => {
    // evm_mine is a method of hardhat network
    // https://hardhat.org/hardhat-network/explanation/mining-modes.html#mining-modes
    web3.currentProvider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: new Date().getTime(),
      },
      (err: any, result: any) => {
        if (err) {
          return reject(err);
        }
        const newBlockHash = web3.eth.getBlock('latest').hash;

        return resolve(newBlockHash);
      }
    );
  });
}

export async function passBlocks(num: number) {
  if (num < 0) return;
  for (let i = 0; i < num; i++) {
    await advanceBlock();
  }
}

export function extendDecimals(num: number | string, decimals: number = 18) {
  let bi = BigNumber.from(num);
  return bi.mul(BigNumber.from(10).pow(decimals));
}
