"""FastAPI main application for Mindmap Assistant."""

from __future__ import annotations

import os
import uuid
from typing import Any, Mapping

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .data.mindmap_store import MindmapStore, Mindmap

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Mindmap Assistant API",
    description="Backend API for Mindmap Assistant with ChatKit integration",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores
mindmap_store = MindmapStore()
user_sessions: dict[str, str] = {}  # cookie -> user_id

# Constants
LOCALE_STORAGE_KEY = "mindmap_user_id"


def get_env(key: str, default: str = "") -> str:
    """Get environment variable with default."""
    return os.getenv(key, default)


def chatkit_api_base() -> str:
    """Get ChatKit API base URL."""
    return get_env("XPERTAI_API_URL", "https://api.xpertai.com")


def respond(
    payload: dict[str, Any],
    status_code: int = 200,
    cookie_value: str | None = None,
) -> JSONResponse:
    """Create a JSON response with optional cookie."""
    response = JSONResponse(content=payload, status_code=status_code)
    if cookie_value:
        response.set_cookie(
            key=LOCALE_STORAGE_KEY,
            value=cookie_value,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 365,  # 1 year
        )
    return response


def resolve_user(cookies: Mapping[str, str]) -> tuple[str, str | None]:
    """Resolve or create user ID from cookies."""
    existing = cookies.get(LOCALE_STORAGE_KEY)
    if existing and existing in user_sessions:
        return user_sessions[existing], None

    # Create new user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    cookie_value = uuid.uuid4().hex
    user_sessions[cookie_value] = user_id
    return user_id, cookie_value


async def read_json_body(request: Request) -> dict[str, Any]:
    """Read and parse JSON body."""
    try:
        return await request.json()
    except Exception:
        return {}


class CreateSessionRequest(BaseModel):
    """Request body for create-session endpoint."""
    xpertId: str | None = None


@app.post("/api/create-session")
async def create_session(request: Request) -> JSONResponse:
    """Create a ChatKit session and return client secret."""
    api_key = get_env("XPERTAI_API_KEY")
    if not api_key:
        return respond({"error": "Missing XPERTAI_API_KEY"}, 500)

    body = await read_json_body(request)
    xpert_id = body.get("xpertId") or get_env("XPERT_ID")

    if not xpert_id:
        return respond({"error": "Missing xpertId"}, 400)

    user_id, cookie_value = resolve_user(request.cookies)
    api_base = chatkit_api_base()

    try:
        async with httpx.AsyncClient(base_url=api_base, timeout=30.0) as client:
            upstream = await client.post(
                "/v1/chatkit/sessions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "assistant": {"id": xpert_id},
                    "user": user_id,
                },
            )
    except httpx.RequestError as error:
        return respond({"error": f"Failed to reach API: {error}"}, 502, cookie_value)

    if not upstream.is_success:
        try:
            error_data = upstream.json()
            error_msg = error_data.get("error", upstream.reason_phrase)
        except Exception:
            error_msg = upstream.reason_phrase or "Unknown error"
        return respond({"error": error_msg}, upstream.status_code, cookie_value)

    try:
        payload = upstream.json()
    except Exception:
        return respond({"error": "Invalid response from API"}, 502, cookie_value)

    client_secret = payload.get("client_secret")
    if not client_secret:
        return respond({"error": "Missing client_secret"}, 502, cookie_value)

    return respond(
        {
            "client_secret": client_secret,
            "expires_after": payload.get("expires_after"),
        },
        200,
        cookie_value,
    )


@app.get("/api/mindmap/{mindmap_id}")
async def get_mindmap(mindmap_id: str) -> JSONResponse:
    """Get a mindmap by ID."""
    mindmap = mindmap_store.get_or_create_mindmap(mindmap_id)
    return JSONResponse(content={"mindmap": mindmap.model_dump()})


class UpdateMindmapRequest(BaseModel):
    """Request body for updating mindmap."""
    mindmap: Mindmap


@app.post("/api/mindmap/{mindmap_id}")
async def update_mindmap(mindmap_id: str, request: UpdateMindmapRequest) -> JSONResponse:
    """Update a mindmap."""
    mindmap = request.mindmap
    mindmap.id = mindmap_id
    mindmap_store.save_mindmap(mindmap)
    return JSONResponse(content={"mindmap": mindmap.model_dump()})


class AddNodeRequest(BaseModel):
    """Request body for adding a node."""
    parent_id: str
    text: str


@app.post("/api/mindmap/{mindmap_id}/add-node")
async def add_node(mindmap_id: str, request: AddNodeRequest) -> JSONResponse:
    """Add a node to the mindmap."""
    try:
        mindmap, new_node = mindmap_store.add_node(
            mindmap_id, request.parent_id, request.text
        )
        return JSONResponse(
            content={
                "mindmap": mindmap.model_dump(),
                "newNode": new_node.model_dump(),
            }
        )
    except ValueError as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


class AddBranchRequest(BaseModel):
    """Request body for adding a branch."""
    parent_id: str
    texts: list[str]


@app.post("/api/mindmap/{mindmap_id}/add-branch")
async def add_branch(mindmap_id: str, request: AddBranchRequest) -> JSONResponse:
    """Add multiple nodes as a branch."""
    try:
        mindmap, new_nodes = mindmap_store.add_branch(
            mindmap_id, request.parent_id, request.texts
        )
        return JSONResponse(
            content={
                "mindmap": mindmap.model_dump(),
                "newNodes": [n.model_dump() for n in new_nodes],
            }
        )
    except ValueError as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


class DeleteNodeRequest(BaseModel):
    """Request body for deleting a node."""
    node_id: str


@app.post("/api/mindmap/{mindmap_id}/delete-node")
async def delete_node(mindmap_id: str, request: DeleteNodeRequest) -> JSONResponse:
    """Delete a node from the mindmap."""
    try:
        mindmap = mindmap_store.delete_node(mindmap_id, request.node_id)
        return JSONResponse(content={"mindmap": mindmap.model_dump()})
    except ValueError as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


class UpdateNodeRequest(BaseModel):
    """Request body for updating a node."""
    node_id: str
    text: str


@app.post("/api/mindmap/{mindmap_id}/update-node")
async def update_node(mindmap_id: str, request: UpdateNodeRequest) -> JSONResponse:
    """Update a node's text."""
    try:
        mindmap = mindmap_store.update_node_text(
            mindmap_id, request.node_id, request.text
        )
        return JSONResponse(content={"mindmap": mindmap.model_dump()})
    except ValueError as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
