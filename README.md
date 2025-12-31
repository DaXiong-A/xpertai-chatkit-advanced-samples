# xpertai-chatkit-advanced-samples

Starter apps to build with the XpertAI ChatKit SDK.

## Deep Researcher Example

### Prerequisites

1. Import the file *examples/deep-researcher/xpert-chatkit-deep-researcher.yaml* into the XpertAI platform.
2. `VITE_CHATKIT_XPERT_ID`: Digital Expert ID from the XpertAI platform.
3. `XPERTAI_API_KEY`: API Key from the XpertAI platform.
4. Startup instructions:

```shell
$ pnpm install
# Copy .env.example to .env and fill in your environment variables.
$ cp examples/deep-researcher/frontend/.env.example examples/deep-researcher/frontend/.env
$ cp examples/deep-researcher/backend/.env.example examples/deep-researcher/backend/.env
# Start all services with a single command
$ pnpm dev
```

4. Add the ChatKit Host URL (find it on terminal default is `http://127.0.0.1:5200`) to the `CORS_ALLOW_ORIGINS` list in your XpertAI environment variables.
5. Open your browser and navigate to `http://127.0.0.1:5173` (default url).