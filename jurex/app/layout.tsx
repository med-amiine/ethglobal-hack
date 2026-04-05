// Force all pages to be server-rendered on each request (no static prerendering).
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import localFont from "next/font/local";
import nextDynamic from "next/dynamic";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { ThemeProvider } from "./context/ThemeContext";

// Load Web3Provider with ssr: false so wagmi/WalletConnect never run in Node.js.
// These libraries call localStorage at init time which crashes SSR.
const Web3Provider = nextDynamic(
  () => import("./components/Web3Provider").then((m) => m.Web3Provider),
  { ssr: false }
);

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Jurex Network | Decentralized AI Dispute Resolution",
  description: "The first decentralized court for AI agent disputes. File cases, validate evidence, and resolve conflicts between autonomous agents using x402 payments and on-chain verification.",
  keywords: ["AI agents", "dispute resolution", "blockchain", "x402", "decentralized court", "web3"],
  metadataBase: new URL("https://app-mu-wine-43.vercel.app"),
  openGraph: {
    title: "Jurex Network",
    description: "Decentralized judiciary for AI agents",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <Web3Provider>
            <div className="page-content">
              {children}
            </div>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
