import fs from 'fs'
import path from 'path'

export interface PayrollRecord {
  jobId: string
  unlinkAccountId: string
  totalBudgetUSDC: number
  dailyRateUSDC: number
  daysWorked: number
  amountReleased: number
  createdAt: number
  updatedAt: number
}

const PAYROLL_FILE = path.join(process.cwd(), 'data', 'payroll.json')

function ensurePayrollFile() {
  const dir = path.dirname(PAYROLL_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(PAYROLL_FILE)) {
    fs.writeFileSync(PAYROLL_FILE, JSON.stringify({}, null, 2))
  }
}

function readPayroll(): Record<string, PayrollRecord> {
  ensurePayrollFile()
  const data = fs.readFileSync(PAYROLL_FILE, 'utf-8')
  return JSON.parse(data)
}

function writePayroll(data: Record<string, PayrollRecord>) {
  ensurePayrollFile()
  fs.writeFileSync(PAYROLL_FILE, JSON.stringify(data, null, 2))
}

/**
 * Simulate Unlink private payroll account creation and deposit
 * In production, this would call the Unlink API
 */
export async function lockPayrollFunds(
  jobId: string,
  employerAddress: string,
  totalBudgetUSDC: number,
  dailyRateUSDC: number
): Promise<{ success: boolean; unlinkAccountId: string }> {
  console.log(
    `[Payroll] Locking funds for job ${jobId}: ${totalBudgetUSDC} USDC (${dailyRateUSDC}/day)`
  )

  // Simulate Unlink account creation
  const unlinkAccountId = `unlink_${jobId.slice(0, 8)}_${Date.now()}`

  const payroll = readPayroll()
  payroll[jobId] = {
    jobId,
    unlinkAccountId,
    totalBudgetUSDC,
    dailyRateUSDC,
    daysWorked: 0,
    amountReleased: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  writePayroll(payroll)

  console.log(`[Payroll] Account created: ${unlinkAccountId}`)
  return { success: true, unlinkAccountId }
}

/**
 * Release one day's pay to the worker
 * Simulates Unlink private transfer
 */
export async function releaseDayPay(
  jobId: string,
  workerAddress: string
): Promise<{ success: boolean; amountReleased: number; daysWorked: number }> {
  console.log(`[Payroll] Releasing day pay for job ${jobId} to ${workerAddress}`)

  const payroll = readPayroll()
  const record = payroll[jobId]

  if (!record) {
    throw new Error(`No payroll record found for job ${jobId}`)
  }

  const amountToRelease = record.dailyRateUSDC
  const newTotal = record.amountReleased + amountToRelease

  if (newTotal > record.totalBudgetUSDC) {
    throw new Error(
      `Payment would exceed budget. Released: ${record.amountReleased}, Total: ${record.totalBudgetUSDC}`
    )
  }

  record.amountReleased = newTotal
  record.daysWorked += 1
  record.updatedAt = Date.now()

  writePayroll(payroll)

  console.log(
    `[Payroll] Released ${amountToRelease} USDC. Days worked: ${record.daysWorked}`
  )

  return {
    success: true,
    amountReleased: newTotal,
    daysWorked: record.daysWorked,
  }
}

/**
 * Refund remaining budget to employer
 */
export async function refundRemaining(jobId: string): Promise<{ success: boolean; amount: number }> {
  console.log(`[Payroll] Refunding remaining balance for job ${jobId}`)

  const payroll = readPayroll()
  const record = payroll[jobId]

  if (!record) {
    throw new Error(`No payroll record found for job ${jobId}`)
  }

  const refundAmount = record.totalBudgetUSDC - record.amountReleased

  if (refundAmount <= 0) {
    console.log(`[Payroll] No balance to refund`)
    return { success: true, amount: 0 }
  }

  console.log(`[Payroll] Refunding ${refundAmount} USDC`)

  return { success: true, amount: refundAmount }
}

export function getPayrollRecord(jobId: string): PayrollRecord | null {
  const payroll = readPayroll()
  return payroll[jobId] || null
}

export function getAllPayrollRecords(): Record<string, PayrollRecord> {
  return readPayroll()
}
