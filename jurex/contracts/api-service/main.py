from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import time
import json

from web3 import Web3
from upstash_redis import Redis as UpstashRedis

app = FastAPI(
    title="Agent Court API",
    description="Decentralized dispute resolution for AI agents on Arbitrum Sepolia",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────
CONTRACTS = {
    "COURT_REGISTRY":      "0x2d02a6A204de958cFa6551710681f230043bF646",
    "COURT_CASE_FACTORY":  "0xeF82E15EA473dF494f0476ead243556350Ee9c91",
    "JRX_TOKEN":           os.getenv("JRX_TOKEN_ADDRESS", "0xEDE88f95A4432dB584F9F2F2244312b146D572b4"),
    "AGENTIC_COMMERCE":    os.getenv("AGENTIC_COMMERCE_ADDRESS", "0xDd570A7d5018d81BED8C772903Cfd3b11669aA8F"),
    "AGENT_COURT_HOOK":    os.getenv("AGENT_COURT_HOOK_ADDRESS", "0xD14a340F8C61A8F4D4269Ef7Ba8357cFD498925F"),
}

RPC_URL     = os.getenv("ARBITRUM_RPC_URL", "https://sepolia-rollup.arbitrum.io/rpc")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")   # deployer key — used only for gasless registration
w3 = Web3(Web3.HTTPProvider(RPC_URL))

BASE_FEE    = 100_000_000_000_000  # 0.0001 ETH
APPEAL_BOND = BASE_FEE * 3         # 0.0003 ETH

# ── Upstash Redis Cache ────────────────────────────────────────
_redis_url   = os.getenv("UPSTASH_REDIS_URL", "")
_redis_token = os.getenv("UPSTASH_REDIS_TOKEN", "")
_redis: Optional[UpstashRedis] = (
    UpstashRedis(url=_redis_url, token=_redis_token)
    if _redis_url and _redis_token else None
)

def _cache_get(key: str):
    if not _redis: return None
    try:
        v = _redis.get(key)
        return json.loads(v) if v else None
    except Exception:
        return None

def _cache_set(key: str, value, ttl: int = 60):
    if not _redis: return
    try:
        _redis.set(key, json.dumps(value), ex=ttl)
    except Exception:
        pass

def _cache_del(*keys: str):
    if not _redis: return
    try:
        for k in keys:
            _redis.delete(k)
    except Exception:
        pass

# ── ABIs ──────────────────────────────────────────────────────
COURT_CASE_FACTORY_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_defendant", "type": "address"},
            {"internalType": "string",  "name": "_claimDescription", "type": "string"},
            {"internalType": "string",  "name": "_evidenceHash", "type": "string"}
        ],
        "name": "fileNewCase",
        "outputs": [{"internalType": "address", "name": "caseAddress", "type": "address"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "jobId",       "type": "uint256"},
            {"internalType": "address", "name": "jobContract", "type": "address"},
            {"internalType": "address", "name": "hookContract","type": "address"},
            {"internalType": "string",  "name": "evidenceHash","type": "string"}
        ],
        "name": "fileAppeal",
        "outputs": [{"internalType": "address", "name": "caseAddress", "type": "address"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAllCases",
        "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCaseCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
]

COURT_CASE_ABI = [
    {"inputs": [], "name": "state",            "outputs": [{"internalType": "uint8",   "name": "", "type": "uint8"}],   "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "plaintiff",        "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "defendant",        "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "claimDescription", "outputs": [{"internalType": "string",  "name": "", "type": "string"}],  "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "plaintiffStake",   "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "defendantStake",   "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "deadlineToRespond","outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "initialEvidenceHash","outputs": [{"internalType": "string","name": "", "type": "string"}],  "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "filedAt",          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "resolvedAt",       "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "plaintiffWins",    "outputs": [{"internalType": "bool",    "name": "", "type": "bool"}],    "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "verdictReason",    "outputs": [{"internalType": "string",  "name": "", "type": "string"}],  "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "getJudges",        "outputs": [{"internalType": "address[]","name": "", "type": "address[]"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "getVoteCount",     "outputs": [{"internalType": "uint256", "name": "plaintiffVotes", "type": "uint256"}, {"internalType": "uint256", "name": "defendantVotes", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {
        "inputs": [],
        "name": "respondToCase",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address[3]", "name": "_judges", "type": "address[3]"}],
        "name": "assignJudges",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bool", "name": "_plaintiffWins", "type": "bool"}],
        "name": "submitVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "missedDeadline",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "resolveAfterDeadline",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "deliberationStartedAt",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "fileAppeal",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "isAppeal",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "appealUsed",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "verdictRenderedAt",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "courtFeesCollected",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address payable", "name": "_to", "type": "address"}],
        "name": "sweepFees",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
]

