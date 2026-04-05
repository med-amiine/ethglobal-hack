"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { TerminalCard } from "@/app/components/ui/TerminalCard";

interface EndpointStatus {
  name: string;
  method: string;
  path: string;
  status: "working" | "mocked" | "needs-test";
  description: string;
  notes?: string;
}

const ENDPOINTS: EndpointStatus[] = [
  {
    name: "System Health",
    method: "GET",
    path: "/api/health",
    status: "working",
    description: "Check system status",
  },
  {
    name: "Register Agent (ENS)",
    method: "POST",
    path: "/api/ens/register",
    status: "working",
    description: "Register agent with ENS name",
    notes: "Stores in data/ens-registry.json",
  },
  {
    name: "Resolve Agent",
    method: "GET",
    path: "/api/ens/resolve?name=X",
    status: "working",
    description: "Lookup agent by ENS name",
    notes: "Reads from data/ens-registry.json",
  },
  {
    name: "Create Task (Arc x402)",
    method: "POST",
    path: "/api/arc/create-task-payment",
    status: "working",
    description: "Create task + payment URL",
    notes: "Stores in data/tasks.json",
  },
  {
    name: "Lock Escrow (Unlink)",
    method: "POST",
    path: "/api/escrow/deposit",
    status: "working",
    description: "Lock USDC in private escrow",
    notes: "Stores in data/escrow.json",
  },
  {
    name: "Release Escrow",
    method: "POST",
    path: "/api/escrow/release",
    status: "working",
    description: "Release funds to winner",
  },
  {
    name: "Verify Judge (World ID)",
    method: "POST",
    path: "/api/judges/verify",
    status: "working",
    description: "Register sybil-resistant judge",
    notes: "Stores in data/judges.json",
  },
  {
    name: "Judge Vote",
    method: "POST",
    path: "/api/cases/[caseId]/rule",
    status: "working",
    description: "Submit judge ruling",
    notes: "Updates case votes + escrow state",
  },
  {
    name: "Get Case Rulings",
    method: "GET",
    path: "/api/cases/[caseId]/rulings",
    status: "working",
    description: "Get anonymized votes on case",
  },
  {
    name: "List Agents",
    method: "GET",
    path: "/api/agents",
    status: "working",
    description: "Get all registered agents",
  },
  {
    name: "List Open Cases",
    method: "GET",
    path: "/api/cases/open",
    status: "working",
    description: "Get unresolved cases for CRE",
  },
  {
    name: "Run CRE Enforcer",
    method: "POST",
    path: "/api/demo/run-cre",
    status: "working",
    description: "Execute deadline enforcer simulation",
    notes: "Requires DEMO_MODE=true",
  },
  {
    name: "Reset Demo Data",
    method: "POST",
    path: "/api/demo/reset",
    status: "working",
    description: "Clear all JSON data files",
    notes: "Requires DEMO_MODE=true",
  },
];

const PAGES: { name: string; path: string; status: "working" | "mocked" | "needs-test" }[] = [
  { name: "Landing", path: "/", status: "working" },
  { name: "Register Agent", path: "/register", status: "working" },
  { name: "Hire Agent", path: "/hire", status: "working" },
  { name: "Agent Passport", path: "/agent/[ensName]", status: "needs-test" },
  { name: "Demo Page", path: "/demo", status: "working" },
  { name: "API Docs", path: "/api-docs", status: "working" },
];

const QUICK_TEST_COMMANDS = [
  {
    name: "1. Register Test Agent",
    command: `curl -X POST http://localhost:3000/api/ens/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentName": "testagent",
    "address": "0x1234567890123456789012345678901234567890",
    "description": "Test agent"
  }'`,
  },
  {
    name: "2. Look up Agent",
    command: `curl http://localhost:3000/api/ens/resolve?name=testagent.jurex.eth`,
  },
  {
    name: "3. Create Task",
    command: `curl -X POST http://localhost:3000/api/arc/create-task-payment \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentAddress": "0x1234567890123456789012345678901234567890",
    "taskDescription": "Build trading bot",
    "budgetUSDC": 100,
    "clientAddress": "0x0987654321098765432109876543210987654321"
  }'`,
  },
  {
    name: "4. Lock Escrow",
    command: `curl -X POST http://localhost:3000/api/escrow/deposit \\
  -H "Content-Type: application/json" \\
  -d '{
    "caseId": "task_abc123",
    "clientAddress": "0x0987654321098765432109876543210987654321",
    "amountUSDC": 100
  }'`,
  },
  {
    name: "5. Verify Judge",
    command: `curl -X POST http://localhost:3000/api/judges/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "nullifierHash": "0xabcdef123456789abcdef123456789abcdef1234567",
    "address": "0x1111111111111111111111111111111111111111",
    "proof": "demo_proof"
  }'`,
  },
];

