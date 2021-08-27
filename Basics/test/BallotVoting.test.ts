import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';

import { ethers } from 'hardhat';
import { Signer, Contract, utils, BigNumber } from 'ethers';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';

chai.use(solidity);

const { expect } = chai;

const proposalNames = ['Alice', 'Bob', 'John'];
const constructorInputs = proposalNames.map((item) =>
  utils.formatBytes32String(item)
);
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const INIT_VOTER_STATE = {
  weight: BigNumber.from(0),
  voted: false,
  delegate: ZERO_ADDRESS,
  vote: BigNumber.from(0),
};

describe('BallotVoting', function () {
  let owner: Signer, user1: Signer, user2: Signer;
  let ownerAddress: string, user1Address: string, user2Address: string;
  let ballotVoting: Contract;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    const BallotVoting = await ethers.getContractFactory('BallotVoting');
    ballotVoting = await BallotVoting.deploy(constructorInputs);
  });

  it('should chairperson is owner', async function () {
    expect(await ballotVoting.chairperson()).to.equals(ownerAddress);
  });

  describe('giveRightToVote', async function () {
    it('should revert when caller is not onwer.', async function () {
      await expect(
        ballotVoting.connect(user1).giveRightToVote(user1Address)
      ).to.revertedWith('Only chairperson can give right to vote.');
    });

    it('should revert when voter already voted.', async function () {
      await ballotVoting.connect(owner).giveRightToVote(user1Address);
      await ballotVoting.connect(user1).vote(0);
      await expect(
        ballotVoting.connect(owner).giveRightToVote(user1Address)
      ).to.revertedWith('The voter already voted.');
    });

    it('check vote state before giveRightToVote', async function () {
      const voter1 = await ballotVoting.voters(user1Address);
      const { weight, voted, delegate, vote } = voter1;
      expect({ weight, voted, delegate, vote }).to.deep.equal(INIT_VOTER_STATE);
    });

    it('should voter.weight = 1 after giveRightToVote()', async function () {
      await ballotVoting.connect(owner).giveRightToVote(user1Address);
      const { weight, voted, delegate, vote } = await ballotVoting.voters(
        user1Address
      );
      expect({ weight, voted, delegate, vote }).to.deep.equal({
        ...INIT_VOTER_STATE,
        weight: BigNumber.from(1),
      });
    });
  });

  describe('delegate', async function () {
    beforeEach(async function () {
      await ballotVoting.giveRightToVote(user1Address);
      await ballotVoting.giveRightToVote(user2Address);
    });

    it('should revert when voter already voted.', async function () {
      await ballotVoting.connect(user1).vote(0);
      await expect(
        ballotVoting.connect(user1).delegate(ownerAddress)
      ).to.revertedWith('You already voted.');
    });

    it('should revert when voter delegate to himself.', async function () {
      await expect(
        ballotVoting.connect(user1).delegate(user1Address)
      ).to.revertedWith('Self-delegation is disallowed.');
    });

    it('should revert when loop in delegation.', async function () {
      // delegation: user1 -> user2 -> owner -> user1
      await ballotVoting.connect(user2).delegate(ownerAddress);
      await ballotVoting.connect(owner).delegate(user1Address);
      await expect(
        ballotVoting.connect(user1).delegate(user2Address)
      ).to.revertedWith('Found loop in delegation.');
    });

    it('should voted when delegate to a voted voter.', async function () {
      await ballotVoting.connect(user2).vote(0);
      await ballotVoting.connect(user1).delegate(user2Address);
      expect((await ballotVoting.proposals(0)).voteCount).to.equals(2);
    });

    it('should added weight when delegate to a unvoted voter.', async function () {
      await ballotVoting.connect(user1).delegate(user2Address);
      expect((await ballotVoting.voters(user2Address)).weight).to.equals(2);
    });
  });

  describe('vote', async function () {
    beforeEach(async function () {
      await ballotVoting.giveRightToVote(user1Address);
      // await ballotVoting.giveRightToVote(user2Address);
    });

    it('should revert when voter.weight = 0.', async function () {
      await expect(ballotVoting.connect(user2).vote(0)).to.revertedWith(
        'Has no right to vote'
      );
    });

    it('should revert when voter already voted.', async function () {
      await ballotVoting.connect(user1).vote(0);
      await expect(ballotVoting.connect(user1).vote(0)).to.revertedWith(
        'Already voted.'
      );
    });

    it('check voter and proposals state after vote().', async function () {
      const voteTarget = 0;
      await ballotVoting.connect(user1).vote(voteTarget);
      const { weight, voted, delegate, vote } = await ballotVoting.voters(
        user1Address
      );
      expect({ weight, voted, delegate, vote }).to.deep.equal({
        weight: BigNumber.from(1),
        voted: true,
        delegate: ZERO_ADDRESS,
        vote: BigNumber.from(voteTarget),
      });

      const { name, voteCount } = await ballotVoting.proposals(voteTarget);
      expect({ name, voteCount }).to.deep.equal({
        name: constructorInputs[voteTarget],
        voteCount: BigNumber.from(1),
      });

      expect(await ballotVoting.winningProposal()).to.equals(
        BigNumber.from(voteTarget)
      );
      expect(await ballotVoting.winnerName()).to.equals(name);
    });
  });
});
