# Render deployment notes (MVP)

## Prerequisites
- Repo pushed to GitHub.
- Render account connected to GitHub.

## Option A: Blueprint (recommended)
1. In Render, choose **New +** -> **Blueprint**.
2. Point to repo and set blueprint path to `server/agents/render/render.yaml`.
3. Confirm environment variables and deploy.

## Option B: Manual web service
1. Create a new **Web Service**.
2. Set root directory to `server/agents`.
3. Build command: `npm install`.
4. Start command: `npm run start`.
5. Add env vars from `.env.example`.

## Verify
- `GET /healthz` returns status `ok`.
- `POST /v1/agent/triage` returns `status: success` with action plan.

## Local preflight (recommended before deploy)
From repo root:

```bash
node tests/validate-agent-artifacts.mjs
bash server/agents/render/smoke-triage.sh
```

## Free-tier considerations
- Service may cold-start after idle periods.
- Keep payload sizes and request frequency moderate for MVP demos.
