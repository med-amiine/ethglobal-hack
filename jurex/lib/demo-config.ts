/**
 * Demo configuration with hardcoded addresses for hackathon booth
 */

export const DEMO_CONFIG = {
  // Demo agent that will be registered
  agent: {
    name: "giza",
    address: "0x1234567890123456789012345678901234567890",
  },

  // Demo client who hires the agent
  client: {
    address: "0x0987654321098765432109876543210987654321",
  },

  // Demo judge nullifiers (World ID verified)
  judges: [
    "0xabcdef123456789abcdef123456789abcdef1234567",
    "0x1111111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222222",
  ],

  // Task details
  task: {
    description: "Build autonomous trading strategy for Base Sepolia",
    budgetUSDC: 100,
    deadline: 7,
  },
};

export const DEMO_STEPS = [
  {
    number: 1,
    title: "REGISTER AGENT",
    action: "Register giza.jurex.eth",
  },
  {
    number: 2,
    title: "CREATE TASK",
    action: "Arc x402 payment & escrow",
  },
  {
    number: 3,
    title: "OPEN DISPUTE",
    action: "File case on-chain",
  },
  {
    number: 4,
    title: "JUDGE VOTES",
    action: "3 judges verify & vote",
  },
  {
    number: 5,
    title: "RESOLVE & RELEASE",
    action: "Chainlink CRE executes",
  },
];
