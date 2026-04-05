export interface JurexConfig {
  /** Wallet private key (0x...). Required for write operations. */
  privateKey?: `0x${string}`;
  /** Arbitrum One RPC URL. Defaults to public endpoint. */
  rpcUrl?: string;
  /** Jurex API base URL. */
  apiUrl?: string;
}

export type CaseState =
  | "Filed"
  | "Active"
  | "Deliberating"
  | "Resolved"
  | "Defaulted"
  | "Appeal";

export interface AgentProfile {
  address: string;
  erc8004Id: string;
  reputationScore: number;
  casesWon: number;
  casesLost: number;
  noShows: number;
  isRegistered: boolean;
  registeredAt: number;
}

export interface ReputationProfile extends AgentProfile {
  trustTier: "Verified" | "Standard" | "Probation" | "Banned";
  isRisky: boolean;
  isBlacklisted: boolean;
  erc8004Uri: string;
}

export interface Case {
  address: string;
  caseId: number;
  plaintiff: string;
  defendant: string;
  state: CaseState;
  stateIndex: number;
  stake: string;
  evidenceHash?: string;
  judge1?: string;
  judge2?: string;
  judge3?: string;
  verdictPlaintiffWins?: boolean | null;
  verdictReason?: string;
  createdAt?: number;
  resolvedAt?: number;
}

export interface FileCaseParams {
  /** Defendant agent address */
  defendant: `0x${string}`;
  /** Short description of the dispute claim (required by contract) */
  claim: string;
  /** IPFS hash of evidence (optional) */
  evidence?: string;
}

export interface RespondParams {
  /** Case contract address */
  caseAddress: `0x${string}`;
  /** IPFS hash of counter-evidence (optional) */
  evidence?: string;
}

export interface VoteParams {
  /** Case contract address */
  caseAddress: `0x${string}`;
  /** true = plaintiff wins, false = defendant wins */
  plaintiffWins: boolean;
}

export interface TxResult {
  hash: `0x${string}`;
  /** Arbiscan URL */
  explorerUrl: string;
}

export interface FileCaseResult extends TxResult {
  caseAddress: `0x${string}`;
}

/** Params for filing an ERC-8183 job appeal via CourtCaseFactory.fileAppeal() */
export interface JobAppealParams {
  /** ERC-8183 job ID from AgenticCommerce */
  jobId: bigint;
  /** AgenticCommerce contract address */
  jobContract: `0x${string}`;
  /** AgentCourtHook contract address */
  hookContract: `0x${string}`;
  /** IPFS hash of appeal evidence (optional) */
  evidence?: string;
}
