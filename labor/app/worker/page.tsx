'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function WorkerPage() {
  const [jobId, setJobId] = useState('')
  const [jobDetails, setJobDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFetchJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      const data = await response.json()

      if (data.success) {
        setJobDetails(data.job)
      } else {
        alert('Job not found')
      }
    } catch (err) {
      console.error('Error fetching job:', err)
      alert('Error loading job details')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e1a', color: '#ffffff' }}>
      {/* Header */}
      <div className="border-b p-4" style={{ borderColor: '#C9A84C' }}>
        <Link href="/" className="text-lg font-bold" style={{ color: '#C9A84C' }}>
          ← Back
        </Link>
      </div>

      <div className="max-w-4xl mx-auto p-6 lg:p-12">
        <h1 className="text-5xl font-bold mb-2">Find Work</h1>
        <p className="text-gray-300 mb-8">Enter a job ID to check in and get paid</p>

        {!jobDetails ? (
          <form
            onSubmit={handleFetchJob}
            className="p-8 rounded-lg border-2"
            style={{ borderColor: '#C9A84C', backgroundColor: '#0f1629' }}
          >
            <label className="block mb-4">
              <p className="text-lg font-bold mb-3">Job ID</p>
              <input
                type="text"
                placeholder="Enter job ID from employer"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 rounded border text-white"
                style={{ borderColor: '#C9A84C' }}
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 font-bold rounded-lg text-white transition-all hover:scale-105"
              style={{ backgroundColor: '#C9A84C' }}
            >
              {loading ? 'Loading...' : 'Load Job Details'}
            </button>
          </form>
        ) : (
          <div>
            {/* Job Details Card */}
            <div
              className="p-8 rounded-lg border-2 mb-8"
              style={{ borderColor: '#C9A84C', backgroundColor: '#0f1629' }}
            >
              <h2 className="text-3xl font-bold mb-2">
                {jobDetails.title || 'Work Opportunity'}
              </h2>
              <p className="text-gray-300 mb-6">{jobDetails.location}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <p className="text-gray-400 text-sm">Daily Rate</p>
                  <p className="text-2xl font-bold">
                    {jobDetails.dailyRateUSDC} USDC
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-2xl font-bold">
                    {jobDetails.active ? '🟢 Open' : '🔴 Closed'}
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-8">
                {jobDetails.description || 'No additional details'}
              </p>

              {jobDetails.active && (
                <div className="space-y-3 mb-8">
                  <p className="text-gray-400 text-sm">Your work is recorded securely on the blockchain</p>
                  <p className="text-gray-400 text-sm">✓ Check in when you arrive</p>
                  <p className="text-gray-400 text-sm">✓ Check out when you leave</p>
                  <p className="text-gray-400 text-sm">✓ Get paid the same day</p>
                </div>
              )}

              <div className="flex gap-4">
                <Link
                  href={`/checkin/${jobDetails.jobId}`}
                  className="px-6 py-3 font-bold rounded-lg text-white transition-all hover:scale-105"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  📱 Scan Check-In QR
                </Link>
                <button
                  onClick={() => {
                    setJobDetails(null)
                    setJobId('')
                  }}
                  className="px-6 py-3 font-bold rounded-lg border text-white"
                  style={{ borderColor: '#C9A84C' }}
                >
                  Find Different Job
                </button>
              </div>
            </div>

            {/* Info Section */}
            <div
              className="p-6 rounded-lg border"
              style={{ borderColor: '#C9A84C', backgroundColor: '#0f1629' }}
            >
              <h3 className="text-lg font-bold mb-4">How It Works</h3>
              <ol className="space-y-3 text-gray-300">
                <li>
                  <span className="text-gold font-bold">1.</span> Your employer will show you a QR code
                </li>
                <li>
                  <span className="text-gold font-bold">2.</span> Scan it with your phone camera
                </li>
                <li>
                  <span className="text-gold font-bold">3.</span> Your check-in is recorded on blockchain
                </li>
                <li>
                  <span className="text-gold font-bold">4.</span> At the end of the day, check out the same way
                </li>
                <li>
                  <span className="text-gold font-bold">5.</span> USDC is released to your wallet instantly
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
