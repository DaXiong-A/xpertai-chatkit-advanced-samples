# Mindmap Assistant

An AI-powered mindmap editor built with XpertAI ChatKit SDK. Chat with AI to create, modify, and organize your mindmaps.

## Features

- **Interactive Mindmap Canvas**: Built with React Flow for smooth node editing and navigation
- **AI Assistant**: Use natural language to add nodes, brainstorm ideas, and organize your thoughts
- **Real-time Sync**: AI updates are reflected immediately on the canvas
- **Client Tools**: AI can query selected nodes via `get_selected_nodes`
- **Client Effects**: AI updates mindmap via `update_mindmap`, `focus_node`, `highlight_nodes`

## Architecture

```
┌─────────────────────────┬─────────────────────────┐
│      Mindmap Canvas     │       ChatKit           │
│      :5174              │       (iframe)          │
│                         │                         │
│   React Flow + Zustand  │   chatkit-host :5200    │
│                         │                         │
│  - Node selection       │  - AI conversation      │
│  - Drag & drop          │  - Client tool calls    │
│  - Collapse/expand      │  - Client effects       │
│                         │                         │
└─────────────────────────┴─────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  FastAPI      │
            │  :8000        │
            │               │
            │  - Sessions   │
            │  - Mindmap    │
            │    storage    │
            └───────────────┘
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- pnpm
- uv (Python package manager)

## Setup

### 1. Import Agent Configuration

Import `Mindmap-agents.yaml` into your XpertAI workspace. This configures:

- **Agent**: Mindmap Assistant with instructions for managing mindmap nodes
- **ClientToolMiddleware**: `get_selected_nodes` - queries currently selected nodes from UI
- **ClientEffectMiddleware**: `update_mindmap`, `focus_node`, `highlight_nodes` - updates UI

After import, copy the Xpert ID for use in environment variables.

### 2. Environment Variables

Create `backend/.env`:

```env
XPERTAI_API_KEY=your_api_key_here
XPERTAI_API_URL=https://api.xpertai.com
XPERT_ID=your_xpert_id_here
```

Create `frontend/.env`:

```env
VITE_XPERTAI_API_URL=http://localhost:3000/api/ai
VITE_XPERT_ID=your_xpert_id_here
VITE_CHATKIT_FRAME_URL=http://localhost:5200
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Configure CORS

Add ChatKit Host URL to `CORS_ALLOW_ORIGINS` in your XpertAI server:

```
CORS_ALLOW_ORIGINS=http://localhost:5200,http://127.0.0.1:5200
```

### 4. Install Dependencies

```bash
# From mindmap-assistant directory
pnpm run install:all

# Or manually:
cd frontend && pnpm install
cd ../backend && uv sync
```

### 5. Run Development Servers

**Terminal 1** - ChatKit Host:
```bash
pnpm -C examples/chatkit-host run serve  # http://localhost:5200
```

**Terminal 2** - Backend:
```bash
cd examples/mindmap-assistant/backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 3** - Frontend:
```bash
pnpm -C examples/mindmap-assistant/frontend run dev  # http://localhost:5174
```

Open http://localhost:5174 in your browser.

## Usage

1. Click a node to select it (blue highlight with yellow ring)
2. Chat with AI:
   - "Add 3 ideas about marketing to the selected node"
   - "Help me brainstorm product features"
   - "Expand the Goals node with more details"
3. AI will call tools to update the mindmap in real-time

## ChatKit Integration

### Client Tools (HITL)

`get_selected_nodes` - AI calls this to query which nodes are selected:

```typescript
onClientTool: async ({ name }) => {
  if (name === 'get_selected_nodes') {
    return {
      status: 'success',
      content: JSON.stringify({
        nodeIds: selectedNodeIds,
        nodes: selectedNodes,
        currentMindmap: mindmap,
      }),
    };
  }
}
```

### Client Effects (Fire-and-forget)

AI sends effects to update UI without blocking:

```typescript
onEffect: ({ name, data }) => {
  if (name === 'update_mindmap') {
    setMindmap(data.mindmap);
  }
  if (name === 'focus_node') {
    focusNode(data.nodeId);
  }
}
```

## Tech Stack

**Frontend**: React 19, TypeScript, Vite, React Flow, Zustand, Tailwind CSS, @xpert-ai/chatkit-react

**Backend**: Python 3.11+, FastAPI, httpx, Pydantic

## Project Structure

```
mindmap-assistant/
├── Mindmap-agents.yaml     # XpertAI agent configuration (import this)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MindmapCanvas.tsx  # React Flow canvas
│   │   │   ├── MindmapNode.tsx    # Custom node component
│   │   │   ├── ChatKitPanel.tsx   # ChatKit integration
│   │   │   └── Toolbar.tsx        # Top toolbar
│   │   ├── store/
│   │   │   ├── useMindmapStore.ts # Mindmap state
│   │   │   └── useAppStore.ts     # App state
│   │   └── lib/
│   │       ├── mindmap.ts         # Data types & conversion
│   │       ├── layout.ts          # Layout algorithm
│   │       └── config.ts          # Configuration
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app
│   │   └── data/
│   │       └── mindmap_store.py   # Data models
│   └── pyproject.toml
└── package.json
```

## License

MIT