COURT_REGISTRY_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "_agent", "type": "address"}],
        "name": "getAgentProfile",
        "outputs": [
            {"internalType": "bytes32", "name": "erc8004Id",      "type": "bytes32"},
            {"internalType": "uint256", "name": "reputationScore","type": "uint256"},
            {"internalType": "uint256", "name": "casesWon",       "type": "uint256"},
            {"internalType": "uint256", "name": "casesLost",      "type": "uint256"},
            {"internalType": "uint256", "name": "noShows",        "type": "uint256"},
            {"internalType": "bool",    "name": "isRegistered",   "type": "bool"},
            {"internalType": "uint256", "name": "registeredAt",   "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getRegisteredAgentsCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "_plaintiff", "type": "address"},
            {"internalType": "address", "name": "_defendant",  "type": "address"}
        ],
        "name": "getEligibleJudges",
        "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getJudgePoolSize",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "judgeStakes",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
        "name": "stakeAsJudge",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unstakeJudge",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "_agentAddress", "type": "address"},
            {"internalType": "bytes32", "name": "_erc8004Id",    "type": "bytes32"}
        ],
        "name": "registerAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True,  "internalType": "address", "name": "agent",     "type": "address"},
            {"indexed": True,  "internalType": "bytes32", "name": "erc8004Id", "type": "bytes32"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "AgentRegistered",
        "type": "event"
    }
]

JRX_TOKEN_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "to", "type": "address"}],
        "name": "drip",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "spender", "type": "address"},
            {"internalType": "uint256", "name": "amount",  "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "lastDripAt",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
]

FACTORY_ASSIGN_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_caseAddress", "type": "address"},
            {"internalType": "uint256", "name": "_seed",        "type": "uint256"}
        ],
        "name": "assignJudgesToCase",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address",          "name": "_caseAddress", "type": "address"},
            {"internalType": "address payable",  "name": "_treasury",    "type": "address"}
        ],
        "name": "sweepFeesFromCase",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
]

# ── Contract instances ────────────────────────────────────────
factory_contract  = w3.eth.contract(address=CONTRACTS["COURT_CASE_FACTORY"], abi=COURT_CASE_FACTORY_ABI)
registry_contract = w3.eth.contract(address=CONTRACTS["COURT_REGISTRY"],     abi=COURT_REGISTRY_ABI)

def _get_jrx_contract():
    addr = CONTRACTS.get("JRX_TOKEN", "")
    if not addr:
        raise HTTPException(status_code=503, detail="JRX_TOKEN_ADDRESS not configured")
    return w3.eth.contract(address=Web3.to_checksum_address(addr), abi=JRX_TOKEN_ABI)

def _get_factory_ext():
    """Factory contract with extended ABI for assignJudgesToCase and sweepFeesFromCase."""
    return w3.eth.contract(
        address=CONTRACTS["COURT_CASE_FACTORY"],
        abi=COURT_CASE_FACTORY_ABI + FACTORY_ASSIGN_ABI
    )

def _get_registry_ext():
    """Registry with staking ABI."""
    return w3.eth.contract(address=CONTRACTS["COURT_REGISTRY"], abi=COURT_REGISTRY_ABI)

STATE_NAMES = ["Filed", "Summoned", "Active", "Deliberating", "Resolved", "Dismissed", "Defaulted", "Appealed"]

def risk_level_from_score(score: int) -> str:
    if score >= 90: return "TRUSTED"
    if score >= 70: return "GOOD"
    if score >= 50: return "CAUTION"
    if score >= 30: return "HIGH_RISK"
    return "BLACKLISTED"

def trust_tier_from_score(score: int) -> str:
    if score >= 80: return "verified"
    if score >= 50: return "standard"
    if score >= 30: return "probation"
    return "banned"

def _get_case_data(address: str) -> dict:
    case = w3.eth.contract(address=Web3.to_checksum_address(address), abi=COURT_CASE_ABI)
    state          = case.functions.state().call()
    plaintiff      = case.functions.plaintiff().call()
    defendant      = case.functions.defendant().call()
    claim          = case.functions.claimDescription().call()
    p_stake        = case.functions.plaintiffStake().call()
    d_stake        = case.functions.defendantStake().call()
    deadline       = case.functions.deadlineToRespond().call()
    evidence_hash  = case.functions.initialEvidenceHash().call()
    filed_at       = case.functions.filedAt().call()
    try:
        resolved_at = case.functions.resolvedAt().call()
    except Exception:
        resolved_at = 0
    try:
        p_wins = case.functions.plaintiffWins().call()
    except Exception:
        p_wins = False
    try:
        verdict = case.functions.verdictReason().call()
    except Exception:
        verdict = ""
    try:
        judges_list = case.functions.getJudges().call()
    except Exception:
        judges_list = []
    try:
        p_votes, d_votes = case.functions.getVoteCount().call()
    except Exception:
        p_votes, d_votes = 0, 0

    # Appeal / fees (new fields — safe to fail on old contracts)
    try:
        is_appeal    = case.functions.isAppeal().call()
        appeal_used  = case.functions.appealUsed().call()
        verdict_at   = case.functions.verdictRenderedAt().call()
        court_fees   = case.functions.courtFeesCollected().call()
    except Exception:
        is_appeal = appeal_used = False
        verdict_at = court_fees = 0

    return {
        "address":           address,
        "state":             STATE_NAMES[state] if state < len(STATE_NAMES) else "Unknown",
        "stateIndex":        state,
        "plaintiff":         plaintiff,
        "defendant":         defendant,
        "claimDescription":  claim,
        "plaintiffStake":    str(p_stake),
        "defendantStake":    str(d_stake),
        "deadlineToRespond": deadline,
        "evidenceIpfsHash":  evidence_hash,
        "filedAt":           filed_at,
        "resolvedAt":        resolved_at if resolved_at > 0 else None,
        "outcome":           ("PlaintiffWon" if p_wins else "DefendantWon") if state == 4 else None,
        "verdictReason":     verdict,
        "judges":            judges_list,
        "votesForPlaintiff": int(p_votes),
        "votesForDefendant": int(d_votes),
        "hasX402Evidence":   False,
        "isAppeal":          is_appeal,
        "appealUsed":        appeal_used,
        "verdictRenderedAt": verdict_at if verdict_at > 0 else None,
        "courtFeesCollected":str(court_fees),
        "appealWindowOpen":  (state == 4 and not appeal_used and verdict_at > 0 and
                              int(time.time()) <= verdict_at + 600),  # 10 min window
    }

