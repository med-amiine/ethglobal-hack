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
  const [jobId, setJobId] = useState('demo_job_' + Math.random().toString(36).slice(7))
  const [topicId, setTopicId] = useState('')
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
    await new Promise((r) => setTimeout(r, 500))

    addLog('✓ Identity verified with World ID', 'success')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[CONTRACT] Creating job on JobRegistry...', 'info')
    await new Promise((r) => setTimeout(r, 600))

    addLog('✓ Job created: ' + jobId, 'success')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[HEDERA] Creating consensus topic for work proof...', 'info')
    const newTopicId = '0.0.' + Math.floor(Math.random() * 1000000)
    setTopicId(newTopicId)
    await new Promise((r) => setTimeout(r, 600))

    addLog(`✓ Hedera topic created: ${newTopicId}`, 'success')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[UNLINK] Locking budget privately...', 'info')
    await new Promise((r) => setTimeout(r, 600))

    addLog('✓ Budget locked (●●● USDC) - amount private', 'success')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[RESULT] Job posted. Workers can now scan QR to check in.', 'success')
  }

  const runStep1 = async () => {
    addLog('[WORKER] Arriving at job site...', 'info')
    await new Promise((r) => setTimeout(r, 500))

    addLog('[WORKER] Scanning check-in QR code...', 'info')
    await new Promise((r) => setTimeout(r, 700))

    addLog('✓ QR scanned successfully', 'success')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[HEDERA] Submitting check-in message...', 'info')
    await new Promise((r) => setTimeout(r, 700))

    addLog('✓ Check-in recorded immutably on Hedera', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog(`  Sequence: #1 | Topic: ${topicId}`, 'info')
    addLog(
      `  Hashscan: https://hashscan.io/testnet/topic/${topicId}`,
      'info'
    )
    await new Promise((r) => setTimeout(r, 300))

    addLog('[RESULT] Worker check-in recorded. 08:32:14 UTC', 'success')
  }

  const runStep2 = async () => {
    addLog('[WORKER] End of work day...', 'info')
    await new Promise((r) => setTimeout(r, 500))

    addLog('[WORKER] Scanning check-out QR code...', 'info')
    await new Promise((r) => setTimeout(r, 700))

    addLog('✓ QR scanned', 'success')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[HEDERA] Submitting check-out message...', 'info')
    await new Promise((r) => setTimeout(r, 700))

    addLog('✓ Check-out recorded immutably on Hedera', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog(`  Sequence: #2 | Topic: ${topicId}`, 'info')
    await new Promise((r) => setTimeout(r, 300))

    addLog(
      '[RESULT] Hours worked: 9h 13m — recorded cryptographically on Hedera',
      'success'
    )
  }

  const runStep3 = async () => {
    addLog('[SYSTEM] Processing end-of-day payment...', 'info')
    await new Promise((r) => setTimeout(r, 500))

    addLog('[WALLET] Initiating WalletConnect Pay...', 'info')
    await new Promise((r) => setTimeout(r, 600))

    addLog('✓ Payment request created', 'success')
    await new Promise((r) => setTimeout(r, 400))

    addLog('[UNLINK] Executing private transfer...', 'info')
    await new Promise((r) => setTimeout(r, 800))

    addLog('✓ USDC transferred privately', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog('[RESULT] Worker received payment', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog('  Amount: ●●● USDC (private)', 'info')
    addLog('  Time: <2 seconds', 'info')
    addLog('  No bank account needed', 'success')
  }

  const runStep4 = async () => {
    addLog('[SYSTEM] Retrieving work proof...', 'info')
    await new Promise((r) => setTimeout(r, 500))

    addLog('[HEDERA] Querying job log...', 'info')
    await new Promise((r) => setTimeout(r, 700))

    addLog('✓ 2 immutable records found', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog('[RECORD #1] Check-in at 08:32:14', 'info')
    addLog(
      `  https://hashscan.io/testnet/transaction/...`,
      'info'
    )
    await new Promise((r) => setTimeout(r, 300))

    addLog('[RECORD #2] Check-out at 17:45:22', 'info')
    addLog(
      `  https://hashscan.io/testnet/transaction/...`,
      'info'
    )
    await new Promise((r) => setTimeout(r, 500))

    addLog('[RESULT] Cryptographic proof of 9h 13m work', 'success')
    await new Promise((r) => setTimeout(r, 300))

    addLog('✓ Worker reputation updated', 'success')
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
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e1a' }}>
      {/* Header */}
      <div className="border-b p-4" style={{ borderColor: '#C9A84C' }}>
        <Link href="/" className="text-lg font-bold" style={{ color: '#C9A84C' }}>
          ← Home
        </Link>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        <h1 className="text-5xl font-bold text-white mb-2">Live Demo</h1>
        <p className="text-gray-300 mb-12">
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
                      ? 'bg-green-900 border-green-500 text-green-100'
                      : i === currentStep && !loading
                      ? 'bg-yellow-900 border-yellow-500 text-yellow-100 hover:scale-105'
                      : 'bg-gray-800 border-gray-600 text-gray-300 opacity-50'
                  }`}
                  style={
                    i < currentStep
                      ? {
                          backgroundColor: 'rgba(74, 222, 128, 0.1)',
                          borderColor: '#4ade80',
                          color: '#4ade80',
                        }
                      : i === currentStep && !loading
                      ? {
                          backgroundColor: 'rgba(201, 168, 76, 0.1)',
                          borderColor: '#C9A84C',
                          color: '#C9A84C',
                        }
                      : undefined
                  }
                >
                  <div className="font-bold">{step.title}</div>
                  <div className="text-sm opacity-75">{step.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={resetDemo}
              className="w-full mt-6 px-4 py-2 rounded border text-white"
              style={{ borderColor: '#C9A84C' }}
            >
              Reset Demo
            </button>
          </div>

          {/* Right: Terminal */}
          <div className="lg:col-span-2">
            <div
              className="rounded-lg border-2 font-mono text-sm overflow-hidden flex flex-col"
              style={{ borderColor: '#C9A84C', height: '600px' }}
            >
              {/* Terminal Header */}
              <div
                className="px-4 py-3 border-b flex items-center gap-3"
                style={{
                  borderColor: '#C9A84C',
                  backgroundColor: '#0f1629',
                }}
              >
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
                <span className="ml-2 text-gray-400 flex-1">laborlink@demo</span>
              </div>

              {/* Terminal Content */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-1"
                style={{ backgroundColor: '#0a0e1a' }}
              >
                {logs.length === 0 ? (
                  <div className="text-gray-500 text-center py-20">
                    {currentStep === 0
                      ? 'Click "1. Employer Posts Job" to begin'
                      : 'Running...'}
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`${
                        log.type === 'success'
                          ? 'text-green-400'
                          : log.type === 'warning'
                          ? 'text-red-400'
                          : ''
                      }`}
                      style={{
                        color:
                          log.type === 'success'
                            ? '#4ade80'
                            : log.type === 'warning'
                            ? '#ef4444'
                            : '#C9A84C',
                      }}
                    >
                      {log.message}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>

              {/* Terminal Footer */}
              {loading && (
                <div
                  className="px-4 py-3 border-t text-center"
                  style={{
                    borderColor: '#C9A84C',
                    color: '#C9A84C',
                  }}
                >
                  ⏳ Processing...
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {currentStep > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>
                    {currentStep}/{steps.length}
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded overflow-hidden border"
                  style={{ borderColor: '#C9A84C', backgroundColor: '#0f1629' }}
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(currentStep / steps.length) * 100}%`,
                      backgroundColor: '#C9A84C',
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
