import fs from 'fs'
import path from 'path'

export interface Dispute {
  disputeId: string
  jobId: string
  opener: string
  reason: string
  openedBy: 'worker' | 'employer'
  resolved: boolean
  resolution?: 'worker_paid' | 'employer_refunded'
  createdAt: number
  resolvedAt?: number
}

export interface Ruling {
  judge: string
  hasRuled: boolean
  decision: 'worker' | 'employer'
  submittedAt?: number
}

const DISPUTES_FILE = path.join(process.cwd(), 'data', 'disputes.json')
const RULINGS_FILE = path.join(process.cwd(), 'data', 'rulings.json')

function ensureFile(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2))
  }
}

function readDisputes(): Record<string, Dispute> {
  ensureFile(DISPUTES_FILE)
  const data = fs.readFileSync(DISPUTES_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeDisputes(data: Record<string, Dispute>) {
  ensureFile(DISPUTES_FILE)
  fs.writeFileSync(DISPUTES_FILE, JSON.stringify(data, null, 2))
}

function readRulings(): Record<string, Record<string, Ruling>> {
  ensureFile(RULINGS_FILE)
  const data = fs.readFileSync(RULINGS_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeRulings(data: Record<string, Record<string, Ruling>>) {
  ensureFile(RULINGS_FILE)
  fs.writeFileSync(RULINGS_FILE, JSON.stringify(data, null, 2))
}

/**
 * Open a new dispute
 */
export function openDispute(
  jobId: string,
  reason: string,
  openedBy: 'worker' | 'employer',
  opener: string
): string {
  console.log(`[Disputes] Opening dispute for job ${jobId} by ${openedBy}`)

  const disputeId = `dispute_${jobId.slice(0, 8)}_${Date.now()}`

  const disputes = readDisputes()
  disputes[disputeId] = {
    disputeId,
    jobId,
    opener,
    reason,
    openedBy,
    resolved: false,
    createdAt: Date.now(),
  }
  writeDisputes(disputes)

  console.log(`[Disputes] Dispute opened: ${disputeId}`)

  return disputeId
}

/**
 * Submit a ruling on a dispute
 */
export function submitRuling(
  disputeId: string,
  judge: string,
  decision: 'worker' | 'employer'
): { success: boolean; resolved: boolean; resolution?: string } {
  console.log(`[Disputes] Judge ${judge} submitting ruling for dispute ${disputeId}`)

  const disputes = readDisputes()
  const dispute = disputes[disputeId]

  if (!dispute) {
    throw new Error(`Dispute not found: ${disputeId}`)
  }

  if (dispute.resolved) {
    throw new Error(`Dispute already resolved: ${disputeId}`)
  }

  const rulings = readRulings()
  if (!rulings[disputeId]) {
    rulings[disputeId] = {}
  }

  if (rulings[disputeId][judge]) {
    throw new Error(`Judge already ruled on this dispute`)
  }

  rulings[disputeId][judge] = {
    judge,
    hasRuled: true,
    decision,
    submittedAt: Date.now(),
  }
  writeRulings(rulings)

  // Check for 2/3 majority
  const judges = Object.values(rulings[disputeId])
  const workerVotes = judges.filter((r) => r.decision === 'worker').length
  const employerVotes = judges.filter((r) => r.decision === 'employer').length

  let resolved = false
  let resolution: string | undefined

  // Need at least 2 judges and 2/3 majority
  if (judges.length >= 2) {
    if (workerVotes >= 2 && workerVotes > employerVotes) {
      dispute.resolved = true
      dispute.resolution = 'worker_paid'
      dispute.resolvedAt = Date.now()
      resolved = true
      resolution = 'worker_paid'
    } else if (employerVotes >= 2 && employerVotes > workerVotes) {
      dispute.resolved = true
      dispute.resolution = 'employer_refunded'
      dispute.resolvedAt = Date.now()
      resolved = true
      resolution = 'employer_refunded'
    }
  }

  writeDisputes(disputes)

  console.log(
    `[Disputes] Ruling recorded. Votes: ${workerVotes} worker, ${employerVotes} employer. Resolved: ${resolved}`
  )

  return {
    success: true,
    resolved,
    resolution,
  }
}

/**
 * Get dispute details
 */
export function getDispute(disputeId: string): Dispute | null {
  const disputes = readDisputes()
  return disputes[disputeId] || null
}

/**
 * Get all rulings for a dispute
 */
export function getDisputeRulings(disputeId: string): Ruling[] {
  const rulings = readRulings()
  return Object.values(rulings[disputeId] || {})
}

/**
 * Get all disputes for a job
 */
export function getJobDisputes(jobId: string): Dispute[] {
  const disputes = readDisputes()
  return Object.values(disputes).filter((d) => d.jobId === jobId)
}