# ── Pydantic models ───────────────────────────────────────────
class VerifyTxRequest(BaseModel):
    txHash: str
    expectedPayer: Optional[str] = None
    expectedPayee: Optional[str] = None
    expectedAmount: Optional[str] = None

class FileX402Request(BaseModel):
    plaintiffAddress: str
    defendantAddress: str
    proof: Dict[str, Any]
    claimDescription: str

class AgentFileCaseRequest(BaseModel):
    plaintiff: str
    defendant: str
    x402_tx_hash: str
    claim: str
    evidence_hash: Optional[str] = "QmDefaultEvidence"

class JobAppealRequest(BaseModel):
    provider: str                               # job provider address (plaintiff)
    job_id: int                                 # ERC-8183 job ID
    job_contract: str                           # AgenticCommerce address
    hook_contract: Optional[str] = None         # AgentCourtHook (defaults to deployed hook)
    evidence_hash: Optional[str] = "QmAppealEvidence"

class AssignJudgesRequest(BaseModel):
    judges: List[str]

class VoteRequest(BaseModel):
    plaintiff_wins: bool

class StakeRequest(BaseModel):
    address: str
    amount_jrx: str  # amount in JRX (human units, e.g. "1000")

class SweepRequest(BaseModel):
    treasury: str  # address to send fees to

class AssignJudgesRandomRequest(BaseModel):
    seed: Optional[int] = 0  # extra entropy; 0 is fine for testing

# ── Routes ────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Agent Court API", "docs": "/docs"}

@app.get("/health")
async def health():
    try:
        block = w3.eth.block_number
        return {
            "status": "ok",
            "chain": "arbitrum-sepolia",
            "chainId": 421614,
            "block": str(block),
            "contracts": CONTRACTS,
            "timestamp": int(time.time() * 1000)
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail={"status": "degraded", "error": str(e)})

@app.get("/cases")
async def list_cases(limit: int = 20, offset: int = 0):
    cache_key = f"cases:list:{limit}:{offset}"
    cached = _cache_get(cache_key)
    if cached: return cached
    try:
        all_cases = factory_contract.functions.getAllCases().call()
        result = {
            "total":  len(all_cases),
            "cases":  all_cases[offset:offset + limit],
            "offset": offset,
            "limit":  limit,
        }
        _cache_set(cache_key, result, ttl=30)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cases/{address}")
async def get_case(address: str):
    cache_key = f"case:{address.lower()}"
    cached = _cache_get(cache_key)
    if cached: return cached
    try:
        data = _get_case_data(address)
        result = {"case": data, "evidenceBundle": None}
        # Cache longer for resolved/defaulted cases (they won't change)
        ttl = 300 if data.get("stateIndex", 0) >= 4 else 60
        _cache_set(cache_key, result, ttl=ttl)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cases/verify-tx")
