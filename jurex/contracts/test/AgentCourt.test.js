const { expect } = require('chai');
const { ethers }  = require('hardhat');

describe('Jurex Network — Agent Court', function () {
  let registry, factory, jrxToken;
  let owner, plaintiff, defendant, judge1, judge2, judge3, judge4;

  const BASE_FEE     = ethers.parseEther('0.001');
  const INITIAL_REP  = 100n;
  const JUDGE_STAKE  = ethers.parseEther('1000'); // JUDGE_STAKE_MIN

  // ─────────────────────────────────────────
  // Setup
  // ─────────────────────────────────────────
  beforeEach(async function () {
    [owner, plaintiff, defendant, judge1, judge2, judge3, judge4] = await ethers.getSigners();

    // Deploy contracts
    const JRXToken           = await ethers.getContractFactory('JRXToken');
    const CourtRegistry      = await ethers.getContractFactory('CourtRegistry');
    const CourtCaseFactory   = await ethers.getContractFactory('CourtCaseFactory');

    jrxToken  = await JRXToken.deploy();
    registry  = await CourtRegistry.deploy();
    factory   = await CourtCaseFactory.deploy(await registry.getAddress());

    // Link factory + JRX + treasury
    await registry.setCourtCaseFactory(await factory.getAddress());
    await registry.setJRXToken(await jrxToken.getAddress());
    await registry.setTreasury(owner.address);

    // Register all participants
    for (const p of [plaintiff, defendant, judge1, judge2, judge3, judge4]) {
      await registry.registerAgent(p.address, ethers.keccak256(ethers.toUtf8Bytes(p.address)));
    }

    // Mint JRX and stake for judges so they enter the eligible pool
    for (const judge of [judge1, judge2, judge3, judge4]) {
      await jrxToken.mint(judge.address, JUDGE_STAKE);
      await jrxToken.connect(judge).approve(await registry.getAddress(), JUDGE_STAKE);
      await registry.connect(judge).stakeAsJudge(JUDGE_STAKE);
    }
  });

  // ─────────────────────────────────────────
  // CourtRegistry — core
  // ─────────────────────────────────────────
  describe('CourtRegistry — registration', function () {
    it('registers an agent with initial reputation of 100', async function () {
      expect(await registry.getReputation(plaintiff.address)).to.equal(INITIAL_REP);
      expect(await registry.isRisky(plaintiff.address)).to.be.false;
      expect(await registry.isBlacklisted(plaintiff.address)).to.be.false;
    });

    it('rejects double registration', async function () {
      await expect(
        registry.registerAgent(plaintiff.address, ethers.keccak256(ethers.toUtf8Bytes('dup')))
      ).to.be.revertedWith('Already registered');
    });

    it('returns correct profile fields', async function () {
      const profile = await registry.getAgentProfile(plaintiff.address);
      expect(profile.reputationScore).to.equal(INITIAL_REP);
      expect(profile.casesWon).to.equal(0n);
      expect(profile.casesLost).to.equal(0n);
      expect(profile.noShows).to.equal(0n);
      expect(profile.isRegistered).to.be.true;
    });

    it('selfRegister creates an agent with deterministic erc8004Id', async function () {
      const [, , , , , , , stranger] = await ethers.getSigners();
      await registry.connect(stranger).selfRegister();
      const profile = await registry.getAgentProfile(stranger.address);
      expect(profile.isRegistered).to.be.true;
      expect(profile.reputationScore).to.equal(INITIAL_REP);
      expect(profile.erc8004Id).to.not.equal(ethers.ZeroHash);
    });

    it('selfRegister rejects if already registered', async function () {
      const [, , , , , , , stranger] = await ethers.getSigners();
      await registry.connect(stranger).selfRegister();
      await expect(registry.connect(stranger).selfRegister()).to.be.revertedWith('Already registered');
    });

    it('getRegisteredAgentsCount tracks all registrations', async function () {
      expect(await registry.getRegisteredAgentsCount()).to.equal(6n);
    });
  });

  // ─────────────────────────────────────────
  // CourtRegistry — ERC-8004 Reputation Registry
  // ─────────────────────────────────────────
  describe('CourtRegistry — ERC-8004', function () {
    beforeEach(async function () {
      // Authorize owner as courtHook so tests can call giveFeedback directly
      await registry.setCourtHook(owner.address);
    });

    it('setCourtHook sets the authorized hook address', async function () {
      expect(await registry.courtHook()).to.equal(owner.address);
    });

    it('setCourtHook reverts for non-owner', async function () {
      await expect(registry.connect(plaintiff).setCourtHook(plaintiff.address))
        .to.be.revertedWithCustomError(registry, 'OwnableUnauthorizedAccount');
    });

    it('giveFeedback records a signal and emits FeedbackGiven', async function () {
      const agentId = BigInt(plaintiff.address);
      await expect(
        registry.giveFeedback(agentId, 'dispute', 'won', ethers.parseEther('15'), 'QmEvidence')
      ).to.emit(registry, 'FeedbackGiven')
        .withArgs(agentId, owner.address, 'dispute', 'won', ethers.parseEther('15'), 'QmEvidence');
    });

    it('readFeedback returns the stored signal', async function () {
      const agentId = BigInt(plaintiff.address);
      await registry.giveFeedback(agentId, 'job', 'completed', ethers.parseEther('5'), 'QmABC');
      const [value, tag1, tag2, evidence] = await registry.readFeedback(agentId, owner.address, 0);
      expect(value).to.equal(ethers.parseEther('5'));
      expect(tag1).to.equal('job');
      expect(tag2).to.equal('completed');
      expect(evidence).to.equal('QmABC');
    });

    it('getSummary with client filter aggregates signals', async function () {
      const agentId = BigInt(plaintiff.address);
      await registry.giveFeedback(agentId, 'dispute', 'won',  ethers.parseEther('15'), '');
      await registry.giveFeedback(agentId, 'dispute', 'lost', ethers.parseEther('-15'), '');
      const [score, count] = await registry.getSummary(agentId, [owner.address], '', '');
      expect(score).to.equal(0n); // +15 - 15 = 0
      expect(count).to.equal(2n);
    });

    it('getSummary with tag filter only counts matching signals', async function () {
      const agentId = BigInt(plaintiff.address);
      await registry.giveFeedback(agentId, 'dispute', 'won',  ethers.parseEther('15'), '');
      await registry.giveFeedback(agentId, 'job',     'completed', ethers.parseEther('5'), '');
      const [score, count] = await registry.getSummary(agentId, [owner.address], 'dispute', '');
      expect(count).to.equal(1n);
      expect(score).to.equal(ethers.parseEther('15'));
    });

    it('getSummary with no client filter returns on-chain reputation score', async function () {
      const agentId = BigInt(plaintiff.address);
      const [score, count] = await registry.getSummary(agentId, [], '', '');
      expect(score).to.equal(INITIAL_REP);
    });

    it('revokeFeedback marks signal as revoked and emits FeedbackRevoked', async function () {
      const agentId = BigInt(plaintiff.address);
      await registry.giveFeedback(agentId, 'dispute', 'won', ethers.parseEther('15'), '');
      await expect(registry.revokeFeedback(agentId, 0))
        .to.emit(registry, 'FeedbackRevoked')
        .withArgs(agentId, owner.address, 0n);
      await expect(registry.readFeedback(agentId, owner.address, 0))
        .to.be.revertedWith('Feedback revoked');
    });

    it('revokeFeedback reverts on double revoke', async function () {
      const agentId = BigInt(plaintiff.address);
      await registry.giveFeedback(agentId, 'dispute', 'won', ethers.parseEther('15'), '');
      await registry.revokeFeedback(agentId, 0);
      await expect(registry.revokeFeedback(agentId, 0)).to.be.revertedWith('Already revoked');
    });

    it('giveFeedback reverts when called by unauthorized address', async function () {
      const agentId = BigInt(plaintiff.address);
      await expect(
        registry.connect(plaintiff).giveFeedback(agentId, 'dispute', 'won', 15n, '')
      ).to.be.revertedWith('Only factory, case, or hook');
    });
  });

  // ─────────────────────────────────────────
  // JRX Judge Staking
  // ─────────────────────────────────────────
  describe('JRX Judge Staking', function () {
    it('stakeAsJudge adds judge to the eligible pool', async function () {
      // judge1–4 already staked in beforeEach
      expect(await registry.getJudgePoolSize()).to.equal(4n);
    });

    it('judgeStakes tracks individual stake amount', async function () {
      expect(await registry.judgeStakes(judge1.address)).to.equal(JUDGE_STAKE);
    });

    it('unstakeJudge removes judge from pool and returns tokens', async function () {
      const balBefore = await jrxToken.balanceOf(judge1.address);
      await registry.connect(judge1).unstakeJudge();
      expect(await registry.getJudgePoolSize()).to.equal(3n);
      expect(await registry.judgeStakes(judge1.address)).to.equal(0n);
      const balAfter = await jrxToken.balanceOf(judge1.address);
      expect(balAfter - balBefore).to.equal(JUDGE_STAKE);
    });

    it('slashJudge reduces stake and removes from pool if below minimum', async function () {
      // Set treasury and give registry approval for slash
      // Slash small amounts 10x to drop below JUDGE_STAKE_MIN (1000 JRX)
      // SLASH_AMOUNT = 100 JRX; need to loop to drop below 1000
      // Actually one slash does: 1000 - 100 = 900 < 1000 → removed from pool
      await registry.setCourtHook(owner.address); // authorize owner as hook to call slash
      // slashJudge is onlyFactoryOrCase; authorize owner as hook (already done above)
      // Actually slashJudge uses onlyFactoryOrCase, and now courtHook is included
      await registry.slashJudge(judge1.address);
      expect(await registry.judgeStakes(judge1.address)).to.equal(JUDGE_STAKE - ethers.parseEther('100'));
      // Fell below JUDGE_STAKE_MIN → removed from pool
      expect(await registry.getJudgePoolSize()).to.equal(3n);
    });
  });

  // ─────────────────────────────────────────
  // Case filing helpers
  // ─────────────────────────────────────────
  async function fileCase() {
    const tx = await factory.connect(plaintiff).fileNewCase(
      defendant.address,
      'Service not delivered as promised',
      'QmEvidence123abc',
      { value: BASE_FEE * 2n }
    );
    const receipt    = await tx.wait();
    const event      = receipt.logs.find(l => l.fragment?.name === 'CaseCreated');
    const caseAddress = event.args.caseAddress;
    const CourtCase  = await ethers.getContractFactory('CourtCase');
    return CourtCase.attach(caseAddress);
  }

  // ─────────────────────────────────────────
  // CourtCase — lifecycle
  // ─────────────────────────────────────────
  describe('CourtCase — lifecycle', function () {
    it('files a case with correct state and stakes', async function () {
      const courtCase = await fileCase();
      expect(await courtCase.plaintiff()).to.equal(plaintiff.address);
      expect(await courtCase.defendant()).to.equal(defendant.address);
      expect(await courtCase.plaintiffStake()).to.equal(BASE_FEE * 2n);
      expect(await courtCase.state()).to.equal(1); // Summoned
    });

    it('rejects wrong stake amount when filing', async function () {
      await expect(
        factory.connect(plaintiff).fileNewCase(
          defendant.address, 'claim', 'QmHash', { value: BASE_FEE }
        )
      ).to.be.revertedWith('Must stake 2x base fee (0.002 ETH)');
    });

    it('allows defendant to respond with correct stake', async function () {
      const courtCase = await fileCase();
      await courtCase.connect(defendant).respondToCase({ value: BASE_FEE });
      expect(await courtCase.defendantStake()).to.equal(BASE_FEE);
      expect(await courtCase.state()).to.equal(2); // Active
    });

    it('rejects defendant response with wrong stake', async function () {
      const courtCase = await fileCase();
      await expect(
        courtCase.connect(defendant).respondToCase({ value: BASE_FEE * 2n })
      ).to.be.revertedWith('Must stake 1x base fee (0.001 ETH)');
    });

    it('rejects evidence submission after judges assigned', async function () {
      const courtCase = await fileCase();
      await courtCase.connect(defendant).respondToCase({ value: BASE_FEE });
      await factory.assignJudgesToCase(await courtCase.getAddress());
      await expect(
        courtCase.connect(plaintiff).submitEvidence('QmNewEvidence')
      ).to.be.revertedWith('Action not allowed in current state');
    });

    it('defaults if defendant misses the response deadline', async function () {
      const courtCase = await fileCase();

      await ethers.provider.send('evm_increaseTime', [48 * 3600 + 1]);
      await ethers.provider.send('evm_mine');

      await courtCase.missedDeadline();

      expect(await courtCase.state()).to.equal(6); // Defaulted
      expect(await courtCase.plaintiffWins()).to.be.true;

      const profile = await registry.getAgentProfile(defendant.address);
      expect(profile.noShows).to.equal(1n);
      expect(profile.reputationScore).to.equal(80n); // 100 - 20 penalty
    });
  });

  // ─────────────────────────────────────────
  // CourtCase — voting flow
  // ─────────────────────────────────────────
  describe('CourtCase — voting flow', function () {
    let courtCase;
    let assignedJudges;

    beforeEach(async function () {
      courtCase = await fileCase();
      await courtCase.connect(defendant).respondToCase({ value: BASE_FEE });
      await factory.assignJudgesToCase(await courtCase.getAddress());

      assignedJudges = [];
      for (let i = 0; i < 3; i++) {
        assignedJudges.push(await courtCase.judges(i));
      }
    });

    it('moves to Deliberating state after judge assignment', async function () {
      expect(await courtCase.state()).to.equal(3); // Deliberating
      expect(await courtCase.deadlineToVote()).to.be.gt(0n);
    });

    it('resolves plaintiff win on 2/3 majority', async function () {
      const judgeSigners = [judge1, judge2, judge3, judge4].filter(
        s => assignedJudges.includes(s.address)
      );
      expect(judgeSigners.length).to.be.gte(2);

      const plaintiffBalBefore = await ethers.provider.getBalance(plaintiff.address);

      await courtCase.connect(judgeSigners[0]).submitVote(true);
      await courtCase.connect(judgeSigners[1]).submitVote(true);

      expect(await courtCase.state()).to.equal(4); // Resolved
      expect(await courtCase.plaintiffWins()).to.be.true;

      const pProfile = await registry.getAgentProfile(plaintiff.address);
      expect(pProfile.reputationScore).to.equal(115n); // 100 + 15

      const dProfile = await registry.getAgentProfile(defendant.address);
      expect(dProfile.reputationScore).to.equal(85n); // 100 - 15

      expect(await ethers.provider.getBalance(plaintiff.address)).to.be.gt(plaintiffBalBefore);
    });

    it('resolves defendant win on 2/3 majority', async function () {
      const judgeSigners = [judge1, judge2, judge3, judge4].filter(
        s => assignedJudges.includes(s.address)
      );
      expect(judgeSigners.length).to.be.gte(2);

      await courtCase.connect(judgeSigners[0]).submitVote(false);
      await courtCase.connect(judgeSigners[1]).submitVote(false);

      expect(await courtCase.state()).to.equal(4); // Resolved
      expect(await courtCase.plaintiffWins()).to.be.false;

      const dProfile = await registry.getAgentProfile(defendant.address);
      expect(dProfile.reputationScore).to.equal(110n); // 100 + 10
    });

    it('rejects vote after deadline', async function () {
      const judgeSigners = [judge1, judge2, judge3, judge4].filter(
        s => assignedJudges.includes(s.address)
      );

      await ethers.provider.send('evm_increaseTime', [7 * 24 * 3600 + 1]);
      await ethers.provider.send('evm_mine');

      await expect(
        courtCase.connect(judgeSigners[0]).submitVote(true)
      ).to.be.revertedWith('Voting deadline has passed');
    });

    it('resolves via deadline when no majority reached', async function () {
      const judgeSigners = [judge1, judge2, judge3, judge4].filter(
        s => assignedJudges.includes(s.address)
      );
      expect(judgeSigners.length).to.be.gte(1);

      await courtCase.connect(judgeSigners[0]).submitVote(true);

      await ethers.provider.send('evm_increaseTime', [7 * 24 * 3600 + 1]);
      await ethers.provider.send('evm_mine');

      await courtCase.resolveAfterDeadline();

      expect(await courtCase.state()).to.equal(4); // Resolved
      expect(await courtCase.plaintiffWins()).to.be.true;
    });

    it('rejects double vote from same judge', async function () {
      const judgeSigners = [judge1, judge2, judge3, judge4].filter(
        s => assignedJudges.includes(s.address)
      );

      await courtCase.connect(judgeSigners[0]).submitVote(true);
      await expect(
        courtCase.connect(judgeSigners[0]).submitVote(false)
      ).to.be.revertedWith('Already voted');
    });

    it('rejects vote from non-judge', async function () {
      await expect(
        courtCase.connect(owner).submitVote(true)
      ).to.be.revertedWith('Not an assigned judge');
    });
  });

  // ─────────────────────────────────────────
  // Reputation thresholds
  // ─────────────────────────────────────────
  describe('Reputation thresholds', function () {
    it('registered agent with score 100 is not risky', async function () {
      expect(await registry.isRisky(plaintiff.address)).to.be.false;
      expect(await registry.RISKY_THRESHOLD()).to.equal(70n);
    });

    it('registered agent with score 100 is not blacklisted', async function () {
      expect(await registry.isBlacklisted(plaintiff.address)).to.be.false;
      expect(await registry.BLACKLIST_THRESHOLD()).to.equal(50n);
    });

    it('unregistered address is not risky (score defaults to 0 but isRegistered is false)', async function () {
      const stranger = ethers.Wallet.createRandom().address;
      expect(await registry.isRisky(stranger)).to.be.false;
    });

    it('unregistered address is not blacklisted (score defaults to 0 but isRegistered is false)', async function () {
      const stranger = ethers.Wallet.createRandom().address;
      expect(await registry.isBlacklisted(stranger)).to.be.false;
    });

    it('registered agent whose score drops below 70 is risky', async function () {
      // Temporarily impersonate the factory so updateReputation passes onlyFactoryOrCase
      await registry.setCourtCaseFactory(owner.address);
      for (let i = 0; i < 31; i++) {
        await registry.updateReputation(plaintiff.address, -1n, 'test');
      }
      expect(await registry.getReputation(plaintiff.address)).to.equal(69n);
      expect(await registry.isRisky(plaintiff.address)).to.be.true;
      expect(await registry.isBlacklisted(plaintiff.address)).to.be.false;
    });

    it('registered agent whose score drops below 50 is blacklisted', async function () {
      await registry.setCourtCaseFactory(owner.address);
      for (let i = 0; i < 51; i++) {
        await registry.updateReputation(plaintiff.address, -1n, 'test');
      }
      expect(await registry.getReputation(plaintiff.address)).to.equal(49n);
      expect(await registry.isBlacklisted(plaintiff.address)).to.be.true;
    });
  });

  // ─────────────────────────────────────────
  // Factory pause
  // ─────────────────────────────────────────
  describe('Factory pause', function () {
    it('owner can pause and unpause', async function () {
      await factory.pause();
      await expect(
        factory.connect(plaintiff).fileNewCase(
          defendant.address, 'claim', 'QmHash', { value: BASE_FEE * 2n }
        )
      ).to.be.revertedWithCustomError(factory, 'EnforcedPause');

      await factory.unpause();
      await factory.connect(plaintiff).fileNewCase(
        defendant.address, 'claim', 'QmHash', { value: BASE_FEE * 2n }
      );
    });
  });

  // ─────────────────────────────────────────
  // AgentCourtHook — ERC-8183
  // ─────────────────────────────────────────
  describe('AgentCourtHook — ERC-8183', function () {
    let hook, mockACP;
    const COMPLETE_SELECTOR = ethers.id('complete(uint256)').slice(0, 10);
    const REJECT_SELECTOR   = ethers.id('reject(uint256)').slice(0, 10);
    const JOB_ID = 1n;

    beforeEach(async function () {
      const MockACP         = await ethers.getContractFactory('MockACP');
      const AgentCourtHook  = await ethers.getContractFactory('AgentCourtHook');

      mockACP = await MockACP.deploy();
      hook    = await AgentCourtHook.deploy(
        await registry.getAddress(),
        await mockACP.getAddress()
      );

      // Authorize hook in registry
      await registry.setCourtHook(await hook.getAddress());

      // Set up a job in the mock: plaintiff = provider, defendant = client
      await mockACP.setJob(JOB_ID, plaintiff.address, defendant.address, 2); // 2 = Submitted
    });

    it('beforeAction is a true no-op — never reverts', async function () {
      await expect(
        mockACP.callBeforeAction(await hook.getAddress(), JOB_ID, COMPLETE_SELECTOR)
      ).not.to.be.reverted;
      await expect(
        mockACP.callBeforeAction(await hook.getAddress(), JOB_ID, REJECT_SELECTOR)
      ).not.to.be.reverted;
    });

    it('onlyACP blocks non-ACP callers on beforeAction', async function () {
      await expect(
        hook.connect(owner).beforeAction(JOB_ID, COMPLETE_SELECTOR, '0x')
      ).to.be.revertedWith('AgentCourtHook: caller is not the ACP contract');
    });

    it('onlyACP blocks non-ACP callers on afterAction', async function () {
      await expect(
        hook.connect(owner).afterAction(JOB_ID, COMPLETE_SELECTOR, '0x')
      ).to.be.revertedWith('AgentCourtHook: caller is not the ACP contract');
    });

    it('afterAction on complete writes positive ERC-8004 signal', async function () {
      const agentId = BigInt(plaintiff.address);
      await expect(
        mockACP.callAfterAction(await hook.getAddress(), JOB_ID, COMPLETE_SELECTOR)
      ).to.emit(registry, 'FeedbackGiven')
        .withArgs(agentId, await hook.getAddress(), 'job', 'completed', ethers.parseEther('5'), '');
    });

    it('afterAction on reject opens the appeal window and emits AppealWindowOpened', async function () {
      await expect(
        mockACP.callAfterAction(await hook.getAddress(), JOB_ID, REJECT_SELECTOR)
      ).to.emit(hook, 'AppealWindowOpened')
        .withArgs(JOB_ID, await mockACP.getAddress());
      expect(await hook.hasAppealWindow(JOB_ID)).to.be.true;
    });

    it('afterAction on reject is idempotent — second call does not re-open', async function () {
      await mockACP.callAfterAction(await hook.getAddress(), JOB_ID, REJECT_SELECTOR);
      // Second call should not emit again (jobContract already set)
      const tx = await mockACP.callAfterAction(await hook.getAddress(), JOB_ID, REJECT_SELECTOR);
      const receipt = await tx.wait();
      const openEvents = receipt.logs.filter(l => l.fragment?.name === 'AppealWindowOpened');
      expect(openEvents.length).to.equal(0);
    });

    it('settleAppeal providerWins — calls complete on job and writes dispute/won signal', async function () {
      await mockACP.callAfterAction(await hook.getAddress(), JOB_ID, REJECT_SELECTOR);
      const agentId = BigInt(plaintiff.address);
      await expect(hook.settleAppeal(JOB_ID, true))
        .to.emit(hook, 'AppealSettled').withArgs(JOB_ID, true)
        .and.to.emit(registry, 'FeedbackGiven')
        .withArgs(agentId, await hook.getAddress(), 'dispute', 'won', ethers.parseEther('5'), '');
      expect(await mockACP.getJobState(JOB_ID)).to.equal(3); // Completed
    });

    it('settleAppeal !providerWins — calls reject on job and writes dispute/lost signal', async function () {
      await mockACP.callAfterAction(await hook.getAddress(), JOB_ID, REJECT_SELECTOR);
      const agentId = BigInt(plaintiff.address);
      await expect(hook.settleAppeal(JOB_ID, false))
        .to.emit(hook, 'AppealSettled').withArgs(JOB_ID, false)
        .and.to.emit(registry, 'FeedbackGiven')
        .withArgs(agentId, await hook.getAddress(), 'dispute', 'lost', ethers.parseEther('-5'), '');
      expect(await mockACP.getJobState(JOB_ID)).to.equal(4); // Rejected
    });

    it('settleAppeal reverts when no appeal window exists', async function () {
      await expect(hook.settleAppeal(999n, true))
        .to.be.revertedWith('No appeal window for this job');
    });

    it('settleAppeal reverts on double settle', async function () {
      await mockACP.callAfterAction(await hook.getAddress(), JOB_ID, REJECT_SELECTOR);
      await hook.settleAppeal(JOB_ID, true);
      await expect(hook.settleAppeal(JOB_ID, true)).to.be.revertedWith('Already settled');
    });

    it('linkCase sets jobToCase and emits CaseLinkSet', async function () {
      const fakeCase = judge4.address;
      await expect(hook.linkCase(JOB_ID, fakeCase))
        .to.emit(hook, 'CaseLinkSet').withArgs(JOB_ID, fakeCase);
      const [, caseAddr] = await hook.getAppealStatus(JOB_ID);
      expect(caseAddr).to.equal(fakeCase);
    });

    it('setAcpContract updates the ACP address', async function () {
      await hook.setAcpContract(judge1.address);
      expect(await hook.acpContract()).to.equal(judge1.address);
    });
  });
});
