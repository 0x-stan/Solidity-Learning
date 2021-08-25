import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'

import { run, ethers } from 'hardhat'
import type { Signer, Contract } from 'ethers'
import { expect } from 'chai'

describe('SimpleStorage', function () {
  let owner: Signer, user1: Signer, user2: Signer
  let simpleStorage: Contract

  beforeEach(async function () {
    ;[owner, user1, user2] = await ethers.getSigners()
    const SimpleStorage = await ethers.getContractFactory('SimpleStorage')
    simpleStorage = await SimpleStorage.deploy()
    // await simpleStorage.deplyed();
  })

  it('should has variable storedData not exits (private)', async function () {
    expect(simpleStorage.storedData).to.be.an('undefined')
  })

  it('should storedData equls 0, before set', async function () {
    expect(await simpleStorage.get()).to.equal(0)
  })

  it('should storedData equls 2, after set 2', async function () {
    await simpleStorage.set(2)
    expect(await simpleStorage.get()).to.equal(2)
  })
})
