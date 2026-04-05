import fs from 'fs'
import path from 'path'

export interface Job {
  jobId: string
  employer: string
  worker?: string
  dailyRateUSDC: number
  startDate: number
  endDate: number
  active: boolean
  hederaTopicId?: string
  location: string
  title: string
  description: string
  createdAt: number
}

const JOBS_FILE = path.join(process.cwd(), 'data', 'jobs.json')

function ensureJobsFile() {
  const dir = path.dirname(JOBS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify({}, null, 2))
  }
}

function readJobs(): Record<string, Job> {
  ensureJobsFile()
  const data = fs.readFileSync(JOBS_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeJobs(data: Record<string, Job>) {
  ensureJobsFile()
  fs.writeFileSync(JOBS_FILE, JSON.stringify(data, null, 2))
}

/**
 * Create a new job
 */
export function createJob(
  employer: string,
  title: string,
  description: string,
  dailyRateUSDC: number,
  location: string,
  startDate: number,
  endDate: number
): string {
  console.log(`[Jobs] Creating job "${title}" by ${employer.slice(0, 6)}...`)

  const jobId = `job_${employer.slice(0, 8)}_${Date.now()}`

  const jobs = readJobs()
  jobs[jobId] = {
    jobId,
    employer,
    dailyRateUSDC,
    startDate,
    endDate,
    active: true,
    location,
    title,
    description,
    createdAt: Date.now(),
  }
  writeJobs(jobs)

  console.log(`[Jobs] Job created: ${jobId}`)
  return jobId
}

/**
 * Assign a worker to a job
 */
export function assignWorker(jobId: string, worker: string): void {
  console.log(`[Jobs] Assigning ${worker.slice(0, 6)}... to job ${jobId}`)

  const jobs = readJobs()
  const job = jobs[jobId]

  if (!job) {
    throw new Error(`Job not found: ${jobId}`)
  }

  job.worker = worker
  writeJobs(jobs)
}

/**
 * Get a job
 */
export function getJob(jobId: string): Job | null {
  const jobs = readJobs()
  return jobs[jobId] || null
}

/**
 * Get all jobs by employer
 */
export function getEmployerJobs(employer: string): Job[] {
  const jobs = readJobs()
  return Object.values(jobs).filter((j) => j.employer.toLowerCase() === employer.toLowerCase())
}

/**
 * Get all jobs for a worker
 */
export function getWorkerJobs(worker: string): Job[] {
  const jobs = readJobs()
  return Object.values(jobs).filter(
    (j) => j.worker && j.worker.toLowerCase() === worker.toLowerCase()
  )
}

/**
 * Get all active jobs
 */
export function getActiveJobs(): Job[] {
  const jobs = readJobs()
  return Object.values(jobs).filter((j) => j.active)
}

/**
 * Complete a job
 */
export function completeJob(jobId: string): void {
  console.log(`[Jobs] Completing job ${jobId}`)

  const jobs = readJobs()
  const job = jobs[jobId]

  if (!job) {
    throw new Error(`Job not found: ${jobId}`)
  }

  job.active = false
  writeJobs(jobs)
}

/**
 * Set Hedera topic ID for a job
 */
export function setHederaTopic(jobId: string, topicId: string): void {
  const jobs = readJobs()
  const job = jobs[jobId]

  if (!job) {
    throw new Error(`Job not found: ${jobId}`)
  }

  job.hederaTopicId = topicId
  writeJobs(jobs)
}
