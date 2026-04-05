import { Alchemy, Network } from "alchemy-sdk";
import { publishEvent, CHANNELS, EVENTS } from "./realtime";

// Alchemy WebSocket configuration
const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ARB_SEPOLIA,
});

// Contract addresses — current deployment (deployments-test.json)
const COURT_REGISTRY = "0x2d02a6A204de958cFa6551710681f230043bF646";
const CASE_FACTORY = "0xeF82E15EA473dF494f0476ead243556350Ee9c91";

// Event signatures (topic0)
const EVENT_SIGNATURES = {
  // CourtRegistry events
  AgentRegistered: "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
  ReputationUpdated: "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540c752299a95",
  
  // CourtCaseFactory events
  CaseCreated: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  
  // Generic ERC20/ETH transfers (for stake tracking)
  Transfer: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
};

let isListening = false;

export function startAlchemyListener() {
  if (isListening) {
    console.log("[Alchemy] Listener already running");
    return;
  }

  console.log("[Alchemy] Starting WebSocket listener...");
  isListening = true;

  // Subscribe to pending transactions involving our contracts
  const ws = alchemy.ws;

  // Listen for CaseCreated events from factory
  ws.on(
    {
      address: CASE_FACTORY,
      topics: [null], // All events from factory
    },
    async (log) => {
      console.log("[Alchemy] CaseFactory event:", log.transactionHash);
      
      await publishEvent(CHANNELS.cases, EVENTS.CASE_CREATED, {
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        address: log.address,
        topics: log.topics,
        data: log.data,
        timestamp: Date.now(),
      });
    }
  );

  // Listen for AgentRegistered events from registry
  ws.on(
    {
      address: COURT_REGISTRY,
      topics: [null],
    },
    async (log) => {
      console.log("[Alchemy] Registry event:", log.transactionHash);
      
      await publishEvent(CHANNELS.agents, EVENTS.AGENT_REGISTERED, {
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        address: log.address,
        topics: log.topics,
        data: log.data,
        timestamp: Date.now(),
      });
    }
  );

  // Listen for all case contract events (we'll filter by case address pattern)
  ws.on(
    {
      topics: [[
        // Event signatures we're interested in
        EVENT_SIGNATURES.CaseCreated,
        EVENT_SIGNATURES.ReputationUpdated,
      ]],
    },
    async (log) => {
      console.log("[Alchemy] Generic event:", log.transactionHash);
    }
  );

  // Heartbeat to keep connection alive
  setInterval(() => {
    console.log("[Alchemy] Heartbeat - connection active");
  }, 60000);

  console.log("[Alchemy] WebSocket listener started");
}

// DRPC WebSocket fallback (no API key required)
export async function startDRPCListener() {
  const DRPC_WS = "wss://arbitrum.drpc.org";
  
  console.log("[DRPC] Starting backup listener...");
  
  // Skip in serverless environment (Vercel)
  if (typeof window === "undefined" && process.env.VERCEL) {
    console.log("[DRPC] Skipping - serverless environment");
    return;
  }
  
  try {
    const WebSocketModule = await import("ws");
    const WebSocketClient = WebSocketModule.default;
    const ws = new WebSocketClient(DRPC_WS);

    ws.on("open", () => {
      console.log("[DRPC] Connected");
      
      // Subscribe to new blocks
      ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_subscribe",
        params: ["newHeads"],
      }));
    });

    ws.on("message", async (data: Buffer) => {
      const response = JSON.parse(data.toString());
      
      if (response.params?.result) {
        const block = response.params.result;
        console.log("[DRPC] New block:", block.number);
        
        await publishEvent(CHANNELS.system, "NEW_BLOCK", {
          blockNumber: parseInt(block.number, 16),
          blockHash: block.hash,
          timestamp: Date.now(),
        });
      }
    });

    ws.on("error", (err: Error) => {
      console.error("[DRPC] Error:", err.message);
    });

    ws.on("close", () => {
      console.log("[DRPC] Connection closed, reconnecting...");
      setTimeout(startDRPCListener, 5000);
    });

  } catch (err) {
    console.error("[DRPC] Failed to connect:", err);
  }
}

// Graceful shutdown
export function stopAlchemyListener() {
  isListening = false;
  // Alchemy SDK handles cleanup automatically
  console.log("[Alchemy] Listener stopped");
}
