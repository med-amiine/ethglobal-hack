"use client";

import { useEffect, useState, useCallback } from "react";
import * as Ably from "ably";

// Client-side Ably hook
export function useAblyChannel(channelName: string) {
  const [ably, setAbly] = useState<Ably.Realtime | null>(null);
  const [channel, setChannel] = useState<Ably.RealtimeChannel | null>(null);
  const [messages, setMessages] = useState<Ably.InboundMessage[]>([]);
  const [connectionState, setConnectionState] = useState<string>("initialized");

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ABLY_KEY) {
      console.warn("[Ably] No API key configured");
      return;
    }

    const client = new Ably.Realtime({
      key: process.env.NEXT_PUBLIC_ABLY_KEY,
      clientId: `jurex-network-${Math.random().toString(36).substr(2, 9)}`,
    });

    client.connection.on((stateChange) => {
      setConnectionState(stateChange.current);
      console.log(`[Ably] Connection state: ${stateChange.current}`);
    });

    const ch = client.channels.get(channelName);
    
    ch.subscribe((message) => {
      setMessages((prev) => [...prev.slice(-49), message]); // Keep last 50
    });

    setAbly(client);
    setChannel(ch);

    return () => {
      ch.unsubscribe();
      client.close();
    };
  }, [channelName]);

  const publish = useCallback(
    async (event: string, data: unknown) => {
      if (channel) {
        await channel.publish(event, data);
      }
    },
    [channel]
  );

  return { ably, channel, messages, connectionState, publish };
}

// Hook for case-specific updates
export function useCaseUpdates(caseId: string | undefined) {
  const channelName = caseId ? `jurex-network:case:${caseId}` : "jurex-network:cases";
  return useAblyChannel(channelName);
}

// Hook for agent-specific updates  
export function useAgentUpdates(agentId: string | undefined) {
  const channelName = agentId ? `jurex-network:agent:${agentId}` : "jurex-network:agents";
  return useAblyChannel(channelName);
}

// Hook for global validator updates
export function useValidatorUpdates() {
  return useAblyChannel("jurex-network:validators");
}

// Connection status indicator
export function useAblyStatus() {
  const { connectionState } = useAblyChannel("jurex-network:system");
  return {
    isConnected: connectionState === "connected",
    isConnecting: connectionState === "connecting",
    state: connectionState,
  };
}
