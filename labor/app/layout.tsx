import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LaborLink — Show up. Get paid. No bank needed.',
  description:
    'Onchain work proof system. Workers check in via QR, get paid instantly, build portable work history.',
  keywords: [
    'Web3',
    'Blockchain',
    'Labor',
    'Payment',
    'Workers',
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}
      </body>
    </html>
  )
}
