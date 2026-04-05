import { NextResponse } from "next/server";

/**
 * GET /api/docs
 * Returns OpenAPI/Swagger schema for all API endpoints
 */
export async function GET() {
  const schema = {
    openapi: "3.0.0",
    info: {
      title: "Jurex v2 API",
      version: "1.0.0",
      description: "The Court for the Agent Economy - Decentralized dispute resolution for AI agents",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development",
      },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "System health check",
          responses: {
            "200": {
              description: "System operational",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      checks: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/ens/register": {
        post: {
          tags: ["ENS"],
          summary: "Register agent with ENS name",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["agentName", "address"],
                  properties: {
                    agentName: { type: "string", example: "giza" },
                    address: { type: "string", example: "0x1234..." },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Agent registered",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      ensName: { type: "string", example: "giza.jurex.eth" },
                      erc8004Score: { type: "number", example: 500 },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/ens/resolve": {
        get: {
          tags: ["ENS"],
          summary: "Lookup agent by ENS name",
          parameters: [
            {
              name: "name",
              in: "query",
              required: true,
              schema: { type: "string", example: "giza.jurex.eth" },
            },
          ],
          responses: {
            "200": {
              description: "Agent found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      address: { type: "string" },
                      erc8004Score: { type: "number" },
                      casesWon: { type: "number" },
                      casesLost: { type: "number" },
                    },
                  },
                },
              },
            },
            "404": { description: "Agent not found" },
          },
        },
      },

      "/api/arc/create-task-payment": {
        post: {
          tags: ["Arc x402"],
          summary: "Create task payment request",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["agentAddress", "taskDescription", "budgetUSDC", "clientAddress"],
                  properties: {
                    agentAddress: { type: "string" },
                    taskDescription: { type: "string" },
                    budgetUSDC: { type: "number" },
                    clientAddress: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Task created",
            },
          },
        },
      },

      "/api/escrow/deposit": {
        post: {
          tags: ["Escrow"],
          summary: "Lock USDC in escrow",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["caseId", "clientAddress", "amountUSDC"],
                  properties: {
                    caseId: { type: "string" },
                    clientAddress: { type: "string" },
                    amountUSDC: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Escrow locked" },
          },
        },
      },

      "/api/escrow/release": {
        post: {
          tags: ["Escrow"],
          summary: "Release escrow to winner",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["caseId", "winnerAddress"],
                  properties: {
                    caseId: { type: "string" },
                    winnerAddress: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Escrow released" },
          },
        },
      },

      "/api/judges/verify": {
        post: {
          tags: ["Judges"],
          summary: "Register World ID verified judge",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nullifierHash", "address", "proof"],
                  properties: {
                    nullifierHash: { type: "string" },
                    address: { type: "string" },
                    proof: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Judge verified" },
          },
        },
      },

      "/api/cases/{caseId}/rule": {
        post: {
          tags: ["Cases"],
          summary: "Judge vote on case",
          parameters: [
            {
              name: "caseId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nullifierHash", "ruling"],
                  properties: {
                    nullifierHash: { type: "string" },
                    ruling: { type: "string", enum: ["agent", "client"] },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Vote recorded" },
          },
        },
      },

      "/api/cases/{caseId}/rulings": {
        get: {
          tags: ["Cases"],
          summary: "Get case votes (anonymized)",
          parameters: [
            {
              name: "caseId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Case rulings" },
          },
        },
      },

      "/api/demo/reset": {
        post: {
          tags: ["Demo"],
          summary: "Clear all data (demo mode only)",
          responses: {
            "200": { description: "Data cleared" },
          },
        },
      },

      "/api/demo/run-cre": {
        post: {
          tags: ["Demo"],
          summary: "Execute CRE deadline enforcer simulation",
          responses: {
            "200": { description: "CRE execution complete" },
          },
        },
      },

      "/api/agents": {
        get: {
          tags: ["Agents"],
          summary: "Get all registered agents",
          responses: {
            "200": { description: "List of agents" },
          },
        },
      },

      "/api/cases/open": {
        get: {
          tags: ["Cases"],
          summary: "Get open unresolved cases",
          responses: {
            "200": { description: "List of open cases" },
          },
        },
      },
    },

    components: {
      schemas: {
        Agent: {
          type: "object",
          properties: {
            name: { type: "string" },
            address: { type: "string" },
            erc8004Score: { type: "number" },
            casesWon: { type: "number" },
            casesLost: { type: "number" },
            registeredAt: { type: "string" },
          },
        },
        Case: {
          type: "object",
          properties: {
            id: { type: "string" },
            clientAddress: { type: "string" },
            agentAddress: { type: "string" },
            status: { type: "string", enum: ["open", "disputed", "resolved"] },
            votes: { type: "array" },
            resolved: { type: "boolean" },
          },
        },
      },
    },
  };

  return NextResponse.json(schema);
}
