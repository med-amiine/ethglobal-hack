import fs from 'fs'
import path from 'path'

export interface VerifiedEmployer {
  address: string
  nullifierHash: string
  verifiedAt: number
}

export interface VerifiedJudge {
  address: string
  nullifierHash: string
  verifiedAt: number
}

const EMPLOYERS_FILE = path.join(process.cwd(), 'data', 'employers.json')
const JUDGES_FILE = path.join(process.cwd(), 'data', 'judges.json')

function ensureFile(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2))
  }
}

function readEmployers(): Record<string, VerifiedEmployer> {
  ensureFile(EMPLOYERS_FILE)
  const data = fs.readFileSync(EMPLOYERS_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeEmployers(data: Record<string, VerifiedEmployer>) {
  ensureFile(EMPLOYERS_FILE)
  fs.writeFileSync(EMPLOYERS_FILE, JSON.stringify(data, null, 2))
}

function readJudges(): Record<string, VerifiedJudge> {
  ensureFile(JUDGES_FILE)
  const data = fs.readFileSync(JUDGES_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeJudges(data: Record<string, VerifiedJudge>) {
  ensureFile(JUDGES_FILE)
  fs.writeFileSync(JUDGES_FILE, JSON.stringify(data, null, 2))
}

/**
 * Verify World ID proof for employer registration
 * In production, verify against World ID API
 */
export async function verifyEmployerProof(
  proof: string,
  merkleRoot: string,
  nullifierHash: string,
  verificationLevel: string,
  address: string
): Promise<{ verified: boolean; address: string; nullifierHash: string }> {
  console.log(
    `[World ID] Verifying employer ${address} with verification level ${verificationLevel}`
  )

  // In production: call World ID API to verify proof
  // For hackathon: simulate verification
  if (!address || !nullifierHash) {
    throw new Error('Invalid proof data')
  }

  const employers = readEmployers()
  employers[address] = {
    address,
    nullifierHash,
    verifiedAt: Date.now(),
  }
  writeEmployers(employers)

  console.log(`[World ID] Employer verified: ${address}`)

  return {
    verified: true,
    address,
    nullifierHash,
  }
}

/**
 * Verify World ID proof for judge registration
 */
export async function verifyJudgeProof(
  proof: string,
  merkleRoot: string,
  nullifierHash: string,
  address: string
): Promise<{ verified: boolean; address: string; nullifierHash: string }> {
  console.log(`[World ID] Verifying judge ${address}`)

  if (!address || !nullifierHash) {
    throw new Error('Invalid proof data')
  }

  const judges = readJudges()
  judges[address] = {
    address,
    nullifierHash,
    verifiedAt: Date.now(),
  }
  writeJudges(judges)

  console.log(`[World ID] Judge verified: ${address}`)

  return {
    verified: true,
    address,
    nullifierHash,
  }
}

/**
 * Check if an address is a verified employer
 */
export function isVerifiedEmployer(address: string): boolean {
  const employers = readEmployers()
  return !!employers[address.toLowerCase()]
}

/**
 * Check if an address is a verified judge
 */
export function isVerifiedJudge(address: string): boolean {
  const judges = readJudges()
  return !!judges[address.toLowerCase()]
}

/**
 * Get all verified employers
 */
export function getAllVerifiedEmployers(): VerifiedEmployer[] {
  const employers = readEmployers()
  return Object.values(employers)
}

/**
 * Get all verified judges
 */
export function getAllVerifiedJudges(): VerifiedJudge[] {
  const judges = readJudges()
  return Object.values(judges)
}
