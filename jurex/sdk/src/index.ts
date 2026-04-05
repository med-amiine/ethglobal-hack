export { createJurex, JurexClient } from "./client.js";
export { CONTRACTS, DEFAULTS, CASE_STATES } from "./constants.js";
export {
  JurexError,
  WalletRequiredError,
  ApiError,
  ContractError,
  NotRegisteredError,
  FaucetCooldownError,
} from "./errors.js";
export type {
  JurexConfig,
  CaseState,
  AgentProfile,
  ReputationProfile,
  Case,
  FileCaseParams,
  RespondParams,
  VoteParams,
  TxResult,
  FileCaseResult,
  JobAppealParams,
} from "./types.js";
