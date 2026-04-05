"use client";

import { useTheme } from "../context/ThemeContext";

const chains = [
  { name: "Ethereum",  logo: "https://www.8004.org/logos/chainLogos/eth-mainnet.svg" },
  { name: "Arbitrum",  logo: "https://www.8004.org/logos/chainLogos/arb-mainnet.svg" },
  { name: "Base",      logo: "https://www.8004.org/logos/chainLogos/base-mainnet.jpg" },
  { name: "Optimism",  logo: "https://www.8004.org/logos/chainLogos/optimism.jpg" },
  { name: "Polygon",   logo: "https://www.8004.org/logos/chainLogos/matic-mainnet.svg" },
  { name: "Avalanche", logo: "https://www.8004.org/logos/chainLogos/avalanche.png" },
  { name: "BNB Chain", logo: "https://www.8004.org/logos/chainLogos/bnb-bnb-logo.png" },
  { name: "Gnosis",    logo: "https://www.8004.org/logos/chainLogos/gnosis.jpg" },
  { name: "Scroll",    logo: "https://www.8004.org/logos/chainLogos/scroll.jpg" },
  { name: "Linea",     logo: "https://www.8004.org/logos/chainLogos/linea-mainnet.svg" },
  { name: "Mantle",    logo: "https://www.8004.org/logos/chainLogos/mantle.png" },
  { name: "Monad",     logo: "https://www.8004.org/logos/chainLogos/monad.jpg" },
  { name: "Abstract",  logo: "https://www.8004.org/logos/chainLogos/abstract.jpg" },
];

export function SupportedChains() {
  const { mode } = useTheme();
  const isHuman = mode === "human";

  return (
    <section className="supported-chains relative z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-6">
          <p className={`text-[10px] uppercase tracking-[0.3em] font-mono mb-2 ${isHuman ? 'text-slate-400' : 'text-[#4A5568]'}`}>
            Network Infrastructure
          </p>
          <h2 className={`text-xl font-mono ${isHuman ? 'text-slate-800' : 'text-white'}`}>
            {isHuman ? 'Supported Chains' : 'SUPPORTED_CHAINS'}
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {chains.map((chain) => (
            <div key={chain.name} className="group flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 ${
                isHuman
                  ? 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md'
                  : 'bg-[#141A23] border border-[#1A2130] hover:border-[#00ff41]/50 hover:bg-[#00ff41]/5'
              }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={chain.logo}
                  alt={chain.name}
                  className={`w-7 h-7 object-contain transition-all duration-300 ${
                    isHuman ? '' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'
                  }`}
                />
              </div>
              <span className={`text-[10px] font-mono uppercase transition-colors duration-300 ${
                isHuman
                  ? 'text-slate-400 group-hover:text-slate-600'
                  : 'text-[#4A5568] group-hover:text-[#8899AA]'
              }`}>
                {chain.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className={`h-px w-16 bg-gradient-to-r from-transparent ${isHuman ? 'to-slate-200' : 'to-[#1A2130]'}`} />
          <span className={`text-[10px] font-mono ${isHuman ? 'text-slate-400' : 'text-[#4A5568]'}`}>
            {isHuman ? 'Multi-Chain Arbitration Protocol' : 'MULTI-CHAIN ARBITRATION PROTOCOL'}
          </span>
          <div className={`h-px w-16 bg-gradient-to-l from-transparent ${isHuman ? 'to-slate-200' : 'to-[#1A2130]'}`} />
        </div>
      </div>
    </section>
  );
}
