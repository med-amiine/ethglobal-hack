'use client'

import { useState } from 'react'

interface ScanResult {
  jobId: string
  topicId: string
  timestamp: number
  action: 'checkin' | 'checkout'
  employerAddress: string
}

interface QRScannerProps {
  onScan?: (result: ScanResult) => void
  onError?: (error: Error) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [manualJobId, setManualJobId] = useState('')
  const [manualTopicId, setManualTopicId] = useState('')

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualJobId || !manualTopicId) return

    const result: ScanResult = {
      jobId: manualJobId,
      topicId: manualTopicId,
      timestamp: Date.now(),
      action: 'checkin',
      employerAddress: '0xdemo',
    }

    onScan?.(result)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4" style={{ backgroundColor: '#0a0e1a' }}>
      <h2 className="text-3xl font-bold text-white">Scan Check-In QR</h2>

      <form onSubmit={handleManualSubmit} className="w-full max-w-md flex flex-col gap-4">
        <input
          type="text"
          placeholder="Job ID"
          value={manualJobId}
          onChange={(e) => setManualJobId(e.target.value)}
          className="px-4 py-3 bg-gray-900 text-white border rounded-lg focus:outline-none"
          style={{ borderColor: '#C9A84C' }}
          autoFocus
        />
        <input
          type="text"
          placeholder="Topic ID"
          value={manualTopicId}
          onChange={(e) => setManualTopicId(e.target.value)}
          className="px-4 py-3 bg-gray-900 text-white border rounded-lg focus:outline-none"
          style={{ borderColor: '#C9A84C' }}
        />
        <button
          type="submit"
          className="px-6 py-3 font-bold rounded-lg text-white transition-all hover:scale-105"
          style={{ backgroundColor: '#C9A84C' }}
        >
          Check In
        </button>
      </form>

      <p className="text-gray-400 text-sm text-center mt-8">
        Note: Camera QR scanning available in production. For demo, enter Job ID and Topic ID manually.
      </p>
    </div>
  )
}
