import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'

export interface Payment {
  paymentId: string
  jobId: string
  workerAddress: string
  amountUSDC: number
  status: 'pending' | 'confirmed' | 'failed'
  createdAt: number
  confirmedAt?: number
  txHash?: string
}

const PAYMENTS_FILE = path.join(process.cwd(), 'data', 'payments.json')

function ensurePaymentsFile() {
  const dir = path.dirname(PAYMENTS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(PAYMENTS_FILE)) {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify({}, null, 2))
  }
}

function readPayments(): Record<string, Payment> {
  ensurePaymentsFile()
  const data = fs.readFileSync(PAYMENTS_FILE, 'utf-8')
  return JSON.parse(data)
}

function writePayments(data: Record<string, Payment>) {
  ensurePaymentsFile()
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(data, null, 2))
}

/**
 * Create a WalletConnect Pay payment request
 */
export async function createPayment(
  jobId: string,
  workerAddress: string,
  amountUSDC: number
): Promise<{
  paymentId: string
  paymentUrl: string
  qrCodeData: string
}> {
  console.log(`[Payments] Creating payment for ${workerAddress}: ${amountUSDC} USDC`)

  const paymentId = `pay_${jobId.slice(0, 8)}_${Date.now()}`

  // Create payment record
  const payments = readPayments()
  payments[paymentId] = {
    paymentId,
    jobId,
    workerAddress,
    amountUSDC,
    status: 'pending',
    createdAt: Date.now(),
  }
  writePayments(payments)

  // Generate QR code for payment URL
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/confirm/${paymentId}`

  const qrCodeData = await QRCode.toDataURL(paymentUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
  })

  console.log(`[Payments] Payment created: ${paymentId}`)

  return {
    paymentId,
    paymentUrl,
    qrCodeData,
  }
}

/**
 * Confirm a payment was received
 */
export async function confirmPayment(
  paymentId: string,
  txHash?: string
): Promise<{ success: boolean; confirmed: boolean }> {
  console.log(`[Payments] Confirming payment ${paymentId}`)

  const payments = readPayments()
  const payment = payments[paymentId]

  if (!payment) {
    throw new Error(`Payment not found: ${paymentId}`)
  }

  payment.status = 'confirmed'
  payment.confirmedAt = Date.now()
  payment.txHash = txHash

  writePayments(payments)

  console.log(`[Payments] Payment confirmed: ${paymentId}`)

  return { success: true, confirmed: true }
}

/**
 * Get payment status
 */
export function getPaymentStatus(paymentId: string): Payment | null {
  const payments = readPayments()
  return payments[paymentId] || null
}

/**
 * Get all payments for a job
 */
export function getJobPayments(jobId: string): Payment[] {
  const payments = readPayments()
  return Object.values(payments).filter((p) => p.jobId === jobId)
}
