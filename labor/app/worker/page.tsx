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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4">
        <Link href="/" className="text-amber-400 hover:text-amber-300 font-semibold">
          ← Back
        </Link>
      </div>

      <div className="max-w-4xl mx-auto p-6 lg:p-12">
        <h1 className="text-5xl font-bold mb-2">Find Work</h1>
        <p className="text-slate-400 mb-8">Enter a job ID to check in and start earning</p>

        {!jobDetails ? (
          <form onSubmit={handleFetchJob} className="p-8 rounded-lg border border-slate-700 bg-slate-800/50">
            <label className="block mb-6">
              <p className="text-lg font-bold mb-3">Job ID</p>
              <input
                type="text"
                placeholder="Enter job ID from employer"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Load Job Details'}
            </button>
          </form>
        ) : (
          <div>
            {/* Job Details Card */}
            <div className="p-8 rounded-lg border border-slate-700 bg-slate-800/50 mb-8">
              <h2 className="text-3xl font-bold mb-2">{jobDetails.title || 'Work Opportunity'}</h2>
              <p className="text-slate-400 mb-6">{jobDetails.location}</p>

              <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-slate-700">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Daily Rate</p>
                  <p className="text-3xl font-bold">${jobDetails.dailyRateUSDC}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <p className="text-2xl font-bold">
                    {jobDetails.active ? '🟢 Open' : '🔴 Closed'}
                  </p>
                </div>
              </div>

              <p className="text-slate-300 mb-8">{jobDetails.description || 'No additional details'}</p>

              {jobDetails.active && (
                <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 mb-8 space-y-2">
                  <p className="text-sm font-semibold text-amber-400">How it works:</p>
                  <p className="text-sm text-slate-300">✓ Scan QR code when you arrive</p>
                  <p className="text-sm text-slate-300">✓ Scan QR code when you leave</p>
                  <p className="text-sm text-slate-300">✓ Get paid the same day</p>
                </div>
              )}

              <div className="flex gap-4">
                <Link
                  href={`/checkin/${jobDetails.jobId}`}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
                >
                  📱 Scan Check-In QR
                </Link>
                <button
                  onClick={() => {
                    setJobDetails(null)
                    setJobId('')
                  }}
                  className="px-6 py-3 border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
                >
                  Find Different Job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
