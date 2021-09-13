import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-web3';
import dotenv from 'dotenv';
import { TEST_ACCOUNTS_PRIVATES, GAS_PRICE, ONE_ETH } from './utils/constants'
import { subtask, task } from 'hardhat/config';
import { TASK_TEST } from 'hardhat/builtin-tasks/task-names';
import * as path from 'path';
import glob from 'glob';

dotenv.config();

async function getTestFiles(partName: string) {
  return new Promise((resolve, reject) => {
    glob(path.join(partName, 'test/*.test.ts'), function (err, files) {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
    });
  });
}

function getAccounts() {
  const privates = (process.env[`${TEST_ACCOUNTS_PRIVATES}`] as string).split(',') as string[]
  return privates.map(_p => {
    return {
      privateKey: _p,
      balance: ONE_ETH.mul(100).toString()
    }
  })
}

// 针对章节测试
task('testpart', 'test a part')
  .addOptionalParam('name')
  .setAction(async (args, hre) => {
    const files = await getTestFiles(args.name);
    console.log('testFiles: ', files);

    await hre.run(TASK_TEST, {
      testFiles: files,
    });
  });


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
// console.log((process.env[`${TEST_ACCOUNTS_PRIVATES}`] as string).split(','))

export default {
  solidity: '0.8.7',
  paths: {
    sources: './*/contracts',
    tests: './*/test',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {
      gasPrice: GAS_PRICE.toNumber(),   //  to calc gasUsed need a fixed value.
      accounts: getAccounts()
    },
  },
};
