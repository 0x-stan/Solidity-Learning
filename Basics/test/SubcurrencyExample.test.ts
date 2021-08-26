import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';

import { ethers } from 'hardhat';
import { Signer, Contract, BigNumber } from 'ethers';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';

chai.use(solidity);

const { expect } = chai;

describe('SubcurrencyExample', function () {
  let owner: Signer, user1: Signer, user2: Signer;
  let ownerAddress: string, user1Address: string, user2Address: string;
  let subcurrencyExample: Contract;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    const SubcurrencyExample = await ethers.getContractFactory(
      'SubcurrencyExample'
    );
    subcurrencyExample = await SubcurrencyExample.deploy();
    // await subcurrencyExample.deplyed();
  });

  it('should minter has getter function', async function () {
    console.log(Object.keys(subcurrencyExample));
    expect(typeof subcurrencyExample['minter()']).to.equals('function');
    expect(typeof subcurrencyExample['minter']).to.equals('function');
  });

  it('should balances has getter function too', async function () {
    expect(typeof subcurrencyExample['balances(address)']).to.equals(
      'function'
    );
    expect(typeof subcurrencyExample['balances']).to.equals('function');
  });

  it('should balances function can check balance of user, default 0', async function () {
    expect(await subcurrencyExample.balances(ownerAddress)).to.equals(0);
    expect(await subcurrencyExample.balances(user1Address)).to.equals(0);
    expect(await subcurrencyExample.balances(user2Address)).to.equals(0);
  });

  describe('should mint and send function working correctly', async function () {
    const amount = 100;
    const maxUint256 = BigNumber.from(2).pow(256).sub(1); // 2**256 - 1

    beforeEach(async function () {
      await subcurrencyExample.mint(ownerAddress, amount);
      await subcurrencyExample.mint(user1Address, amount);
    });

    it('should mint function can change balance of reciever', async function () {
      expect(await subcurrencyExample.balances(ownerAddress)).to.equals(amount);
      expect(await subcurrencyExample.balances(user1Address)).to.equals(amount);
    });

    it('should mint function can only be called by owner', async function () {
      await expect(
        subcurrencyExample.connect(user1Address).mint(user1Address, amount)
      ).to.be.reverted;
    });

    it('should mint(maxUint256) reverted', async function () {
      await expect(subcurrencyExample.mint(ownerAddress, maxUint256)).to.be
        .reverted;
    });

    it('should Send event can be listened', async function () {
      await expect(
        subcurrencyExample.connect(owner).send(user1Address, 10)
      )
        .to.emit(subcurrencyExample, 'Send')
        .withArgs(ownerAddress, user1Address, 10);
    });
  });
});
