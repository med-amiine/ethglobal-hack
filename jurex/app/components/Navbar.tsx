"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/registry", label: "REGISTRY" },
  { href: "/cases", label: "CASES" },
  { href: "/faucet", label: "FAUCET" },
  { href: "/validate", label: "VALIDATE" },
  { href: "/docs", label: "DOCS" },
];

function ConnectionStatus({ isHuman }: { isHuman: boolean }) {
  const [ping, setPing] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPing(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (isHuman) {
    return (
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span>Live</span>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-[#4A5568]">
      <span>NODE_STATUS</span>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 h-3 transition-all duration-200 ${
              i <= ping ? 'bg-[#00ff41]' : 'bg-[#1A2130]'
            }`}
          />
        ))}
      </div>
      <span className="text-[#00ff41]">ONLINE</span>
    </div>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { mode, toggle } = useTheme();
  const isHuman = mode === "human";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHuman
        ? scrolled
          ? 'bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-sm'
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-100'
        : scrolled
          ? 'bg-[#070B12]/98 backdrop-blur-md border-b border-[#00ff41]/20'
          : 'bg-[#070B12]/80 backdrop-blur-sm border-b border-[#1A2130]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className={`relative w-7 h-7 md:w-8 md:h-8 flex items-center justify-center overflow-hidden transition-colors ${
              isHuman
                ? 'border border-blue-300 group-hover:border-blue-500 bg-blue-50'
                : 'border border-[#00ff41]/50 group-hover:border-[#00ff41]'
            }`}>
              <span className={`font-mono text-xs font-bold z-10 transition-colors ${isHuman ? 'text-blue-600' : 'text-[#00ff41]'}`}>AC</span>
              {!isHuman && <div className="absolute inset-0 bg-[#00ff41]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />}
            </div>
            <div className="flex flex-col">
              <span className={`font-mono text-sm transition-colors ${
                isHuman
                  ? 'text-slate-900 group-hover:text-blue-600'
                  : 'text-white group-hover:text-[#00ff41]'
              }`}>
                {isHuman ? 'Jurex Network' : 'JUREX_NETWORK'}
              </span>
              <span className={`hidden md:block text-[9px] font-mono tracking-wider ${isHuman ? 'text-slate-400' : 'text-[#4A5568]'}`}>
                {isHuman ? 'Decentralized Judiciary' : 'DECENTRALIZED_JUDICIARY'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link, idx) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 lg:px-4 py-2 font-mono text-xs transition-colors group ${
                  isHuman
                    ? 'text-slate-500 hover:text-blue-600'
                    : 'text-[#8899AA] hover:text-[#00ff41]'
                }`}
              >
                <span className="relative z-10">{isHuman ? link.label.replace(/_/g, ' ') : link.label}</span>
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px group-hover:w-2/3 transition-all duration-300 ${isHuman ? 'bg-blue-500' : 'bg-[#00ff41]'}`} />
                {!isHuman && idx < navLinks.length - 1 && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[#1A2130]">/</span>
                )}
              </Link>
            ))}

            <div className={`ml-4 pl-4 flex items-center gap-3 border-l ${isHuman ? 'border-slate-200' : 'border-[#1A2130]'}`}>
              <ConnectionStatus isHuman={isHuman} />

              {/* Connect wallet */}
              <div className="relative group">
                <div className={`absolute -top-1 -left-1 w-2 h-px transition-colors ${isHuman ? 'bg-blue-400/50 group-hover:bg-blue-500' : 'bg-[#00ff41]/50 group-hover:bg-[#00ff41]'}`} />
                <div className={`absolute -top-1 -left-1 w-px h-2 transition-colors ${isHuman ? 'bg-blue-400/50 group-hover:bg-blue-500' : 'bg-[#00ff41]/50 group-hover:bg-[#00ff41]'}`} />
                <div className={`absolute -top-1 -right-1 w-2 h-px transition-colors ${isHuman ? 'bg-blue-400/50 group-hover:bg-blue-500' : 'bg-[#00ff41]/50 group-hover:bg-[#00ff41]'}`} />
                <div className={`absolute -top-1 -right-1 w-px h-2 transition-colors ${isHuman ? 'bg-blue-400/50 group-hover:bg-blue-500' : 'bg-[#00ff41]/50 group-hover:bg-[#00ff41]'}`} />
                <div className={`absolute -bottom-1 -left-1 w-2 h-px transition-colors ${isHuman ? 'bg-blue-400/50 group-hover:bg-blue-500' : 'bg-[#00ff41]/50 group-hover:bg-[#00ff41]'}`} />
                <div className={`absolute -bottom-1 -left-1 w-px h-2 transition-colors ${isHuman ? 'bg-blue-400/50 group-hover:bg-blue-500' : 'bg-[#00ff41]/50 group-hover:bg-[#00ff41]'}`} />
                <div className={`absolute -bottom-1 -right-1 w-2 h-px transition-colors ${isHuman ? 'bg-blue-400/50 group-hover:bg-blue-500' : 'bg-[#00ff41]/50 group-hover:bg-[#00ff41]'}`} />
                <div className={`absolute -bottom-1 -right-1 w-px h-2 transition-colors ${isHuman ? 'bg-blue-400/50 group-hover:bg-blue-500' : 'bg-[#00ff41]/50 group-hover:bg-[#00ff41]'}`} />
                <ConnectButton
                  showBalance={false}
                  accountStatus="address"
                  chainStatus="icon"
                />
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden relative w-10 h-10 flex items-center justify-center font-mono text-xs transition-colors ${
              isHuman ? 'text-slate-500 hover:text-blue-600' : 'text-[#8899AA] hover:text-[#00ff41]'
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <span className={`w-5 h-px bg-current transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1' : ''}`} />
              <span className={`w-5 h-px bg-current transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className={`py-4 border-t space-y-1 ${isHuman ? 'border-slate-200' : 'border-[#1A2130]'}`}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 font-mono text-xs transition-all group ${
                  isHuman
                    ? 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
                    : 'text-[#8899AA] hover:text-[#00ff41] hover:bg-[#0B0F18]'
                }`}
              >
                <span className={`group-hover:text-current ${isHuman ? 'text-slate-300' : 'text-[#1A2130]'}`}>&gt;</span>
                {isHuman ? link.label.replace(/_/g, ' ') : link.label}
              </Link>
            ))}
            <div className={`pt-4 mt-4 border-t px-4 ${isHuman ? 'border-slate-200' : 'border-[#1A2130]'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-mono ${isHuman ? 'text-slate-400' : 'text-[#4A5568]'}`}>NETWORK</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                  <span className={`text-[10px] font-mono ${isHuman ? 'text-emerald-600' : 'text-[#00ff41]'}`}>ARB_SEP</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ConnectButton showBalance={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    {/* Floating mode toggle */}
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono border backdrop-blur-sm shadow-lg transition-all duration-300 ${
          isHuman
            ? 'bg-white/90 border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
            : 'bg-[#070B12]/90 border-[#1A2130] text-[#4A5568] hover:border-[#00ff41] hover:text-[#00ff41]'
        }`}
      >
        <span>{isHuman ? '◈' : '◉'}</span>
        <span>{isHuman ? 'AGENT_MODE' : 'HUMAN_MODE'}</span>
      </button>
    </div>
    </>
  );
}
