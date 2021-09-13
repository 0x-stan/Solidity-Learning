import { ethers } from 'ethers'
import * as fs from 'fs';
import { TEST_ACCOUNTS_PRIVATES, GAS_PRICE, ONE_ETH } from './utils/constants'

function createAndSavePrivates() {
  
  const createRandom = ethers.Wallet.createRandom
    let str = `${TEST_ACCOUNTS_PRIVATES}=`
    for (let i = 0; i < 3; i++) {
      str += `${createRandom().privateKey},`
    }
    str = str.replace(/\,$/, '')
    fs.writeFileSync('.env', str, { flag: 'w' })
}

async function main() {
  if (!process.env[`${TEST_ACCOUNTS_PRIVATES}`]) {
    createAndSavePrivates()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });