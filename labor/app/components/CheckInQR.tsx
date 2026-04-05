'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { format } from 'date-fns'

interface CheckInQRProps {
  jobId: string
  topicId: string
  employerAddress: string
}

interface QRPayload {
  jobId: string
  topicId: string
  timestamp: number
  action: 'checkin' | 'checkout'
  employerAddress: string
}

export function CheckInQR({ jobId, topicId, employerAddress }: CheckInQRProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [action, setAction] = useState<'checkin' | 'checkout'>('checkin')
  const [refreshKey, setRefreshKey] = useState(0)

  const generateQR = async () => {
    const payload: QRPayload = {
      jobId,
      topicId,
      timestamp: Date.now(),
      action,
      employerAddress,
    }

    const qrString = JSON.stringify(payload)

    try {
      const qrDataUrl = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400,
        color: {
          dark: '#0a0e1a',
          light: '#ffffff',
        },
      })
      setQrCode(qrDataUrl)
    } catch (err) {
      console.error('Error generating QR code:', err)
    }
  }

  useEffect(() => {
    generateQR()
  }, [action, refreshKey])

  // Auto-refresh QR every 60s (for timestamp rotation)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4" style={{ backgroundColor: '#0a0e1a' }}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">CHECK IN / OUT</h1>
        <p className="text-xl" style={{ color: '#C9A84C' }}>
          {action === 'checkin' ? '📍 SCAN TO START WORK' : '✓ SCAN TO END WORK'}
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Job ID: {jobId.slice(0, 8)}... | Topic: {topicId}
        </p>
      </div>

      {/* QR Code Display */}
      <div
        className="p-6 rounded-lg shadow-2xl"
        style={{
          backgroundColor: '#ffffff',
          border: '3px solid #C9A84C',
        }}
      >
        {qrCode && (
          <img src={qrCode} alt={`${action} QR Code`} className="w-96 h-96" />
        )}
      </div>

      {/* Action Toggle */}
      <div className="flex gap-4">
        <button
          onClick={() => setAction('checkin')}
          className={`px-8 py-4 text-lg font-bold rounded-lg transition-all ${
            action === 'checkin'
              ? 'text-white'
              : 'text-gray-300 hover:text-white'
          }`}
          style={{
            backgroundColor: action === 'checkin' ? '#C9A84C' : 'transparent',
            border: `2px solid #C9A84C`,
          }}
        >
          CHECK IN
        </button>
        <button
          onClick={() => setAction('checkout')}
          className={`px-8 py-4 text-lg font-bold rounded-lg transition-all ${
            action === 'checkout'
              ? 'text-white'
              : 'text-gray-300 hover:text-white'
          }`}
          style={{
            backgroundColor: action === 'checkout' ? '#C9A84C' : 'transparent',
            border: `2px solid #C9A84C`,
          }}
        >
          CHECK OUT
        </button>
      </div>

      {/* Timestamp Info */}
      <div className="text-center text-gray-400 text-sm">
        <p>QR refreshes every 60 seconds</p>
        <p className="mt-1">{format(new Date(), 'MMM dd, HH:mm:ss')}</p>
      </div>
    </div>
  )
}
