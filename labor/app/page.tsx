import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-32 sm:py-48 lg:py-64">
        {/* Background gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            LaborLink
          </h1>
          <p className="text-2xl sm:text-3xl font-light text-amber-400 mb-8">
            Show up. Get paid. No bank needed.
          </p>
          <p className="text-lg text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto">
            Onchain work verification. Workers check in via QR, get paid instantly, build portable work history.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/employer"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
            >
              Post a Job
            </Link>
            <Link
              href="/worker"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-amber-500/50 transition-colors"
            >
              Find Work
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 text-center text-sm">
            <div>
              <div className="text-3xl font-bold text-amber-400">2B</div>
              <div className="text-slate-400">Workers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">6</div>
              <div className="text-slate-400">Integrations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">$0</div>
              <div className="text-slate-400">Setup Fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Post', desc: 'Employer verifies with World ID' },
              { num: '2', title: 'Lock', desc: 'Daily pay locked privately' },
              { num: '3', title: 'Verify', desc: 'Worker scans QR at job site' },
              { num: '4', title: 'Pay', desc: 'USDC released instantly' },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-500/20 border border-amber-500/50 mb-4">
                  <span className="text-lg font-bold text-amber-400">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-8">The Problem</h2>
          <p className="text-xl text-slate-300 leading-relaxed mb-8">
            2 billion workers get paid cash in an envelope. No receipt. No recourse. No record.
          </p>
          <p className="text-lg text-amber-400 font-semibold">
            Day laborers have zero proof their work ever happened.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">Why LaborLink</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔐', title: 'Identity Verified', desc: 'Only real humans post jobs' },
              { icon: '⛓️', title: 'Immutable Proof', desc: 'Check-ins logged on blockchain' },
              { icon: '⚡', title: 'Instant Payment', desc: 'USDC released same day' },
              { icon: '📊', title: 'Portable Reputation', desc: 'Work history follows you' },
              { icon: '🔒', title: 'Private Budget', desc: 'Employer salary hidden' },
              { icon: '⚖️', title: 'Fair Arbitration', desc: 'Disputes resolved on-chain' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-amber-500/50 transition-colors">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-4xl font-bold mb-8">See It In Action</h2>
        <Link
          href="/demo"
          className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
        >
          Run Live Demo
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <p className="text-slate-400 text-sm mb-4">Powered by</p>
            <div className="flex flex-wrap justify-center gap-4">
              {['World ID', 'Hedera', 'WalletConnect', 'Unlink', 'Dynamic'].map((s) => (
                <span key={s} className="text-xs text-slate-500">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center text-slate-500 text-sm">
            Onchain work verification for the physical world
          </div>
        </div>
      </footer>
    </div>
  )
}