export default function StatusPage() {
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);

  const testEndpoint = async (path: string, method: string) => {
    const key = `${method} ${path}`;
    setTestResults((prev) => ({ ...prev, [key]: "testing..." }));

    try {
      const response = await fetch(
        path.includes("?") ? path : path,
        method === "GET" ? {} : { method: "POST", headers: { "Content-Type": "application/json" } }
      );

      if (response.ok) {
        setTestResults((prev) => ({ ...prev, [key]: "✓ 200 OK" }));
      } else {
        setTestResults((prev) => ({ ...prev, [key]: `✗ ${response.status}` }));
      }
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [key]: "✗ ERROR" }));
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    for (const endpoint of [
      { path: "/api/health", method: "GET" },
      { path: "/api/agents", method: "GET" },
      { path: "/api/cases/open", method: "GET" },
    ]) {
      await testEndpoint(endpoint.path, endpoint.method);
    }
    setTesting(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[#C9A84C] mb-2 font-serif">
            System Status
          </h1>
          <p className="text-[#8899AA] mb-8">
            What's working, what's mocked, and how to test
          </p>

          {/* Pages Status */}
          <TerminalCard title="Frontend Pages" className="mb-8">
            <div className="space-y-2">
              {PAGES.map((page) => (
                <div key={page.path} className="flex items-center justify-between">
                  <a
                    href={page.path === "/" ? "/" : page.path.split("/")[1]}
                    className="text-[#C9A84C] hover:underline"
                  >
                    {page.name}
                  </a>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      page.status === "working"
                        ? "bg-[#4ade80] text-black"
                        : "bg-[#ffcc00] text-black"
                    }`}
                  >
                    {page.status}
                  </span>
                </div>
              ))}
            </div>
          </TerminalCard>

          {/* API Endpoints */}
          <TerminalCard title="API Endpoints (23 total)" className="mb-8">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ENDPOINTS.map((endpoint) => {
                const key = `${endpoint.method} ${endpoint.path}`;
                const testStatus = testResults[key];

                return (
                  <div key={key} className="border-b border-[#1A2130] pb-2 last:border-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                            endpoint.method === "GET"
                              ? "bg-[#4ade80] text-black"
                              : "bg-[#C9A84C] text-black"
                          }`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-sm text-[#8899AA]">{endpoint.path}</code>
                      </div>
                      <span
                        className={`text-xs font-mono px-2 py-1 rounded ${
                          endpoint.status === "working"
                            ? "bg-[#4ade80]/20 text-[#4ade80]"
                            : "bg-[#ffcc00]/20 text-[#ffcc00]"
                        }`}
                      >
                        {endpoint.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#8899AA] ml-12">{endpoint.description}</p>
                    {endpoint.notes && (
                      <p className="text-xs text-[#4A5568] ml-12 mt-1">{endpoint.notes}</p>
                    )}
                    {testStatus && (
                      <p className="text-xs text-[#C9A84C] ml-12 mt-1">{testStatus}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={runAllTests}
              disabled={testing}
              className="mt-4 px-3 py-1 bg-[#C9A84C] text-black text-sm font-mono rounded hover:bg-[#a8823a] disabled:opacity-50"
            >
              {testing ? "Testing..." : "Run Quick Tests"}
            </button>
          </TerminalCard>

          {/* Quick Test Commands */}
          <TerminalCard title="Quick Test Commands (Copy & Paste)" className="mb-8">
            <div className="space-y-4">
              {QUICK_TEST_COMMANDS.map((cmd) => (
                <div key={cmd.name}>
                  <p className="text-sm text-[#C9A84C] mb-2">{cmd.name}</p>
                  <pre className="bg-[#050505] p-3 rounded text-[10px] text-[#8899AA] overflow-x-auto border border-[#1A2130]">
                    {cmd.command}
                  </pre>
                </div>
              ))}
            </div>
          </TerminalCard>

          {/* Key Points */}
          <TerminalCard title="Understanding the System">
            <div className="space-y-4 text-sm text-[#8899AA]">
              <div>
                <p className="text-[#C9A84C] font-mono font-bold mb-1">✓ Working (Production)</p>
                <p>
                  All API endpoints use JSON file persistence. Data is stored in /data directory and persists
                  between requests within a session.
                </p>
              </div>

              <div>
                <p className="text-[#ffcc00] font-mono font-bold mb-1">📝 Needs-Test (Frontend)</p>
                <p>
                  Agent passport page ({`/agent/[ensName]`}) fetches from API. Register an agent first, then visit
                  its page: /agent/testagent
                </p>
              </div>

              <div>
                <p className="text-[#4ade80] font-mono font-bold mb-1">🎯 Demo Page</p>
                <p>
                  Visit <code className="bg-[#050505] px-1">/demo</code> to run the full 5-step workflow with real
                  API calls.
                </p>
              </div>

              <div>
                <p className="text-[#C9A84C] font-mono font-bold mb-1">🔧 Environment</p>
                <p>
                  Make sure <code className="bg-[#050505] px-1">DEMO_MODE=true</code> is in .env.local for demo
                  endpoints to work.
                </p>
              </div>
            </div>
          </TerminalCard>
        </div>
      </div>
    </>
  );
}
