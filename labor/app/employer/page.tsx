'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

interface JobForm {
  title: string
  description: string
  dailyRate: string
  location: string
  startDate: string
  endDate: string
  totalBudget: string
}

export default function EmployerPage() {
  const router = useRouter()
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<JobForm>({
    title: '',
    description: '',
    dailyRate: '',
    location: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
  })

  const handleVerify = async () => {
    setLoading(true)
    // Simulate World ID verification
    setTimeout(() => {
      setVerified(true)
      setLoading(false)
    }, 2000)
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startDate = new Date(form.startDate).getTime()
      const endDate = new Date(form.endDate).getTime()

      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer: '0xdemo_employer_address',
          title: form.title,
          description: form.description,
          dailyRateUSDC: parseInt(form.dailyRate),
          location: form.location,
          startDate,
          endDate,
          totalBudgetUSDC: parseInt(form.totalBudget),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setJobs([...jobs, data])
        setShowForm(false)
        setForm({
          title: '',
          description: '',
          dailyRate: '',
          location: '',
          startDate: '',
          endDate: '',
          totalBudget: '',
        })
      }
    } catch (err) {
      console.error('Error creating job:', err)
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

      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        <h1 className="text-5xl font-bold mb-2">Employer Dashboard</h1>
        <p className="text-gray-300 mb-8">Post jobs and manage your workforce</p>

        {/* World ID Verification */}
        {!verified ? (
          <div
            className="p-8 rounded-lg mb-8 border-2"
            style={{ borderColor: '#C9A84C', backgroundColor: '#0f1629' }}
          >
            <h2 className="text-2xl font-bold mb-4">Verify Your Identity</h2>
            <p className="text-gray-300 mb-6">
              Only verified employers can post jobs. This prevents fake listings and fraud.
            </p>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="px-6 py-3 font-bold rounded-lg text-white transition-all hover:scale-105"
              style={{ backgroundColor: '#C9A84C' }}
            >
              {loading ? 'Verifying...' : 'Verify with World ID'}
            </button>
          </div>
        ) : (
          <div
            className="p-6 rounded-lg mb-8 border-2 flex items-center gap-4"
            style={{ borderColor: '#4ade80', backgroundColor: '#0f1629' }}
          >
            <span className="text-3xl">✓</span>
            <div>
              <p className="text-lg font-bold" style={{ color: '#4ade80' }}>
                Identity Verified
              </p>
              <p className="text-sm text-gray-300">You can now post jobs</p>
            </div>
          </div>
        )}

        {verified && (
          <>
            {/* Create Job Button */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 font-bold rounded-lg text-white mb-8 transition-all hover:scale-105"
                style={{ backgroundColor: '#C9A84C' }}
              >
                + Post New Job
              </button>
            )}

            {/* Job Form */}
            {showForm && (
              <form
                onSubmit={handleCreateJob}
                className="p-8 rounded-lg mb-8 border-2"
                style={{ borderColor: '#C9A84C', backgroundColor: '#0f1629' }}
              >
                <h2 className="text-2xl font-bold mb-6">Create New Job</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <input
                    type="text"
                    placeholder="Job Title (e.g., Site Foreman)"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="px-4 py-3 bg-gray-900 rounded border"
                    style={{ borderColor: '#C9A84C' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="px-4 py-3 bg-gray-900 rounded border"
                    style={{ borderColor: '#C9A84C' }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Daily Rate (USDC)"
                    value={form.dailyRate}
                    onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                    className="px-4 py-3 bg-gray-900 rounded border"
                    style={{ borderColor: '#C9A84C' }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Total Budget (USDC)"
                    value={form.totalBudget}
                    onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
                    className="px-4 py-3 bg-gray-900 rounded border"
                    style={{ borderColor: '#C9A84C' }}
                    required
                  />
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="px-4 py-3 bg-gray-900 rounded border"
                    style={{ borderColor: '#C9A84C' }}
                    required
                  />
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="px-4 py-3 bg-gray-900 rounded border"
                    style={{ borderColor: '#C9A84C' }}
                    required
                  />
                </div>

                <textarea
                  placeholder="Job Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 rounded border mb-6"
                  style={{ borderColor: '#C9A84C' }}
                  rows={4}
                />

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 font-bold rounded-lg text-white transition-all hover:scale-105"
                    style={{ backgroundColor: '#C9A84C' }}
                  >
                    {loading ? 'Creating...' : 'Post Job'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 font-bold rounded-lg border text-white"
                    style={{ borderColor: '#C9A84C' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Jobs List */}
            {jobs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Active Jobs</h2>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.jobId}
                      className="p-6 rounded-lg border-2"
                      style={{ borderColor: '#C9A84C', backgroundColor: '#0f1629' }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">
                            {job.title || 'Untitled Job'}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {job.location || 'Location TBA'}
                          </p>
                        </div>
                        <Link
                          href={`/checkin/${job.jobId}`}
                          className="px-4 py-2 rounded font-bold text-white"
                          style={{ backgroundColor: '#C9A84C' }}
                        >
                          Show QR
                        </Link>
                      </div>
                      <p className="text-gray-300 text-sm">
                        ID: {job.jobId.slice(0, 16)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
