# Deep Researcher Backend (uv + FastAPI)

A tiny FastAPI service that exchanges a workflow/assistant id for a ChatKit client secret. Uses uv for dependency management.

## Quickstart

1) Install uv if needed:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2) Install dependencies:

```bash
uv sync
```

3) Run the API (defaults to port 8011):

```bash
uv run uvicorn deep_researcher_backend.app:app --host 0.0.0.0 --port ${PORT:-8011} --reload
```

Health check: http://localhost:8011/health

## Environment

Copy `.env.example` to `.env` and fill in secrets.

- `XPERTAI_API_KEY`: Backend secret used to call ChatKit API.
- `XPERTAI_API_URL` (optional): Override ChatKit API base. Falls back to `VITE_XPERTAI_API_URL`, then `https://api.xpertai.cn`.
- `PORT`: Optional. Defaults to `8011`.
- `VITE_XPERTAI_API_URL`: Kept for compatibility with the frontend environment file.

## Endpoint

- `POST /api/create-session`
  - Body: `{ "assistant_id" | "assistantId" | "workflow_id" | "workflowId": "<id>" }`
  - Returns `{ "client_secret": "...", "expires_after": <seconds|null> }`
  - Sets an `HttpOnly` cookie (`dr_uid`) to keep a stable user id.
