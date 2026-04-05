import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e1a' }}>
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
        <div className="text-center max-w-3xl">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4">
            LaborLink
          </h1>
          <p className="text-2xl md:text-3xl mb-8" style={{ color: '#C9A84C' }}>
            Show up. Get paid. No bank needed.
          </p>
          <p className="text-lg text-gray-300 mb-12 leading-relaxed">
            Two billion workers get paid cash in an envelope.
            <br />
            No receipt. No recourse. No record.
            <br />
            <br />
            LaborLink gives physical labor an onchain footprint.
            <br />
            Check in via QR. Get paid in seconds. Build an immutable work history.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <Link
            href="/employer"
            className="px-8 py-4 text-xl font-bold rounded-lg text-white transition-all hover:scale-105"
            style={{ backgroundColor: '#C9A84C' }}
          >
            Post a Job
          </Link>
          <Link
            href="/worker"
            className="px-8 py-4 text-xl font-bold rounded-lg border-2 text-white transition-all hover:scale-105"
            style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
          >
            Find Work
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 px-4" style={{ backgroundColor: '#0f1629' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                num: '1',
                title: 'Post a Job',
                desc: 'Employer verifies with World ID (no fake listings)',
              },
              {
                num: '2',
                title: 'Lock Budget',
                desc: 'USDC locked privately via Unlink escrow',
              },
              {
                num: '3',
                title: 'Check In',
                desc: 'Worker scans QR → Hedera timestamps work',
              },
              {
                num: '4',
                title: 'Get Paid',
                desc: 'WalletConnect releases USDC instantly at checkout',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-lg border-2"
                style={{ borderColor: '#C9A84C', backgroundColor: '#0a0e1a' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Problem */}
      <div className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">The Problem</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            2 billion workers worldwide get paid cash in an envelope. They have no receipt when the money disappears. No recourse if the employer denies payment. No record of the work they performed.
          </p>
          <p className="text-lg" style={{ color: '#C9A84C' }}>
            Day laborers are the most exploited workforce on the planet because their work leaves no trace.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 px-4" style={{ backgroundColor: '#0f1629' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Why LaborLink
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: '🌍',
                title: 'Identity Verified',
                desc: 'Only real humans post jobs. World ID prevents fraud.',
              },
              {
                icon: '🔗',
                title: 'Immutable Proof',
                desc: 'Check-ins logged on Hedera. Cryptographic proof of work.',
              },
              {
                icon: '💳',
                title: 'Instant Payment',
                desc: 'USDC released same day. No waiting, no intermediaries.',
              },
              {
                icon: '📊',
                title: 'Portable Reputation',
                desc: 'Build a verifiable work history across job sites.',
              },
              {
                icon: '🛡️',
                title: 'Private Budget',
                desc: 'Employer salary hidden via Unlink. Workers see daily rate.',
              },
              {
                icon: '⚖️',
                title: 'Fair Arbitration',
                desc: '3 World ID judges arbitrate disputes. HCS log is evidence.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-lg border"
                style={{ borderColor: '#C9A84C', backgroundColor: '#0a0e1a' }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo CTA */}
      <div className="py-20 px-4 text-center">
        <h2 className="text-4xl font-bold text-white mb-8">
          See It In Action
        </h2>
        <Link
          href="/demo"
          className="px-8 py-4 text-xl font-bold rounded-lg text-white transition-all hover:scale-105 inline-block"
          style={{ backgroundColor: '#C9A84C' }}
        >
          Run Live Demo
        </Link>
      </div>

      {/* Footer */}
      <div
        className="border-t px-4 py-12"
        style={{ borderColor: '#C9A84C' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm">Powered by</p>
            <div className="flex flex-wrap justify-center gap-6 mt-4 items-center">
              {['World ID', 'Hedera', 'WalletConnect', 'Unlink', 'Dynamic'].map((sponsor) => (
                <span
                  key={sponsor}
                  className="px-4 py-2 text-sm rounded border"
                  style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
                >
                  {sponsor}
                </span>
              ))}
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm">
            Built for ETHGlobal Cannes 2026
          </p>
        </div>
      </div>
    </div>
  )
}
