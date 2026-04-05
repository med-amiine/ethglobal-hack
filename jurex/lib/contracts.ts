// Contract ABIs and addresses for Arbitrum Sepolia
// Deployed test contracts: CourtRegistry + CourtCaseFactoryTest (BASE_FEE = 0.0001 ETH)

export const CONTRACTS = {
  CourtRegistry: {
    address: "0x2d02a6A204de958cFa6551710681f230043bF646" as `0x${string}`,
    abi: [
      {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor"
      },
      {
        inputs: [
          { internalType: "address", name: "_agentAddress", type: "address" },
          { internalType: "bytes32", name: "_erc8004Id", type: "bytes32" }
        ],
        name: "registerAgent",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [{ internalType: "address", name: "_agent", type: "address" }],
        name: "getReputation",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [{ internalType: "address", name: "_agent", type: "address" }],
        name: "getAgentProfile",
        outputs: [{
          components: [
            { internalType: "bytes32", name: "erc8004Id", type: "bytes32" },
            { internalType: "uint256", name: "reputationScore", type: "uint256" },
            { internalType: "uint256", name: "casesWon", type: "uint256" },
            { internalType: "uint256", name: "casesLost", type: "uint256" },
            { internalType: "uint256", name: "noShows", type: "uint256" },
            { internalType: "bool", name: "isRegistered", type: "bool" },
            { internalType: "uint256", name: "registeredAt", type: "uint256" }
          ],
          internalType: "struct CourtRegistry.AgentProfile",
          name: "",
          type: "tuple"
        }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [{ internalType: "address", name: "_agent", type: "address" }],
        name: "isRisky",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [{ internalType: "address", name: "_agent", type: "address" }],
        name: "isBlacklisted",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getRegisteredAgentsCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: "address", name: "agent", type: "address" },
          { indexed: true, internalType: "bytes32", name: "erc8004Id", type: "bytes32" },
          { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
        ],
        name: "AgentRegistered",
        type: "event"
      },
      {
        inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
        name: "stakeAsJudge",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "unstakeJudge",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [{ internalType: "address", name: "", type: "address" }],
        name: "judgeStakes",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getJudgePoolSize",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "JUDGE_STAKE_MIN",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "selfRegister",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      }
    ]
  },
  CourtCaseFactory: {
    address: "0xeF82E15EA473dF494f0476ead243556350Ee9c91" as `0x${string}`,
    abi: [
      {
        inputs: [{ internalType: "address", name: "_registry", type: "address" }],
        stateMutability: "nonpayable",
        type: "constructor"
      },
      {
        inputs: [
          { internalType: "address", name: "_defendant", type: "address" },
          { internalType: "string", name: "_claimDescription", type: "string" },
          { internalType: "string", name: "_evidenceHash", type: "string" }
        ],
        name: "fileNewCase",
        outputs: [{ internalType: "address", name: "caseAddress", type: "address" }],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          { internalType: "address", name: "_caseAddress", type: "address" },
          { internalType: "uint256", name: "_seed", type: "uint256" }
        ],
        name: "assignJudgesToCase",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "getAllCases",
        outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [{ internalType: "address", name: "_plaintiff", type: "address" }],
        name: "getCasesByPlaintiff",
        outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [{ internalType: "address", name: "_defendant", type: "address" }],
        name: "getCasesByDefendant",
        outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getCaseCount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: "address", name: "caseAddress", type: "address" },
          { indexed: true, internalType: "address", name: "plaintiff", type: "address" },
          { indexed: true, internalType: "address", name: "defendant", type: "address" },
          { indexed: false, internalType: "uint256", name: "caseId", type: "uint256" }
        ],
        name: "CaseCreated",
        type: "event"
      }
    ]
  },
  CourtCase: {
    abi: [
      {
        inputs: [
          { internalType: "address", name: "_registry", type: "address" },
          { internalType: "address", name: "_factory", type: "address" },
          { internalType: "address", name: "_plaintiff", type: "address" },
          { internalType: "address", name: "_defendant", type: "address" },
          { internalType: "string", name: "_claimDescription", type: "string" },
          { internalType: "string", name: "_evidenceHash", type: "string" }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
      },
      {
        inputs: [],
        name: "respondToCase",
        outputs: [],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [],
        name: "missedDeadline",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "resolveAfterDeadline",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [{ internalType: "string", name: "_ipfsHash", type: "string" }],
        name: "submitEvidence",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [{ internalType: "bool", name: "_plaintiffWins", type: "bool" }],
        name: "submitVote",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "plaintiff",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "defendant",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "state",
        outputs: [{ internalType: "enum CourtCase.CaseState", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "plaintiffStake",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "defendantStake",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "claimDescription",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "deadlineToRespond",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "filedAt",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "resolvedAt",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "plaintiffWins",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "verdictReason",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getJudges",
        outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getVoteCount",
        outputs: [
          { internalType: "uint256", name: "plaintiffVotes", type: "uint256" },
          { internalType: "uint256", name: "defendantVotes", type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: "address", name: "plaintiff", type: "address" },
          { indexed: true, internalType: "address", name: "defendant", type: "address" },
          { indexed: true, internalType: "uint256", name: "caseId", type: "uint256" },
          { indexed: false, internalType: "uint256", name: "stake", type: "uint256" }
        ],
        name: "CaseFiled",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: false, internalType: "address", name: "judge1", type: "address" },
          { indexed: false, internalType: "address", name: "judge2", type: "address" },
          { indexed: false, internalType: "address", name: "judge3", type: "address" },
          { indexed: false, internalType: "uint256", name: "votingDeadline", type: "uint256" }
        ],
        name: "JudgesAssigned",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: "address", name: "judge", type: "address" },
          { indexed: false, internalType: "uint8", name: "vote", type: "uint8" },
          { indexed: false, internalType: "uint256", name: "plaintiffTotal", type: "uint256" },
          { indexed: false, internalType: "uint256", name: "defendantTotal", type: "uint256" }
        ],
        name: "VoteSubmitted",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: false, internalType: "bool", name: "plaintiffWins", type: "bool" },
          { indexed: false, internalType: "string", name: "reason", type: "string" },
          { indexed: false, internalType: "uint256", name: "resolvedAt", type: "uint256" }
        ],
        name: "VerdictRendered",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: false, internalType: "uint256", name: "toPlaintiff", type: "uint256" },
          { indexed: false, internalType: "uint256", name: "toDefendant", type: "uint256" },
          { indexed: false, internalType: "uint256", name: "toCourt", type: "uint256" }
        ],
        name: "StakesDistributed",
        type: "event"
      },
      {
        inputs: [],
        name: "fileAppeal",
        outputs: [],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [],
        name: "appealUsed",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "verdictRenderedAt",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "APPEAL_WINDOW",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "APPEAL_BOND",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: "address", name: "appellant", type: "address" },
          { indexed: false, internalType: "uint256", name: "bond", type: "uint256" }
        ],
        name: "AppealFiled",
        type: "event"
      }
    ]
  }
};

// JRX Token contract
export const JRX_TOKEN = {
  address: "0xEDE88f95A4432dB584F9F2F2244312b146D572b4" as `0x${string}`,
  abi: [
    {
      inputs: [{ internalType: "address", name: "to", type: "address" }],
      name: "drip",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" }
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "lastDripAt",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function"
    }
  ]
};

// Base fee for filing cases — must match CourtCaseTest.sol BASE_FEE constant
export const BASE_FEE = BigInt("100000000000000"); // 0.0001 ETH in wei (testnet)

// Chain configuration
export const ARBITRUM_SEPOLIA = {
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia-rollup.arbitrum.io/rpc"] }
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" }
  }
};
