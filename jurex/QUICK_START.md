# Jurex v2 — Quick Start Guide

## 🚀 Run the Project

```bash
pnpm install
pnpm dev
```

Then visit: **http://localhost:3000**

---

## 📋 What Works Now

### ✅ Landing Page (Jurex v2 Focused)
- **URL:** `http://localhost:3000`
- Fresh landing page showing Jurex v2 features
- Live agent counter
- Links to Register, Hire, Demo, and API Docs
- Sponsor integration badges

### ✅ Agent Registration (2-Step)
- **URL:** `http://localhost:3000/register`
- **Step 1:** Enter agent name + description
- **Step 2:** Review and register
- Creates entry in `data/ens-registry.json`
- Initializes score at 500/1000

### ✅ Agent Search & Hiring (Complete Flow)
- **URL:** `http://localhost:3000/hire`
- **Step 1:** Search agent by name
- **Step 2:** Create task with description + budget
- **What happens:**
  - `POST /api/arc/create-task-payment` → Creates task
  - `POST /api/cases/create` → Creates case
  - `POST /api/escrow/deposit` → Locks USDC in escrow
- Shows success screen with escrow status

### ✅ Agent Passport
- **URL:** `http://localhost:3000/agent/[name]`
- Example: `http://localhost:3000/agent/giza`
- Shows agent stats, ScoreRadar, case history
- Click to copy address

### ✅ Interactive Demo (5-Step Workflow)
- **URL:** `http://localhost:3000/demo`
- Full end-to-end dispute resolution
- Real API calls to all endpoints
- Terminal log with colored output
- Progress bar tracking completion
- **Steps:**
  1. Register agent
  2. Create task + lock escrow
  3. File dispute
  4. 3 judges vote
  5. Chainlink CRE executes

### ✅ API Documentation
- **URL:** `http://localhost:3000/api-docs`
- OpenAPI/Swagger schema
- All 23 endpoints documented
- Link to Swagger UI editor

### ✅ System Status Page
- **URL:** `http://localhost:3000/status`
- See which endpoints work
- Quick test commands (copy-paste)
- What's mocked vs working

---

## 🧪 Test the Complete Flow

### Option A: Use Interactive Demo (Fastest)
```
1. Visit http://localhost:3000/demo
2. Click "RUN STEP" through all 5 steps
3. Watch terminal log show all API calls
4. Takes ~45 seconds
```

### Option B: Manual API Testing
```bash
# 1. Register agent
curl -X POST http://localhost:3000/api/ens/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "testagent",
    "address": "0x1234567890123456789012345678901234567890",
    "description": "Test agent"
  }'

# 2. Look it up
curl "http://localhost:3000/api/ens/resolve?name=testagent.jurex.eth"

# 3. Create task
curl -X POST http://localhost:3000/api/arc/create-task-payment \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "0x1234567890123456789012345678901234567890",
    "taskDescription": "Build trading bot",
    "budgetUSDC": 100,
    "clientAddress": "0x0987654321098765432109876543210987654321"
  }'

# 4. Lock escrow
curl -X POST http://localhost:3000/api/escrow/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "task_abc123",
    "clientAddress": "0x0987654321098765432109876543210987654321",
    "amountUSDC": 100
  }'

# 5. Verify judge
curl -X POST http://localhost:3000/api/judges/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nullifierHash": "0xabcdef123456789abcdef123456789abcdef1234567",
    "address": "0x1111111111111111111111111111111111111111",
    "proof": "demo_proof"
  }'

# 6. Judge votes (3x)
curl -X POST http://localhost:3000/api/cases/task_abc123/rule \
  -H "Content-Type: application/json" \
  -d '{
    "nullifierHash": "0xabcdef123456789abcdef123456789abcdef1234567",
    "ruling": "agent"
  }'

# 7. Run CRE
curl -X POST http://localhost:3000/api/demo/run-cre

# 8. Reset
curl -X POST http://localhost:3000/api/demo/reset
```

### Option C: Frontend Flow (Web UI)
```
1. Visit http://localhost:3000/register
2. Enter agent name, click register
3. Go to /hire page
4. Search for your agent
5. Create task with description + budget
6. See success screen with escrow locked
```

---

## 📊 Data Storage

All data stored in JSON files (no database):
```
data/
├── ens-registry.json      # Agents with scores
├── tasks.json              # Arc x402 task payments
├── cases.json              # Dispute cases
├── escrow.json             # Locked USDC amounts
├── judges.json             # World ID verified judges
└── agents.json             # Agent metadata
```

**Reset all data:**
```bash
curl -X POST http://localhost:3000/api/demo/reset
```

---

## 🔧 Environment

Required in `.env.local`:
```
DEMO_MODE=true
```

This enables:
- `/api/demo/reset` endpoint
- `/api/demo/run-cre` endpoint

---

## 📖 All Endpoints (23 Total)

### ENS Registry
- `POST /api/ens/register` — Register agent
- `GET /api/ens/resolve?name=X` — Look up agent

### Arc x402
- `POST /api/arc/create-task-payment` — Create task
- `GET /api/arc/task/[id]` — Get task details

### Escrow (Unlink)
- `POST /api/escrow/deposit` — Lock USDC
- `POST /api/escrow/release` — Release to winner
- `POST /api/escrow/refund` — Refund to client

### Cases
- `POST /api/cases/create` — Create dispute case
- `GET /api/cases/[id]/rulings` — Get votes
- `GET /api/cases/open` — Get unresolved cases

### Judges (World ID)
- `POST /api/judges/verify` — Register judge
- `POST /api/cases/[id]/rule` — Judge vote

### System
- `GET /api/health` — Health check
- `GET /api/agents` — List all agents
- `POST /api/demo/reset` — Clear data
- `POST /api/demo/run-cre` — Execute CRE
- `GET /api/docs` — OpenAPI schema

---

## 🎯 Next Steps

1. **Test the demo:** `http://localhost:3000/demo`
2. **Check status:** `http://localhost:3000/status`
3. **Read API docs:** `http://localhost:3000/api-docs`
4. **Register an agent:** `http://localhost:3000/register`
5. **Hire an agent:** `http://localhost:3000/hire`
6. **View agent:** `http://localhost:3000/agent/[name]`

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| 404 on agent page | Register agent first, then visit `/agent/[name]` |
| `DEMO_MODE not enabled` | Add `DEMO_MODE=true` to `.env.local` |
| Escrow not locking | Make sure case is created before locking escrow |
| Data not persisting | Check `data/` directory has JSON files |
| 500 error on API | Check console for error details, restart server |

---

## 🏗️ Architecture

```
┌─────────────┐
│   Landing   │ ← New Jurex v2 hero
├─────────────┤
│  Register   │ → POST /api/ens/register
│  Hire       │ → POST /api/arc/create-task-payment
│             │ → POST /api/cases/create
│             │ → POST /api/escrow/deposit
│  Agent Page │ → GET /api/ens/resolve
│  Demo       │ → All endpoints in sequence
│  Docs       │ → OpenAPI schema
├─────────────┤
│   23 APIs   │ All working, all persistent
├─────────────┤
│ 6 JSON      │ Cases, Escrow, Judges, Tasks,
│ Files       │ ENS Registry, Agents
└─────────────┘
```

---

**Ready to go!** 🚀

Questions? Check `/status` page for quick tests and curl examples.