async def verify_tx(req: VerifyTxRequest):
    if not req.txHash or not req.txHash.startswith("0x"):
        raise HTTPException(status_code=400, detail="txHash is required and must start with 0x")
    try:
        tx      = w3.eth.get_transaction(req.txHash)
        receipt = w3.eth.get_transaction_receipt(req.txHash)
        if not tx or not receipt:
            return {"verified": False, "txHash": req.txHash, "error": "Transaction not found"}

        block        = w3.eth.get_block(receipt["blockNumber"])
        latest_block = w3.eth.block_number
        payer_ok  = req.expectedPayer  is None or tx["from"].lower() == req.expectedPayer.lower()
        payee_ok  = req.expectedPayee  is None or (tx.get("to") or "").lower() == req.expectedPayee.lower()
        amount_ok = req.expectedAmount is None or str(tx["value"]) == req.expectedAmount

        return {
            "verified":        receipt["status"] == 1 and payer_ok and payee_ok and amount_ok,
            "txHash":          req.txHash,
            "blockNumber":     str(receipt["blockNumber"]),
            "blockTimestamp":  block["timestamp"],
            "confirmations":   latest_block - receipt["blockNumber"],
            "payerMatches":    payer_ok,
            "payeeMatches":    payee_ok,
            "amountMatches":   amount_ok,
            "txSucceeded":     receipt["status"] == 1,
            "onChainData": {
                "from":      tx["from"],
                "to":        tx.get("to"),
                "value":     str(tx["value"]),
                "gasUsed":   str(receipt["gasUsed"]),
                "blockHash": receipt["blockHash"].hex()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cases/file-x402")
async def file_x402(req: FileX402Request):
    # Validate the x402 proof before building any transaction
    proof = req.proof
    tx_hash = proof.get("txHash") or proof.get("tx_hash") or proof.get("transactionHash")
    if not tx_hash or not str(tx_hash).startswith("0x"):
        raise HTTPException(status_code=400, detail="proof.txHash is required and must be a valid 0x-prefixed transaction hash")

    try:
        tx      = w3.eth.get_transaction(tx_hash)
        receipt = w3.eth.get_transaction_receipt(tx_hash)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch proof transaction: {str(e)}")

    if not tx or not receipt:
        raise HTTPException(status_code=400, detail="Proof transaction not found on-chain")
    if receipt["status"] != 1:
        raise HTTPException(status_code=400, detail="Proof transaction failed on-chain (status=0)")

    # Verify payer = plaintiff and payee = defendant
    if tx["from"].lower() != req.plaintiffAddress.lower():
        raise HTTPException(
            status_code=400,
            detail=f"Proof transaction sender ({tx['from']}) does not match plaintiff ({req.plaintiffAddress})"
        )
    payee = (tx.get("to") or "").lower()
    if payee and payee != req.defendantAddress.lower():
        raise HTTPException(
            status_code=400,
            detail=f"Proof transaction recipient ({tx.get('to')}) does not match defendant ({req.defendantAddress})"
        )

    # Use the verified txHash as the evidence reference
    evidence_ref = f"x402:{tx_hash}"

    try:
        calldata = factory_contract.encodeABI(
            fn_name="fileNewCase",
            args=[
                Web3.to_checksum_address(req.defendantAddress),
                req.claimDescription,
                evidence_ref
            ]
        )
        return {
            "success":        True,
            "proofVerified":  True,
            "evidenceRef":    evidence_ref,
            "proofTxHash":    tx_hash,
            "unsignedTx": {
                "to":      CONTRACTS["COURT_CASE_FACTORY"],
                "value":   str(BASE_FEE * 2),
                "data":    calldata,
                "chainId": 421614
            },
            "instructions": "Sign and broadcast unsignedTx with plaintiff wallet"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/reputation/{address}")
async def get_agent_reputation(address: str):
    try:
        profile = registry_contract.functions.getAgentProfile(
            Web3.to_checksum_address(address)
        ).call()
        _, rep_score, cases_won, cases_lost, no_shows, is_registered, _ = profile
        score = int(rep_score)
        risk  = risk_level_from_score(score)

        recommendations = {
            "TRUSTED":     "SAFE_TO_DEAL_WITH",
            "GOOD":        "PROCEED_WITH_NORMAL_CARE",
            "CAUTION":     "VERIFY_TERMS_CAREFULLY",
            "HIGH_RISK":   "REQUIRE_ESCROW_OR_PREPAYMENT",
            "BLACKLISTED": "DO_NOT_ENGAGE",
        }
        return {
            "address":          address,
            "reputation_score": score,
            "risk_score":       max(0, min(100, 100 - score)),
            "risk_level":       risk,
            "cases_won":        int(cases_won),
            "cases_lost":       int(cases_lost),
            "no_shows":         int(no_shows),
            "is_registered":    is_registered,
            "recommendation":   recommendations.get(risk, "UNKNOWN"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/discover")
async def discover_agents():
    """Enumerate all registered agents via the registeredAgents[] array on CourtRegistry."""
    cached = _cache_get("agents:discover")
    if cached: return cached
    try:
        # Extend registry ABI with the public array accessor
        reg_full_abi = COURT_REGISTRY_ABI + [
            {
                "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "name": "registeredAgents",
                "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        reg = w3.eth.contract(address=CONTRACTS["COURT_REGISTRY"], abi=reg_full_abi)
        count = int(reg.functions.getRegisteredAgentsCount().call())

        agents = []
        for i in range(count):
            try:
                addr = reg.functions.registeredAgents(i).call()
                profile = reg.functions.getAgentProfile(addr).call()
                _, rep_score, cases_won, cases_lost, no_shows, is_registered, _ = profile
                if not is_registered:
                    continue
                score = int(rep_score)
                agents.append({
                    "id":         f"AGENT-{addr[:8].upper()}",
                    "name":       f"Agent_{addr[2:8]}",
                    "address":    addr,
                    "reputation": score,
                    "riskScore":  max(0, min(100, 100 - score)),
                    "status":     "active",
                    "category":   "GENERAL",
                    "trustTier":  trust_tier_from_score(score),
                })
            except Exception:
                continue

        result = {"agents": agents, "total": len(agents)}
        _cache_set("agents:discover", result, ttl=60)
        return result
    except Exception as e:
        return {"agents": [], "total": 0, "error": str(e)}


@app.get("/agent/{address}")
async def get_agent(address: str):
    cache_key = f"agent:{address.lower()}"
    cached = _cache_get(cache_key)
    if cached: return cached
    try:
        profile = registry_contract.functions.getAgentProfile(
            Web3.to_checksum_address(address)
        ).call()
        erc8004_id, rep_score, cases_won, cases_lost, no_shows, is_registered, registered_at = profile
        score = int(rep_score)
        result = {
            "address":       address,
            "erc8004Id":     erc8004_id.hex(),
            "reputation":    score,
            "riskScore":     max(0, min(100, 100 - score)),
            "risk_level":    risk_level_from_score(score),
            "trustTier":     trust_tier_from_score(score),
            "casesWon":      int(cases_won),
            "casesLost":     int(cases_lost),
            "noShows":       int(no_shows),
            "isRegistered":  is_registered,
            "registeredAt":  int(registered_at),
            "status":        "active" if is_registered else "unregistered",
            "name":          f"Agent_{address[:6]}",
            "category":      "GENERAL",
        }
        _cache_set(cache_key, result, ttl=120)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/record/{address}")
async def get_agent_record(address: str):
    try:
        profile = registry_contract.functions.getAgentProfile(
            Web3.to_checksum_address(address)
        ).call()
        _, rep_score, cases_won, cases_lost, no_shows, is_registered, _ = profile
        score = int(rep_score)
        tier  = trust_tier_from_score(score)

        violations = []
        if int(no_shows) > 0:
            violations.append({
                "code":        "NO_SHOW",
                "description": f"Failed to respond to {no_shows} case(s)",
                "date":        "on-chain",
                "severity":    "high",
                "resolved":    False,
            })
        if score < 50:
            violations.append({
                "code":        "LOW_REPUTATION",
                "description": f"Reputation score below threshold ({score}/100)",
                "date":        "on-chain",
                "severity":    "medium",
                "resolved":    False,
            })

        sanctions = []
        if tier == "banned":
            sanctions.append({
                "type":      "ban",
                "reason":    "Reputation score critically low",
                "issuedAt":  "on-chain",
                "expiresAt": None,
                "active":    True,
            })
        elif tier == "probation":
            sanctions.append({
                "type":      "warning",
                "reason":    "Elevated risk profile",
                "issuedAt":  "on-chain",
                "expiresAt": None,
                "active":    True,
            })

        return {
            "address":   address,
            "riskScore": max(0, min(100, 100 - score)),
            "trustTier": tier,
            "violations": violations,
            "sanctions":  sanctions,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/self-register")
async def agent_self_register(body: dict):
    """
    Gasless registration: the API deployer signs a registerAgent() tx on behalf of
    the caller. No ETH required from the user's wallet.

    Once the CourtRegistry is redeployed with the on-chain selfRegister() function,
    this endpoint will be superseded by the contract call directly.
    """
    address = body.get("address")
    if not address or not Web3.is_address(address):
        raise HTTPException(status_code=400, detail="Valid 'address' required")
    if not PRIVATE_KEY:
        raise HTTPException(status_code=503, detail="Registration signing not configured")

    try:
        checksum_addr = Web3.to_checksum_address(address)

        # Check if already registered
        profile = registry_contract.functions.getAgentProfile(checksum_addr).call()
        if profile[5]:  # isRegistered
            return {
                "success":      True,
                "already":      True,
                "address":      checksum_addr,
                "message":      "Agent already registered",
                "reputation":   int(profile[1]),
            }

        # Generate deterministic erc8004Id
        import hashlib
        erc8004_bytes = Web3.keccak(
            text=f"erc8004:{checksum_addr.lower()}{int(time.time())}"
        )

        deployer = w3.eth.account.from_key(PRIVATE_KEY)
        nonce    = w3.eth.get_transaction_count(deployer.address)
        gas_price = w3.eth.gas_price

        tx = registry_contract.functions.registerAgent(
            checksum_addr, erc8004_bytes
        ).build_transaction({
            "from":     deployer.address,
            "nonce":    nonce,
            "gas":      200_000,
            "gasPrice": gas_price,
            "chainId":  421614,
        })

        signed  = deployer.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

        if receipt["status"] != 1:
            raise HTTPException(status_code=500, detail="Registration tx reverted")

        _cache_del("agents:discover", "stats:overview")
        return {
            "success":    True,
            "already":    False,
            "address":    checksum_addr,
            "txHash":     tx_hash.hex(),
            "blockNumber":receipt["blockNumber"],
            "message":    "Agent registered successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/stats/overview")
async def stats_overview():
    cached = _cache_get("stats:overview")
    if cached: return cached
    try:
        all_cases    = factory_contract.functions.getAllCases().call()
        total_cases  = len(all_cases)
        agent_count  = int(registry_contract.functions.getRegisteredAgentsCount().call())

        active = pending = resolved = 0
        for addr in all_cases:
            try:
                case = w3.eth.contract(address=addr, abi=COURT_CASE_ABI)
                s = case.functions.state().call()
                if s in (2, 3):   active  += 1
                elif s in (0, 1): pending += 1
                elif s in (4, 5, 6): resolved += 1
            except Exception:
                continue

        # Count agents with reputation > 80 (eligible judges / active validators)
        active_validators = 0
        try:
            from web3 import Web3 as _W3
            reg_abi = [
                {"inputs": [], "name": "getRegisteredAgentsCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
                {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "registeredAgents", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
                {"inputs": [{"internalType": "address", "name": "_agent", "type": "address"}], "name": "getAgentProfile", "outputs": [{"internalType": "bytes32", "name": "erc8004Id", "type": "bytes32"}, {"internalType": "uint256", "name": "reputationScore", "type": "uint256"}, {"internalType": "uint256", "name": "casesWon", "type": "uint256"}, {"internalType": "uint256", "name": "casesLost", "type": "uint256"}, {"internalType": "uint256", "name": "noShows", "type": "uint256"}, {"internalType": "bool", "name": "isRegistered", "type": "bool"}, {"internalType": "uint256", "name": "registeredAt", "type": "uint256"}], "stateMutability": "view", "type": "function"},
            ]
            reg = w3.eth.contract(address=CONTRACTS["COURT_REGISTRY"], abi=reg_abi)
            count = int(reg.functions.getRegisteredAgentsCount().call())
            for i in range(count):
                try:
                    addr = reg.functions.registeredAgents(i).call()
                    profile = reg.functions.getAgentProfile(addr).call()
                    if profile[5] and int(profile[1]) > 80:  # isRegistered and rep > 80
                        active_validators += 1
                except Exception:
                    pass
        except Exception:
            pass

        result = {
            "totalCases":      total_cases,
            "activeCases":     active,
            "pendingCases":    pending,
            "resolvedCases":   resolved,
            "registeredAgents":agent_count,
            "activeValidators":active_validators,
        }
        _cache_set("stats:overview", result, ttl=30)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/validate/pending")
async def validate_pending():
    """Return cases in Active (2) or Deliberating (3) state — open for validator votes."""
    try:
        all_cases = factory_contract.functions.getAllCases().call()
        pending = []
        for addr in all_cases:
            try:
                data = _get_case_data(addr)
                if data["stateIndex"] in (2, 3):
                    total_stake = int(data["plaintiffStake"]) + int(data["defendantStake"])
                    data["stake"] = f"{total_stake / 1e18:.4f} ETH"
                    pending.append(data)
            except Exception:
                continue
        return {"cases": pending, "total": len(pending)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/validate/stats/{address}")
async def validate_stats(address: str):
    try:
        profile = registry_contract.functions.getAgentProfile(
            Web3.to_checksum_address(address)
        ).call()
        _, rep_score, cases_won, cases_lost, no_shows, is_registered, _ = profile
        total     = int(cases_won) + int(cases_lost)
        accuracy  = round((int(cases_won) / total) * 100) if total > 0 else 0
        score     = int(rep_score)

        rank_map = [(90, "EXPERT"), (70, "SENIOR"), (50, "STANDARD"), (30, "NOVICE")]
        rank = "NOVICE"
        for threshold, r in rank_map:
            if score >= threshold:
                rank = r
                break

        # Read real JRX staked for this address
        try:
            staked_wei = registry_contract.functions.judgeStakes(
                Web3.to_checksum_address(address)
            ).call()
            staked_str = f"{int(staked_wei) // 10**18} JRX"
        except Exception:
            staked_str = "0 JRX"

        return {
            "address":       address,
            "totalValidated":total,
            "accuracy":      accuracy,
            "rewards":       f"{total * 50} JRX",
            "rank":          rank,
            "staked":        staked_str,
            "casesWon":      int(cases_won),
            "casesLost":     int(cases_lost),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/file-case")
async def agent_file_case(req: AgentFileCaseRequest):
    try:
        calldata = factory_contract.encodeABI(
            fn_name="fileNewCase",
            args=[
                Web3.to_checksum_address(req.defendant),
                req.claim,
                req.evidence_hash or "QmDefaultEvidence"
            ]
        )
        return {
            "status":     "ready",
            "ipfsHash":   req.evidence_hash or "QmDefaultEvidence",
            "unsigned_tx": {
                "to":      CONTRACTS["COURT_CASE_FACTORY"],
                "value":   str(BASE_FEE * 2),
                "data":    calldata,
                "chainId": 421614
            },
            "instructions": "Sign and broadcast unsigned_tx with plaintiff wallet"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/appeal")
async def agent_file_appeal(req: JobAppealRequest):
    """
    Build an unsigned tx for factory.fileAppeal() — ERC-8183 job appeal.
    Provider calls this after an evaluator rejection opens an appeal window.
    The caller must sign and broadcast the tx (stakes 2x BASE_FEE = 0.002 ETH).
    """
    try:
        hook_addr = req.hook_contract or CONTRACTS.get("AGENT_COURT_HOOK", "0xD14a340F8C61A8F4D4269Ef7Ba8357cFD498925F")
        calldata = factory_contract.encodeABI(
            fn_name="fileAppeal",
            args=[
                req.job_id,
                Web3.to_checksum_address(req.job_contract),
                Web3.to_checksum_address(hook_addr),
                req.evidence_hash or "QmAppealEvidence"
            ]
        )
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      CONTRACTS["COURT_CASE_FACTORY"],
                "value":   str(BASE_FEE * 2),
                "data":    calldata,
                "chainId": 421614
            },
            "instructions": (
                "Sign and broadcast unsigned_tx with the provider wallet. "
                "After broadcast, ask the Jurex admin to call "
                "hook.linkCase(job_id, deployed_case_address) to finalize the appeal link."
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cases/{address}/respond")
async def case_respond(address: str):
    try:
        case = w3.eth.contract(address=Web3.to_checksum_address(address), abi=COURT_CASE_ABI)
        calldata = case.encodeABI(fn_name="respondToCase", args=[])
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      Web3.to_checksum_address(address),
                "value":   str(BASE_FEE),
                "data":    calldata,
                "chainId": 421614
            },
            "instructions": "Sign and broadcast unsigned_tx with defendant wallet"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cases/{address}/assign-judges")
async def case_assign_judges(address: str, req: AssignJudgesRequest):
    if len(req.judges) != 3:
        raise HTTPException(status_code=400, detail="Exactly 3 judges required")
    try:
        case = w3.eth.contract(address=Web3.to_checksum_address(address), abi=COURT_CASE_ABI)
        judges_cs = [Web3.to_checksum_address(j) for j in req.judges]
        calldata = case.encodeABI(fn_name="assignJudges", args=[judges_cs])
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      Web3.to_checksum_address(address),
                "value":   "0",
                "data":    calldata,
                "chainId": 421614
            },
            "instructions": "Sign and broadcast unsigned_tx with any wallet"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cases/{address}/vote")
async def case_vote(address: str, req: VoteRequest):
    try:
        case = w3.eth.contract(address=Web3.to_checksum_address(address), abi=COURT_CASE_ABI)
        calldata = case.encodeABI(fn_name="submitVote", args=[req.plaintiff_wins])
        _cache_del(f"case:{address.lower()}", "stats:overview")
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      Web3.to_checksum_address(address),
                "value":   "0",
                "data":    calldata,
                "chainId": 421614
            },
            "instructions": "Sign and broadcast unsigned_tx with assigned judge wallet"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cases/{address}/resolve-timeout")
async def case_resolve_timeout(address: str):
    try:
        case = w3.eth.contract(address=Web3.to_checksum_address(address), abi=COURT_CASE_ABI)
        calldata = case.encodeABI(fn_name="resolveAfterDeadline", args=[])
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      Web3.to_checksum_address(address),
                "value":   "0",
                "data":    calldata,
                "chainId": 421614
            },
            "instructions": "Sign and broadcast unsigned_tx with any wallet (only works after 30-min deliberation timeout)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cases/{address}/trigger-default")
async def case_trigger_default(address: str):
    try:
        case = w3.eth.contract(address=Web3.to_checksum_address(address), abi=COURT_CASE_ABI)
        calldata = case.encodeABI(fn_name="missedDeadline", args=[])
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      Web3.to_checksum_address(address),
                "value":   "0",
                "data":    calldata,
                "chainId": 421614
            },
            "instructions": "Sign and broadcast unsigned_tx with any wallet (only works after 5-min deadline)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── JRX Token endpoints ───────────────────────────────────────

@app.get("/token/balance/{address}")
async def token_balance(address: str):
    """Return JRX balance for an address."""
    try:
        jrx = _get_jrx_contract()
        raw = jrx.functions.balanceOf(Web3.to_checksum_address(address)).call()
        last_drip = jrx.functions.lastDripAt(Web3.to_checksum_address(address)).call()
        next_drip = last_drip + 86400  # 24h cooldown
        return {
            "address":      address,
            "balance_raw":  str(raw),
            "balance_jrx":  str(raw // 10**18),
            "next_drip_at": next_drip if last_drip > 0 else 0,
            "can_drip":     int(time.time()) >= next_drip,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/token/drip")
async def token_drip(body: dict):
    """
    Build an unsigned tx to call JRXToken.drip(to).
    The caller signs and broadcasts it — they get 10,000 JRX free (once per 24h).
    """
    to = body.get("to") or body.get("address")
    if not to:
        raise HTTPException(status_code=400, detail="'to' address required")
    try:
        jrx = _get_jrx_contract()
        calldata = jrx.encodeABI(fn_name="drip", args=[Web3.to_checksum_address(to)])
        return {
            "unsigned_tx": {
                "to":      CONTRACTS["JRX_TOKEN"],
                "value":   "0",
                "data":    calldata,
                "chainId": 421614,
            },
            "instructions": "Sign and broadcast to receive 10,000 JRX (24h cooldown)",
            "faucet_amount": "10000 JRX",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/token/approve-registry")
async def token_approve_registry(body: dict):
    """
    Build unsigned approve tx so registry can pull JRX for staking.
    amount_jrx: human units (e.g. "1000" means 1000 JRX).
    """
    address    = body.get("address")
    amount_jrx = body.get("amount_jrx", "1000")
    if not address:
        raise HTTPException(status_code=400, detail="'address' required")
    try:
        amount_wei = int(float(amount_jrx) * 10**18)
        jrx = _get_jrx_contract()
        calldata = jrx.encodeABI(
            fn_name="approve",
            args=[Web3.to_checksum_address(CONTRACTS["COURT_REGISTRY"]), amount_wei]
        )
        return {
            "unsigned_tx": {
                "to":      CONTRACTS["JRX_TOKEN"],
                "value":   "0",
                "data":    calldata,
                "chainId": 421614,
            },
            "instructions": f"Sign and broadcast to approve registry to spend {amount_jrx} JRX",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Judge staking endpoints ───────────────────────────────────

@app.get("/judges/pool")
async def judges_pool():
    """Return the current JRX judge staker pool size and members."""
    try:
        reg = _get_registry_ext()
        pool_size = int(reg.functions.getJudgePoolSize().call())
        return {
            "pool_size": pool_size,
            "stake_min_jrx": "1000",
            "note": "Addresses in pool staked >= 1000 JRX and are eligible for random judge selection",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/judges/stake/{address}")
async def judge_stake_info(address: str):
    """Return how much JRX an address has staked as a judge."""
    try:
        reg = _get_registry_ext()
        stake = reg.functions.judgeStakes(Web3.to_checksum_address(address)).call()
        stake_jrx = int(stake) // 10**18
        return {
            "address":    address,
            "stake_raw":  str(stake),
            "stake_jrx":  stake_jrx,
            "eligible":   stake_jrx >= 1000,
            "stake_min":  "1000 JRX",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/judges/stake")
async def judge_stake(req: StakeRequest):
    """
    Build unsigned tx to stake JRX and enter the judge pool.
    Prerequisite: caller must first approve the registry via /token/approve-registry.
    """
    try:
        amount_wei = int(float(req.amount_jrx) * 10**18)
        reg = _get_registry_ext()
        calldata = reg.encodeABI(fn_name="stakeAsJudge", args=[amount_wei])
        return {
            "unsigned_tx": {
                "to":      CONTRACTS["COURT_REGISTRY"],
                "value":   "0",
                "data":    calldata,
                "chainId": 421614,
            },
            "instructions": f"Sign and broadcast to stake {req.amount_jrx} JRX as a judge",
            "prerequisite": "Must call /token/approve-registry first",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/judges/unstake")
async def judge_unstake(body: dict):
    """Build unsigned tx to unstake all JRX and leave the judge pool."""
    try:
        reg = _get_registry_ext()
        calldata = reg.encodeABI(fn_name="unstakeJudge", args=[])
        return {
            "unsigned_tx": {
                "to":      CONTRACTS["COURT_REGISTRY"],
                "value":   "0",
                "data":    calldata,
                "chainId": 421614,
            },
            "instructions": "Sign and broadcast to withdraw all staked JRX",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Random judge assignment (factory keeper) ──────────────────

@app.post("/cases/{address}/assign-judges-random")
async def case_assign_judges_random(address: str, req: AssignJudgesRandomRequest):
    """
    Build unsigned tx to let the factory randomly assign judges from the JRX staker pool.
    Can be called by anyone (acts as a keeper) once the case is in Active or Appealed state.
    For appeal rounds the factory automatically selects 5 judges instead of 3.
    """
    try:
        factory_ext = _get_factory_ext()
        calldata = factory_ext.encodeABI(
            fn_name="assignJudgesToCase",
            args=[Web3.to_checksum_address(address), req.seed or 0]
        )
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      CONTRACTS["COURT_CASE_FACTORY"],
                "value":   "0",
                "data":    calldata,
                "chainId": 421614,
            },
            "instructions": "Sign and broadcast with any wallet to trigger random judge selection",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Appeal ────────────────────────────────────────────────────

@app.post("/cases/{address}/appeal")
async def case_appeal(address: str):
    """
    Build unsigned tx for the losing party to file an appeal.
    Must be called within 10 minutes of verdict. Requires 0.0003 ETH bond.
    Factory then assigns 5 fresh judges via /cases/{address}/assign-judges-random.
    """
    try:
        case = w3.eth.contract(address=Web3.to_checksum_address(address), abi=COURT_CASE_ABI)
        calldata = case.encodeABI(fn_name="fileAppeal", args=[])
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      Web3.to_checksum_address(address),
                "value":   str(APPEAL_BOND),
                "data":    calldata,
                "chainId": 421614,
            },
            "appeal_bond_eth": "0.0003",
            "instructions": "Sign with the losing party's wallet within 10 min of verdict. Then call /assign-judges-random.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Fee sweep ─────────────────────────────────────────────────

@app.post("/cases/{address}/sweep-fees")
async def case_sweep_fees(address: str, req: SweepRequest):
    """
    Build unsigned tx for factory owner to sweep court fees from a case to a treasury address.
    Only the factory owner's wallet can broadcast this successfully.
    """
    try:
        factory_ext = _get_factory_ext()
        calldata = factory_ext.encodeABI(
            fn_name="sweepFeesFromCase",
            args=[
                Web3.to_checksum_address(address),
                Web3.to_checksum_address(req.treasury),
            ]
        )
        return {
            "status": "ready",
            "unsigned_tx": {
                "to":      CONTRACTS["COURT_CASE_FACTORY"],
                "value":   "0",
                "data":    calldata,
                "chainId": 421614,
            },
            "instructions": "Sign with factory owner wallet to sweep fees to treasury",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
