"use client";

import { useEffect } from "react";
import { useAblyStatus } from "@/lib/ably-hooks";
import { useBlockNumber } from "wagmi";

export function RealtimeStatus() {
  const { isConnected, isConnecting, state } = useAblyStatus();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Fetch initial listener status
  useEffect(() => {
    fetch("/api/realtime")
      .then((res) => res.json())
      .then((data) => {
        console.log("[Realtime] Status:", data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="terminal">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isConnected
                  ? "bg-[#00ff41]"
                  : isConnecting
                  ? "bg-[#ffcc00]"
                  : "bg-[#ff3366]"
              }`}
            />
            <span className="text-[10px] font-mono text-[#444444]">
              {isConnected ? "LIVE" : isConnecting ? "..." : "OFF"}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[#1a1a1a]" />
          
          <span className="text-[10px] font-mono text-[#333333]">
            {state.toUpperCase()}
          </span>
          
          {blockNumber !== undefined && (
            <>
              <div className="w-px h-3 bg-[#1a1a1a]" />
              <span className="text-[10px] font-mono text-[#00ff41]">
                #{blockNumber.toLocaleString()}
              </span>
            </>
          )}
        </div>      </div>    </div>
  );
}
