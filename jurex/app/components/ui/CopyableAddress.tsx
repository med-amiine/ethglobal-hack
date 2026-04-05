"use client";

import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";
import { truncateAddress } from "@/lib/utils";

interface CopyableAddressProps {
  address: string;
  truncate?: number;
  fullOnHover?: boolean;
  className?: string;
}

export function CopyableAddress({
  address,
  truncate = 6,
  fullOnHover = true,
  className = "",
}: CopyableAddressProps) {
  const { copy, copied } = useCopyToClipboard();

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => copy(address)}
        className="relative group font-mono text-sm hover:text-[#C9A84C] transition-colors cursor-pointer"
        title="Click to copy"
      >
        {fullOnHover ? (
          <>
            <span className="inline md:hidden">{truncateAddress(address, truncate)}</span>
            <span className="hidden md:inline group-hover:hidden">{truncateAddress(address, truncate)}</span>
            <span className="hidden md:group-hover:inline text-[#C9A84C]">{address}</span>
          </>
        ) : (
          <span>{truncateAddress(address, truncate)}</span>
        )}
      </button>

      {/* Tooltip */}
      {copied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#4ade80] text-black text-xs rounded whitespace-nowrap font-mono">
          Copied!
        </div>
      )}
    </div>
  );
}
