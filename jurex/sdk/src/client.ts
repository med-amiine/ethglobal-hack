import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  type PublicClient,
  type WalletClient,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia as arbitrum } from "viem/chains";
import { CONTRACTS, DEFAULTS, CASE_STATES, explorerTx, explorerAddr } from "./constants.js";
import { REGISTRY_ABI, FACTORY_ABI, JRX_ABI, CASE_ABI } from "./abis.js";
import {
  WalletRequiredError,
  ApiError,
  ContractError,
  NotRegisteredError,
  FaucetCooldownError,
} from "./errors.js";
import type {
  JurexConfig,
  AgentProfile,
  ReputationProfile,
  Case,
  FileCaseParams,
  FileCaseResult,
  RespondParams,
  VoteParams,
  TxResult,
  JobAppealParams,
} from "./types.js";

export class JurexClient {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient | null;
  private readonly account: Account | null;
  private readonly apiUrl: string;

  constructor(config: JurexConfig = {}) {
    const rpcUrl = config.rpcUrl ?? DEFAULTS.rpcUrl;
    this.apiUrl = config.apiUrl ?? DEFAULTS.apiUrl;

    this.publicClient = createPublicClient({
      chain: arbitrum,
      transport: http(rpcUrl),
    });

    if (config.privateKey) {
      this.account = privateKeyToAccount(config.privateKey);
      this.walletClient = createWalletClient({
        account: this.account,
        chain: arbitrum,
        transport: http(rpcUrl),
      });
    } else {
      this.account = null;
      this.walletClient = null;
    }
  }

  // ─── Internal helpers ───────────────────────────────────────────────────────

  private requireWallet(): { wallet: WalletClient; account: Account } {
    if (!this.walletClient || !this.account) throw new WalletRequiredError();
    return { wallet: this.walletClient, account: this.account };
  }

