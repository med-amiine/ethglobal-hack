export const REGISTRY_ABI = [
  { name: "selfRegister", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "stakeAsJudge", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "unstakeJudge", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "getReputation", type: "function", stateMutability: "view", inputs: [{ name: "_agent", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "judgeStakes", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "getAgentProfile", type: "function", stateMutability: "view", inputs: [{ name: "_agent", type: "address" }], outputs: [{ components: [{ name: "erc8004Id", type: "bytes32" }, { name: "reputationScore", type: "uint256" }, { name: "casesWon", type: "uint256" }, { name: "casesLost", type: "uint256" }, { name: "noShows", type: "uint256" }, { name: "isRegistered", type: "bool" }, { name: "registeredAt", type: "uint256" }], type: "tuple" }] },
  { name: "isRisky", type: "function", stateMutability: "view", inputs: [{ name: "_agent", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "isBlacklisted", type: "function", stateMutability: "view", inputs: [{ name: "_agent", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "JUDGE_STAKE_MIN", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getAgentERC8004Uri", type: "function", stateMutability: "view", inputs: [{ name: "_agent", type: "address" }], outputs: [{ type: "string" }] },
  { name: "getJudgePoolSize", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const FACTORY_ABI = [
  { name: "fileNewCase", type: "function", stateMutability: "payable", inputs: [{ name: "_defendant", type: "address" }, { name: "_claimDescription", type: "string" }, { name: "_evidenceHash", type: "string" }], outputs: [{ name: "", type: "address" }] },
  { name: "fileAppeal", type: "function", stateMutability: "payable", inputs: [{ name: "jobId", type: "uint256" }, { name: "jobContract", type: "address" }, { name: "hookContract", type: "address" }, { name: "evidenceHash", type: "string" }], outputs: [{ name: "", type: "address" }] },
  { name: "BASE_FEE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const JRX_ABI = [
  { name: "drip", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }], outputs: [] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "lastDripAt", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "FAUCET_AMOUNT", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "FAUCET_COOLDOWN", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const CASE_ABI = [
  { name: "respondToCase", type: "function", stateMutability: "payable", inputs: [], outputs: [] },
  { name: "submitEvidence", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_ipfsHash", type: "string" }], outputs: [] },
  { name: "submitVote", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_plaintiffWins", type: "bool" }], outputs: [] },
  { name: "fileAppeal", type: "function", stateMutability: "payable", inputs: [], outputs: [] },
  { name: "missedDeadline", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "resolveAfterDeadline", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "plaintiff", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "defendant", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "state", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "BASE_FEE", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "APPEAL_BOND", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;
