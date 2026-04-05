# Agent Court API Service

Standalone Python FastAPI service for Agent Court - separated from the frontend.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Web3.py** - Ethereum blockchain interaction
- **Uvicorn** - ASGI server
- **Python 3.12**

## Endpoints

All endpoints are documented via Swagger UI at `/docs`.

### System
- `GET /` - API info
- `GET /health` - Health check

### Cases
- `GET /cases` - List all cases
- `GET /cases/{address}` - Get case details
- `POST /cases/verify-tx` - Verify transaction on-chain
- `POST /cases/file-x402` - File x402 payment dispute

### Agent
- `GET /agent/reputation/{address}` - Get agent reputation
- `POST /agent/file-case` - Agent-native case filing (snake_case)
- `GET /agent/discover` - Discover agents

## Local Development

```bash
cd api-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

## Deploy to Vercel

```bash
cd api-service
vercel --prod
```

## Environment Variables

- `ARBITRUM_RPC_URL` - Arbitrum Sepolia RPC endpoint (default: https://sepolia-rollup.arbitrum.io/rpc)
- `PORT` - Server port (default: 8000)

## Contract Addresses (Arbitrum Sepolia)

- CourtRegistry: `0x6D5FcFC0D66E6A269630B441056fA13A7deFA3eB`
- CourtCaseFactory: `0x59A080BEe39B9992bC2c5b94790897295CCBa0a8`
