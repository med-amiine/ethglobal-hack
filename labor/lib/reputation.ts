import fs from 'fs'
import path from 'path'

export interface WorkerReputation {
  address: string
  totalJobsCompleted: number
  totalDaysWorked: number
  disputesOpened: number
  disputesWon: number
  verifiedEmployers: string[]
  firstJobDate: number
  reputationScore: number
}

const REPUTATION_FILE = path.join(process.cwd(), 'data', 'workers.json')

function ensureFile() {
  const dir = path.dirname(REPUTATION_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(REPUTATION_FILE)) {
    fs.writeFileSync(REPUTATION_FILE, JSON.stringify({}, null, 2))
  }
}

function readWorkers(): Record<string, WorkerReputation> {
  ensureFile()
  const data = fs.readFileSync(REPUTATION_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeWorkers(data: Record<string, WorkerReputation>) {
  ensureFile()
  fs.writeFileSync(REPUTATION_FILE, JSON.stringify(data, null, 2))
}

/**
 * Calculate reputation score based on work history
 */
function calculateScore(rep: WorkerReputation): number {
  let score = 500 // Base score

  // +50 per completed job (max +300)
  score += Math.min(rep.totalJobsCompleted * 50, 300)

  // +10 per day worked (max +200)
  score += Math.min(rep.totalDaysWorked * 10, 200)

  // -100 per dispute lost
  score -= Math.max(0, rep.disputesOpened - rep.disputesWon) * 100

  // +50 per verified employer confirmation
  score += rep.verifiedEmployers.length * 50

  // Clamp 0-1000
  return Math.max(0, Math.min(1000, score))
}

/**
 * Get or initialize worker reputation
 */
function getOrInitWorker(address: string): WorkerReputation {
  const workers = readWorkers()

  if (!workers[address.toLowerCase()]) {
    workers[address.toLowerCase()] = {
      address: address.toLowerCase(),
      totalJobsCompleted: 0,
      totalDaysWorked: 0,
      disputesOpened: 0,
      disputesWon: 0,
      verifiedEmployers: [],
      firstJobDate: Date.now(),
      reputationScore: 500,
    }
    writeWorkers(workers)
  }

  return workers[address.toLowerCase()]
}

/**
 * Record completed job
 */
export function completeJob(
  workerAddress: string,
  employerAddress: string,
  daysWorked: number
): void {
  const workers = readWorkers()
  const worker = getOrInitWorker(workerAddress)

  worker.totalJobsCompleted += 1
  worker.totalDaysWorked += daysWorked

  if (!worker.verifiedEmployers.includes(employerAddress)) {
    worker.verifiedEmployers.push(employerAddress)
  }

  worker.reputationScore = calculateScore(worker)

  workers[workerAddress.toLowerCase()] = worker
  writeWorkers(workers)
}

/**
 * Record dispute
 */
export function openDispute(workerAddress: string): void {
  const workers = readWorkers()
  const worker = getOrInitWorker(workerAddress)

  worker.disputesOpened += 1
  worker.reputationScore = calculateScore(worker)

  workers[workerAddress.toLowerCase()] = worker
  writeWorkers(workers)
}

/**
 * Record dispute resolution
 */
export function resolveDispute(workerAddress: string, workerWon: boolean): void {
  const workers = readWorkers()
  const worker = getOrInitWorker(workerAddress)

  if (workerWon) {
    worker.disputesWon += 1
  }

  worker.reputationScore = calculateScore(worker)

  workers[workerAddress.toLowerCase()] = worker
  writeWorkers(workers)
}

/**
 * Get worker reputation
 */
export function getReputation(workerAddress: string): WorkerReputation {
  return getOrInitWorker(workerAddress)
}