  private async apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${this.apiUrl}${path}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      const msg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      throw new ApiError(res.status, msg);
    }
    return res.json() as Promise<T>;
  }

  private async apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const msg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      throw new ApiError(res.status, msg);
    }
    return res.json() as Promise<T>;
  }

  private tx(hash: `0x${string}`): TxResult {
    return { hash, explorerUrl: explorerTx(hash) };
  }

  // ─── Registration ────────────────────────────────────────────────────────────

  /**
   * Register your agent in CourtRegistry.
   *
   * One call does two things:
   * 1. Registers you in Jurex's dispute system (so you can file / respond to cases)
   * 2. Generates a deterministic ERC-8004 ID making your reputation portable
   *
   * Idempotent — safe to call if already registered (returns early).
   */
  async register(): Promise<TxResult | { alreadyRegistered: true }> {
    const { wallet, account } = this.requireWallet();

    const profile = await this.publicClient.readContract({
      address: CONTRACTS.CourtRegistry,
      abi: REGISTRY_ABI,
      functionName: "getAgentProfile",
      args: [account.address],
    });

    if (profile.isRegistered) return { alreadyRegistered: true };

    try {
      const hash = await wallet.writeContract({
        address: CONTRACTS.CourtRegistry,
        abi: REGISTRY_ABI,
        functionName: "selfRegister",
        account: account,
        chain: arbitrum,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
      return this.tx(hash);
    } catch (e) {
      throw new ContractError("Registration failed", e);
    }
  }

  // ─── Reputation ───────────────────────────────────────────────────────────────

  /**
   * Get the full reputation profile for any agent address.
   * Falls back to onchain read if API is unreachable.
   */
  async reputation(address: `0x${string}`): Promise<ReputationProfile> {
    try {
      // API returns snake_case — normalize to camelCase
      const raw = await this.apiGet<Record<string, unknown>>(`/agent/reputation/${address}`);
      const score = Number(raw["reputation_score"] ?? raw["reputationScore"] ?? 0);
      const tier = score >= 80 ? "Verified" : score >= 60 ? "Standard" : score >= 50 ? "Probation" : "Banned";
      return {
        address,
        erc8004Id: String(raw["erc8004_id"] ?? raw["erc8004Id"] ?? ""),
        reputationScore: score,
        casesWon: Number(raw["cases_won"] ?? raw["casesWon"] ?? 0),
        casesLost: Number(raw["cases_lost"] ?? raw["casesLost"] ?? 0),
        noShows: Number(raw["no_shows"] ?? raw["noShows"] ?? 0),
        isRegistered: Boolean(raw["is_registered"] ?? raw["isRegistered"] ?? false),
        registeredAt: Number(raw["registered_at"] ?? raw["registeredAt"] ?? 0),
        trustTier: (raw["trust_tier"] ?? raw["trustTier"] ?? tier) as ReputationProfile["trustTier"],
        isRisky: Boolean(raw["is_risky"] ?? raw["isRisky"] ?? score < 70),
        isBlacklisted: Boolean(raw["is_blacklisted"] ?? raw["isBlacklisted"] ?? score < 50),
        erc8004Uri: String(raw["erc8004_uri"] ?? raw["erc8004Uri"] ?? ""),
      };
    } catch (apiErr) {
      if (apiErr instanceof ApiError) throw apiErr;
      // Onchain fallback
      const [profile, risky, blacklisted] = await Promise.all([
        this.publicClient.readContract({
          address: CONTRACTS.CourtRegistry,
          abi: REGISTRY_ABI,
          functionName: "getAgentProfile",
          args: [address],
        }),
        this.publicClient.readContract({
          address: CONTRACTS.CourtRegistry,
          abi: REGISTRY_ABI,
          functionName: "isRisky",
          args: [address],
        }),
        this.publicClient.readContract({
          address: CONTRACTS.CourtRegistry,
          abi: REGISTRY_ABI,
          functionName: "isBlacklisted",
          args: [address],
        }),
      ]);

      const score = Number(profile.reputationScore);
      const tier =
        score >= 80 ? "Verified" :
        score >= 60 ? "Standard" :
        score >= 50 ? "Probation" :
        "Banned";

      return {
        address,
        erc8004Id: profile.erc8004Id,
        reputationScore: score,
        casesWon: Number(profile.casesWon),
        casesLost: Number(profile.casesLost),
        noShows: Number(profile.noShows),
        isRegistered: profile.isRegistered,
        registeredAt: Number(profile.registeredAt),
        trustTier: tier,
        isRisky: risky,
        isBlacklisted: blacklisted,
        erc8004Uri: `eip155:42161:${CONTRACTS.CourtRegistry}/${BigInt(profile.erc8004Id).toString()}`,
      };
    }
  }

  // ─── Cases ────────────────────────────────────────────────────────────────────

  /**
   * List all cases, optionally filtered by state.
   */
  async listCases(filter?: { state?: number }): Promise<Case[]> {
    const res = await this.apiGet<{ cases: Case[] } | Case[]>("/cases");
    const cases = Array.isArray(res) ? res : res.cases ?? [];
    if (filter?.state !== undefined) {
      return cases.filter((c) => c.stateIndex === filter.state);
    }
    return cases;
  }

  /**
   * Get details for a single case by its contract address.
   */
  async getCase(caseAddress: `0x${string}`): Promise<Case> {
    return this.apiGet<Case>(`/cases/${caseAddress}`);
  }

  /**
   * File a new dispute case. Requires wallet. Stake of 0.0001 ETH is sent automatically.
   *
   * Returns the deployed CourtCase address and transaction hash.
   */
  async fileCase(params: FileCaseParams): Promise<FileCaseResult> {
    const { wallet, account } = this.requireWallet();

    const baseFee = await this.publicClient.readContract({
      address: CONTRACTS.CourtCaseFactory,
      abi: FACTORY_ABI,
      functionName: "BASE_FEE",
    });

    try {
      const hash = await wallet.writeContract({
        address: CONTRACTS.CourtCaseFactory,
        abi: FACTORY_ABI,
        functionName: "fileNewCase",
        args: [params.defendant, params.claim, params.evidence ?? ""],
        value: baseFee,
        account,
        chain: arbitrum,
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      const caseAddress = (receipt.contractAddress ?? receipt.logs[0]?.address) as `0x${string}`;

      return {
        hash,
        explorerUrl: explorerTx(hash),
        caseAddress,
      };
    } catch (e) {
      throw new ContractError("Failed to file case", e);
    }
  }

  /**
   * Respond to a case as the defendant. Stake of 0.0001 ETH is sent automatically.
   */
  async respond(params: RespondParams): Promise<TxResult> {
    const { wallet, account } = this.requireWallet();

    const baseFee = await this.publicClient.readContract({
      address: params.caseAddress,
      abi: CASE_ABI,
      functionName: "BASE_FEE",
    });

    try {
      const hash = await wallet.writeContract({
        address: params.caseAddress,
        abi: CASE_ABI,
        functionName: "respondToCase",
        value: baseFee,
        account,
        chain: arbitrum,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });

      if (params.evidence) {
        const h2 = await wallet.writeContract({
          address: params.caseAddress,
          abi: CASE_ABI,
          functionName: "submitEvidence",
          args: [params.evidence],
          account,
          chain: arbitrum,
        });
        await this.publicClient.waitForTransactionReceipt({ hash: h2 });
      }

      return this.tx(hash);
    } catch (e) {
      throw new ContractError("Failed to respond to case", e);
    }
  }

  /**
   * Submit your judge vote on a Deliberating case.
   */
  async vote(params: VoteParams): Promise<TxResult> {
    const { wallet, account } = this.requireWallet();

    try {
      const hash = await wallet.writeContract({
        address: params.caseAddress,
        abi: CASE_ABI,
        functionName: "submitVote",
        args: [params.plaintiffWins],
        account,
        chain: arbitrum,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
      return this.tx(hash);
    } catch (e) {
      throw new ContractError("Vote failed", e);
    }
  }

  /**
   * File an appeal on a resolved case. Must be called within 10 minutes of verdict.
   * Appeal bond (0.0003 ETH) is sent automatically.
   */
  async appeal(caseAddress: `0x${string}`): Promise<TxResult> {
    const { wallet, account } = this.requireWallet();

    const bond = await this.publicClient.readContract({
      address: caseAddress,
      abi: CASE_ABI,
      functionName: "APPEAL_BOND",
    });

    try {
      const hash = await wallet.writeContract({
        address: caseAddress,
        abi: CASE_ABI,
        functionName: "fileAppeal",
        value: bond,
        account,
        chain: arbitrum,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
      return this.tx(hash);
    } catch (e) {
      throw new ContractError("Appeal failed", e);
    }
  }

  /**
   * File an ERC-8183 job appeal via CourtCaseFactory.fileAppeal().
   * Called by the job provider after an evaluator rejection opens an appeal window.
   * Stakes 0.002 ETH (2x BASE_FEE) automatically.
   */
  async fileJobAppeal(params: JobAppealParams): Promise<FileCaseResult> {
    const { wallet, account } = this.requireWallet();

    const baseFee = await this.publicClient.readContract({
      address: CONTRACTS.CourtCaseFactory,
      abi: FACTORY_ABI,
      functionName: "BASE_FEE",
    });

    const evidence = params.evidence ?? "appeal";

    try {
      const hash = await wallet.writeContract({
        address: CONTRACTS.CourtCaseFactory,
        abi: FACTORY_ABI,
        functionName: "fileAppeal",
        args: [params.jobId, params.jobContract, params.hookContract, evidence],
        value: (baseFee as bigint) * 2n,
        account,
        chain: arbitrum,
      });
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Extract deployed CourtCase address from AppealFiled event log
      const log = receipt.logs.find(
        (l) => l.topics[0] === "0x" + "AppealFiled".padStart(64, "0")
      );
      // Fallback: last log address is typically the deployed case
      const caseAddress = (receipt.logs[receipt.logs.length - 1]?.address ?? "0x") as `0x${string}`;

      return { hash, explorerUrl: explorerTx(hash), caseAddress };
    } catch (e) {
      throw new ContractError("fileJobAppeal failed", e);
    }
  }

  // ─── JRX Token ────────────────────────────────────────────────────────────────

  /**
   * Get JRX balance for any address. Returns value in JRX (not wei).
   */
  async jrxBalance(address?: `0x${string}`): Promise<number> {
    const target = address ?? this.account?.address;
    if (!target) throw new WalletRequiredError();
    const raw = await this.publicClient.readContract({
      address: CONTRACTS.JRXToken,
      abi: JRX_ABI,
      functionName: "balanceOf",
      args: [target as `0x${string}`],
    });
    return Number(raw) / 1e18;
  }

  /**
   * Claim 10,000 JRX from the faucet. Once per 24 hours per address.
   * Throws FaucetCooldownError if cooldown is active.
   */
  async faucet(): Promise<TxResult> {
    const { wallet, account } = this.requireWallet();

    const [lastDrip, cooldown] = await Promise.all([
      this.publicClient.readContract({
        address: CONTRACTS.JRXToken,
        abi: JRX_ABI,
        functionName: "lastDripAt",
        args: [account.address],
      }),
      this.publicClient.readContract({
        address: CONTRACTS.JRXToken,
        abi: JRX_ABI,
        functionName: "FAUCET_COOLDOWN",
      }),
    ]);

    const now = BigInt(Math.floor(Date.now() / 1000));
    if (lastDrip > 0n && now < lastDrip + cooldown) {
      throw new FaucetCooldownError(Number(lastDrip + cooldown - now));
    }

    try {
      const hash = await wallet.writeContract({
        address: CONTRACTS.JRXToken,
        abi: JRX_ABI,
        functionName: "drip",
        args: [account.address],
        account,
        chain: arbitrum,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
      return this.tx(hash);
    } catch (e) {
      throw new ContractError("Faucet drip failed", e);
    }
  }

  // ─── Staking ──────────────────────────────────────────────────────────────────

  /**
   * Stake JRX to join the judge pool.
   * Handles ERC-20 approval automatically.
   * Minimum 1,000 JRX required for first stake.
   *
   * @param amountJrx - Amount in JRX (not wei). E.g. 1000 for 1,000 JRX.
   */
  async stake(amountJrx: number): Promise<TxResult> {
    const { wallet, account } = this.requireWallet();
    const amount = parseUnits(amountJrx.toString(), 18);

    try {
      // Approve
      const approveTx = await wallet.writeContract({
        address: CONTRACTS.JRXToken,
        abi: JRX_ABI,
        functionName: "approve",
        args: [CONTRACTS.CourtRegistry, amount],
        account,
        chain: arbitrum,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Stake
      const hash = await wallet.writeContract({
        address: CONTRACTS.CourtRegistry,
        abi: REGISTRY_ABI,
        functionName: "stakeAsJudge",
        args: [amount],
        account,
        chain: arbitrum,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
      return this.tx(hash);
    } catch (e) {
      throw new ContractError("Staking failed", e);
    }
  }

  /**
   * Unstake all JRX and leave the judge pool.
   */
  async unstake(): Promise<TxResult> {
    const { wallet, account } = this.requireWallet();

    try {
      const hash = await wallet.writeContract({
        address: CONTRACTS.CourtRegistry,
        abi: REGISTRY_ABI,
        functionName: "unstakeJudge",
        account,
        chain: arbitrum,
      });
      await this.publicClient.waitForTransactionReceipt({ hash });
      return this.tx(hash);
    } catch (e) {
      throw new ContractError("Unstake failed", e);
    }
  }

  /**
   * Get current JRX stake for any address. Returns value in JRX (not wei).
   */
  async judgeStake(address?: `0x${string}`): Promise<number> {
    const target = address ?? this.account?.address;
    if (!target) throw new WalletRequiredError();
    const raw = await this.publicClient.readContract({
      address: CONTRACTS.CourtRegistry,
      abi: REGISTRY_ABI,
      functionName: "judgeStakes",
      args: [target as `0x${string}`],
    });
    return Number(raw) / 1e18;
  }

  // ─── Stats ────────────────────────────────────────────────────────────────────

  /**
   * Get platform-wide stats from the API.
   */
  async stats(): Promise<Record<string, unknown>> {
    return this.apiGet("/stats/overview");
  }

  /**
   * Get judge pool size.
   */
  async judgePoolSize(): Promise<number> {
    const size = await this.publicClient.readContract({
      address: CONTRACTS.CourtRegistry,
      abi: REGISTRY_ABI,
      functionName: "getJudgePoolSize",
    });
    return Number(size);
  }
}

/**
 * Create a Jurex SDK client.
 *
 * @example
 * ```ts
 * import { createJurex } from '@jurex/sdk'
 *
 * const jurex = createJurex({ privateKey: '0x...' })
 *
 * await jurex.register()
 * const rep = await jurex.reputation('0xAddress')
 * const { caseAddress } = await jurex.fileCase({ defendant: '0x...', evidence: 'QmHash' })
 * ```
 */
export function createJurex(config: JurexConfig = {}): JurexClient {
  return new JurexClient(config);
}
