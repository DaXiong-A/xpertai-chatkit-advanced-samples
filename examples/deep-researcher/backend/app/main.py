import json
import os
import uuid
from typing import Any, Mapping, MutableMapping, Tuple

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

APP_NAME = "Deep Researcher Backend"
APP_VERSION = "0.1.0"
COOKIE_NAME = "dr_uid"


app = FastAPI(title=APP_NAME, version=APP_VERSION)

def cors_config() -> tuple[list[str], str | None, bool]:
    return ([], ".*", True)

_cors_origins, _cors_origin_regex, _cors_allow_credentials = cors_config()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_origin_regex,
    allow_credentials=_cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

def respond(payload: Mapping[str, Any], status_code: int, cookie_value: str | None = None) -> JSONResponse:
    response = JSONResponse(content=payload, status_code=status_code)
    if cookie_value:
        response.set_cookie(
            key=COOKIE_NAME,
            value=cookie_value,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 365,
        )
    return response


def chatkit_api_base() -> str:
    override = os.getenv("XPERTAI_API_URL") or os.getenv("VITE_XPERTAI_API_URL")
    if override:
        return override.rstrip("/")
    return "https://api.xpertai.cn"


def resolve_user(cookies: Mapping[str, str]) -> Tuple[str, str | None]:
    existing = cookies.get(COOKIE_NAME)
    if existing:
        return existing, None
    new_id = f"anon-{uuid.uuid4().hex}"
    return new_id, new_id


def resolve_assistant_id(body: Any) -> str | None:
    if not isinstance(body, Mapping):
        return None
    keys = ["assistant_id", "assistantId", "workflow_id", "workflowId"]
    for key in keys:
        value = body.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def parse_json(response: httpx.Response) -> Any:
    try:
        return response.json()
    except (ValueError, json.JSONDecodeError):
        return None


async def read_json_body(request: Request) -> MutableMapping[str, Any]:
    try:
        body = await request.json()
    except (ValueError, json.JSONDecodeError):
        return {}
    if isinstance(body, MutableMapping):
        return body
    return {}


@app.get("/health")
async def health() -> Mapping[str, str]:
    return {"status": "ok"}


@app.post("/api/create-session")
async def create_session(request: Request) -> JSONResponse:
    """Exchange a workflow id for a ChatKit client secret."""
    api_key = os.getenv("XPERTAI_API_KEY")
    if not api_key:
        return respond({"error": "Missing XPERTAI_API_KEY environment variable"}, 500)

    body = await read_json_body(request)
    assistant_id = resolve_assistant_id(body)

    if not assistant_id:
        return respond({"error": "Missing assistant id"}, 400)

    user_id, cookie_value = resolve_user(request.cookies)
    api_base = chatkit_api_base()

    try:
        async with httpx.AsyncClient(base_url=api_base, timeout=10.0) as client:
            upstream = await client.post(
                "/v1/chatkit/sessions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"assistant": {"id": assistant_id}, "user": user_id},
            )
    except httpx.RequestError as error:
        return respond(
            {"error": f"Failed to reach ChatKit API: {error}"},
            502,
            cookie_value,
        )

    payload = parse_json(upstream)
    if not upstream.is_success:
        message: str | None = None
        if isinstance(payload, Mapping):
            message = payload.get("error")
        message = message or upstream.reason_phrase or "Failed to create session"
        return respond({"error": message}, upstream.status_code, cookie_value)

    client_secret = None
    expires_after = None
    if isinstance(payload, Mapping):
        client_secret = payload.get("client_secret")
        expires_after = payload.get("expires_after")

    if not client_secret:
        return respond(
            {"error": "Missing client secret in response"},
            502,
            cookie_value,
        )

    return respond(
        {"client_secret": client_secret, "expires_after": expires_after},
        200,
        cookie_value,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "deep_researcher_backend.app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8011")),
        reload=True,
    )
