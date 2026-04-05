'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4">
        <Link href="/" className="text-amber-400 hover:text-amber-300 font-semibold">
          ← Back
        </Link>
      </div>

      <div className="max-w-4xl mx-auto p-6 lg:p-12">
        <h1 className="text-5xl font-bold mb-2">Employer Dashboard</h1>
        <p className="text-slate-400 mb-12">Post jobs and manage your workforce</p>

        {/* Verification Card */}
        {!verified ? (
          <div className="p-8 rounded-lg border border-slate-700 bg-slate-800/50 mb-8">
            <h2 className="text-2xl font-bold mb-4">Verify Your Identity</h2>
            <p className="text-slate-300 mb-6">
              Only verified employers can post jobs. This prevents fake listings and fraud.
            </p>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify with World ID'}
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-lg border border-green-500/50 bg-green-500/10 mb-8 flex items-center gap-4">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-bold text-green-400">Identity Verified</p>
              <p className="text-sm text-slate-400">You can now post jobs</p>
            </div>
          </div>
        )}

        {verified && (
          <>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg mb-8 transition-colors"
              >
                + Post New Job
              </button>
            )}

            {showForm && (
              <form onSubmit={handleCreateJob} className="p-8 rounded-lg border border-slate-700 bg-slate-800/50 mb-8">
                <h2 className="text-2xl font-bold mb-6">Create New Job</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Daily Rate (USDC)"
                    value={form.dailyRate}
                    onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                    className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Total Budget (USDC)"
                    value={form.totalBudget}
                    onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
                    className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <textarea
                  placeholder="Job Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:border-amber-500 focus:outline-none mb-6"
                  rows={4}
                />

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Post Job'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {jobs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Active Jobs</h2>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.jobId} className="p-6 rounded-lg border border-slate-700 bg-slate-800/50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{job.title || 'Untitled Job'}</h3>
                          <p className="text-slate-400 text-sm">{job.location || 'Location TBA'}</p>
                        </div>
                        <Link
                          href={`/checkin/${job.jobId}`}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-bold transition-colors"
                        >
                          Show QR
                        </Link>
                      </div>
                      <p className="text-slate-500 text-sm">ID: {job.jobId.slice(0, 16)}...</p>
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
