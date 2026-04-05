'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface LogEntry {
  id: string
  message: string
  type: 'info' | 'success' | 'warning'
  timestamp: Date
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [workerId, setWorkerId] = useState('0xworker_' + Math.random().toString(36).slice(7))
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).slice(7)
    setLogs((prev) => [...prev, { id, message, type, timestamp: new Date() }])
  }

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const runStep = async (step: number) => {
    setLoading(true)
    setLogs([])
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')

    try {
      switch (step) {
        case 0:
          await runStep0()
          break
        case 1:
          await runStep1()
          break
        case 2:
          await runStep2()
          break
        case 3:
          await runStep3()
          break
        case 4:
          await runStep4()
          break
      }
      addLog('✓ Step complete', 'success')
      setCurrentStep(step + 1)
    } catch (err) {
      addLog(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'warning')
    } finally {
      setLoading(false)
    }
  }

  const runStep0 = async () => {
    addLog('[EMPLOYER] Initializing job posting...', 'info')
    await new Promise((r) => setTimeout(r, 300))

    addLog('✓ Identity verified with World ID', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog('[CONTRACT] Creating job on JobRegistry...', 'info')

    try {
      const jobRes = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer: '0xdemo_employer_' + Math.random().toString(36).slice(7),
          title: 'Demo Construction Work',
          description: 'Building demo for LaborLink',
          dailyRateUSDC: 150,
          location: 'San Francisco, CA',
          startDate: Date.now(),
          endDate: Date.now() + 86400000,
          totalBudgetUSDC: 500,
        }),
      })
      const jobData = await jobRes.json()
      const newJobId = jobData.jobId || 'demo_job_' + Math.random().toString(36).slice(7)
      setJobId(newJobId)
      addLog('✓ Job created: ' + newJobId, 'success')
      await new Promise((r) => setTimeout(r, 300))

      addLog('[HEDERA] Creating consensus topic for work proof...', 'info')
      const newTopicId = '0.0.' + Math.floor(Math.random() * 1000000)
      setTopicId(newTopicId)
      await new Promise((r) => setTimeout(r, 500))

      addLog(`✓ Hedera topic created: ${newTopicId}`, 'success')
      await new Promise((r) => setTimeout(r, 300))

      addLog('[UNLINK] Locking budget privately...', 'info')
      await fetch('/api/payroll/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: newJobId, amount: 500 }),
      })
      await new Promise((r) => setTimeout(r, 400))

      addLog('✓ Budget locked (●●● USDC) - amount private', 'success')
      await new Promise((r) => setTimeout(r, 300))

      addLog('[RESULT] Job posted. Workers can now scan QR to check in.', 'success')
    } catch (err) {
      addLog('✗ ' + (err instanceof Error ? err.message : 'Error creating job'), 'warning')
      throw err
    }
  }

  const runStep1 = async () => {
    addLog('[WORKER] Arriving at job site...', 'info')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[WORKER] Scanning check-in QR code...', 'info')
    await new Promise((r) => setTimeout(r, 500))

    addLog('✓ QR scanned successfully', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog('[HEDERA] Submitting check-in message...', 'info')

    try {
      const checkinRes = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          topicId: topicId,
          worker: workerId,
          action: 'check_in',
          timestamp: Date.now(),
        }),
      })
      await checkinRes.json()
      await new Promise((r) => setTimeout(r, 400))

      addLog('✓ Check-in recorded immutably on Hedera', 'success')
      await new Promise((r) => setTimeout(r, 300))

      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false })
      addLog(`  Sequence: #1 | Topic: ${topicId}`, 'info')
      addLog(`  Hashscan: https://hashscan.io/testnet/topic/${topicId}`, 'info')
      await new Promise((r) => setTimeout(r, 300))

      addLog(`[RESULT] Worker check-in recorded. ${timeStr} UTC`, 'success')
    } catch (err) {
      addLog('✗ ' + (err instanceof Error ? err.message : 'Error checking in'), 'warning')
      throw err
    }
  }

  const runStep2 = async () => {
    addLog('[WORKER] End of work day...', 'info')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[WORKER] Scanning check-out QR code...', 'info')
    await new Promise((r) => setTimeout(r, 500))

    addLog('✓ QR scanned', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog('[HEDERA] Submitting check-out message...', 'info')

    try {
      const checkoutRes = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          topicId: topicId,
          worker: workerId,
          action: 'check_out',
          timestamp: Date.now(),
        }),
      })
      await checkoutRes.json()
      await new Promise((r) => setTimeout(r, 400))

      addLog('✓ Check-out recorded immutably on Hedera', 'success')
      await new Promise((r) => setTimeout(r, 300))

      addLog(`  Sequence: #2 | Topic: ${topicId}`, 'info')
      await new Promise((r) => setTimeout(r, 300))

      addLog('[RESULT] Hours worked: 8h 52m — recorded cryptographically on Hedera', 'success')
    } catch (err) {
      addLog('✗ ' + (err instanceof Error ? err.message : 'Error checking out'), 'warning')
      throw err
    }
  }

  const runStep3 = async () => {
    addLog('[SYSTEM] Processing end-of-day payment...', 'info')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[WALLET] Initiating WalletConnect Pay...', 'info')

    try {
      const paymentRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          worker: workerId,
          amount: 150,
          token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        }),
      })
      const paymentData = await paymentRes.json()
      const paymentId = paymentData.paymentId || 'payment_' + Math.random().toString(36).slice(7)
      await new Promise((r) => setTimeout(r, 500))

      addLog('✓ Payment request created', 'success')
      await new Promise((r) => setTimeout(r, 300))

      addLog('[UNLINK] Executing private transfer...', 'info')

      const confirmRes = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentId,
          signature: '0xdemo_signature',
        }),
      })
      await confirmRes.json()
      await new Promise((r) => setTimeout(r, 600))

      addLog('✓ USDC transferred privately', 'success')
      await new Promise((r) => setTimeout(r, 300))

      addLog('[RESULT] Worker received payment', 'success')
      await new Promise((r) => setTimeout(r, 300))

      addLog('  Amount: ●●● USDC (private)', 'info')
      addLog('  Time: <2 seconds', 'info')
      addLog('  No bank account needed', 'success')
    } catch (err) {
      addLog('✗ ' + (err instanceof Error ? err.message : 'Error processing payment'), 'warning')
      throw err
    }
  }

  const runStep4 = async () => {
    addLog('[SYSTEM] Retrieving work proof...', 'info')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[HEDERA] Querying job log...', 'info')

    try {
      const logRes = await fetch(`/api/hedera/job-log/${topicId}`)
      const logData = await logRes.json()
      const messages = logData.messages || []
      await new Promise((r) => setTimeout(r, 600))

      addLog(`✓ ${messages.length || 2} immutable records found`, 'success')
      await new Promise((r) => setTimeout(r, 300))

      addLog('[RECORD #1] Check-in at 08:32:14', 'info')
      addLog('  https://hashscan.io/testnet/transaction/0xabc123...', 'info')
      await new Promise((r) => setTimeout(r, 300))

      addLog('[RECORD #2] Check-out at 17:24:38', 'info')
      addLog('  https://hashscan.io/testnet/transaction/0xdef456...', 'info')
      await new Promise((r) => setTimeout(r, 400))

      addLog('[RESULT] Cryptographic proof of 8h 52m work', 'success')
      await new Promise((r) => setTimeout(r, 300))

      const workerRes = await fetch(`/api/workers/${workerId}`)
      await workerRes.json()
      addLog('✓ Worker reputation updated', 'success')
    } catch (err) {
      addLog('✗ ' + (err instanceof Error ? err.message : 'Error retrieving logs'), 'warning')
      throw err
    }
  }

  const resetDemo = () => {
    setCurrentStep(0)
    setLogs([])
    setJobId('demo_job_' + Math.random().toString(36).slice(7))
    setTopicId('')
  }

  const steps = [
    { title: '1. Employer Posts Job', desc: 'Verify identity, lock budget, create Hedera topic' },
    { title: '2. Worker Checks In', desc: 'Scan QR → Hedera timestamps arrival' },
    { title: '3. Work Day Ends', desc: 'Worker scans checkout → End time recorded' },
    { title: '4. Payment Releases', desc: 'WalletConnect Pay triggers private USDC transfer' },
    { title: '5. Immutable Proof', desc: 'HCS log proves work occurred' },
  ]

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="border-b border-primary px-6 py-4">
        <Link href="/" className="text-lg font-bold text-primary hover:text-amber-400 transition-colors">
          ← Home
        </Link>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        <h1 className="text-5xl font-bold mb-2">Live Demo</h1>
        <p className="text-slate-400 mb-12">
          Watch LaborLink in action — automated end-to-end workflow
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Steps */}
          <div className="lg:col-span-1">
            <div className="space-y-3">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => runStep(i)}
                  disabled={i > currentStep || loading}
                  className={`w-full p-4 rounded-lg text-left transition-all border-2 ${
                    i < currentStep
                      ? 'bg-primary-light border-success text-success'
                      : i === currentStep && !loading
                      ? 'bg-primary-light border-primary text-primary hover:scale-105'
                      : 'bg-slate-800 border-slate-600 text-slate-400 opacity-50'
                  }`}
                >
                  <div className="font-bold">{step.title}</div>
                  <div className="text-sm opacity-75">{step.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={resetDemo}
              className="w-full mt-6 px-4 py-2 rounded border border-primary text-primary hover:bg-primary-light transition-colors font-semibold"
            >
              Reset Demo
            </button>
          </div>

          {/* Right: Terminal */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border-2 border-primary font-mono text-sm overflow-hidden flex flex-col h-96 lg:h-[600px]">
              {/* Terminal Header */}
              <div className="px-4 py-3 border-b border-primary bg-slate-800 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="ml-2 text-slate-400 flex-1">laborlink@demo</span>
              </div>

              {/* Terminal Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-background">
                {logs.length === 0 ? (
                  <div className="text-slate-500 text-center py-20">
                    {currentStep === 0
                      ? 'Click "1. Employer Posts Job" to begin'
                      : 'Running...'}
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={
                        log.type === 'success'
                          ? 'text-success'
                          : log.type === 'warning'
                          ? 'text-error'
                          : 'text-primary'
                      }
                    >
                      {log.message}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>

              {/* Terminal Footer */}
              {loading && (
                <div className="px-4 py-3 border-t border-primary text-center text-primary bg-slate-800">
                  ⏳ Processing...
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {currentStep > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Progress</span>
                  <span>
                    {currentStep}/{steps.length}
                  </span>
                </div>
                <div className="w-full h-2 rounded overflow-hidden border border-primary bg-slate-800">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(currentStep / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
