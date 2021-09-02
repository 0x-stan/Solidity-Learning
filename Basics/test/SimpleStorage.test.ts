import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-web3';

// @ts-ignore: Unreachable code error
import { run, ethers, web3 } from 'hardhat';
import type { Signer, Contract } from 'ethers';
import { expect } from 'chai';

describe('SimpleStorage', function () {
  let owner: Signer, user1: Signer, user2: Signer;
  let simpleStorage: Contract;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const SimpleStorage = await ethers.getContractFactory('SimpleStorage');
    simpleStorage = await SimpleStorage.deploy();
    // await simpleStorage.deplyed();
  });

  it("should storedDatas not exits , cause it's not a public variable", async function () {
    expect(simpleStorage.storedData).to.be.an('undefined');
  });

  it('should storedData equls 0, before set', async function () {
    expect(await simpleStorage.get()).to.equal(0);
  });

  it('should storedData equls 2, after set 2', async function () {
    await simpleStorage.set(2);
    expect(await simpleStorage.get()).to.equal(2);
  });

  it('should anyone can change the value of storedData', async function () {
    await simpleStorage.connect(user1).set(1);
    expect(await simpleStorage.get()).to.equal(1);
    await simpleStorage.connect(user2).set(2);
    expect(await simpleStorage.get()).to.equal(2);
  });

  it('test ethers.staticCall', async function () {
    await simpleStorage.connect(user1).callStatic.set(1);
    expect(await simpleStorage.get()).to.equal(0);
  });

  it('test web3.call set()', async function () {
    const { abi } = require("../../artifacts/Basics/contracts/SimpleStorage.sol/SimpleStorage.json")
    const web3Contract = new web3.eth.Contract(abi, simpleStorage.address)
    const getRes = await web3Contract.methods.get().call()
    expect(getRes).to.equals('0')
  });
});
