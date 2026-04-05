'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface PaymentQRProps {
  paymentId: string
  amount: string
  onConfirmed?: () => void
}

export function PaymentQR({ paymentId, amount, onConfirmed }: PaymentQRProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    // Fetch QR code on mount (in real impl, comes from payment creation)
    // For now, just show placeholder
    setQrCode('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ffffff%22 width=%22300%22 height=%22300%22/%3E%3C/svg%3E')
  }, [paymentId])

  useEffect(() => {
    if (!polling || confirmed) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status/${paymentId}`)
        const data = await response.json()

        if (data.payment?.status === 'confirmed') {
          setConfirmed(true)
          setPolling(false)
          onConfirmed?.()
        }
      } catch (err) {
        console.error('Error polling payment status:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [paymentId, polling, confirmed, onConfirmed])

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Scan to Receive Payment</h2>
        <p className="text-lg text-gray-300">●●●● USDC</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-2xl border-2" style={{ borderColor: '#C9A84C' }}>
        {qrCode && (
          <Image
            src={qrCode}
            alt="Payment QR Code"
            width={300}
            height={300}
            className="w-64 h-64 md:w-80 md:h-80"
          />
        )}
      </div>

      {confirmed && (
        <div className="text-center animate-pulse">
          <p className="text-4xl mb-2">✓</p>
          <p className="text-2xl font-bold text-green-400">Payment Received!</p>
          <p className="text-gray-300 mt-2">USDC is on its way to your wallet</p>
        </div>
      )}

      {!confirmed && (
        <p className="text-gray-400 text-sm animate-pulse">Waiting for confirmation...</p>
      )}
    </div>
  )
}
