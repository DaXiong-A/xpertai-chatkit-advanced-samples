<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { ChatKit, useChatKit } from '@xpert-ai/chatkit-vue'
import { type ChatKitOptions, type ClientToolMessageInput, filterPlaygroundOptions, type SupportedLocale } from '@xpert-ai/chatkit-types'

// ============================================================================
// Playground config - copied from https://chatkit.studio/playground
// Only whitelisted options take effect: theme, composer, startScreen, api
// Other options (e.g., threadItemActions.feedback) are automatically filtered out
// ============================================================================
const playgroundConfig: Partial<ChatKitOptions> = {
  locale: 'zh' as SupportedLocale,
  theme: {},
  composer: {
    attachments: {
      enabled: true,
      maxCount: 5,
      maxSize: 10485760
    },
    tools: [
      {
        id: 'search_docs',
        label: 'Search docs',
        shortLabel: 'Docs',
        placeholderOverride: 'Search documentation',
        icon: 'book-open',
        pinned: false
      }
    ]
  },
  startScreen: {
    greeting: '',
    prompts: [
      {
        icon: 'circle-question',
        label: 'What is ChatKit?',
        prompt: 'What is ChatKit?'
      }
    ]
  }
}

// Filter playground config (keep only whitelisted items)
const filteredPlaygroundConfig = filterPlaygroundOptions(playgroundConfig)

const xpertApiUrl = (import.meta.env.VITE_XPERTAI_API_URL as string | undefined) ?? ''
const backendOrigin = (import.meta.env.VITE_CHATKIT_BACKEND as string | undefined) ?? ''
const assistantId = (import.meta.env.VITE_CHATKIT_XPERT_ID as string | undefined) ?? ''
const frameUrl = (import.meta.env.VITE_CHATKIT_TARGET as string | undefined) ?? ''

const chatkitOptions: Partial<ChatKitOptions> = {
  ...filteredPlaygroundConfig,
  frameUrl
}

const chatkit = useChatKit({
  ...chatkitOptions,
  api: {
    apiUrl: xpertApiUrl,
    xpertId: assistantId,
    getClientSecret: async () => {
      const createSessionUrl = backendOrigin
        ? `${backendOrigin.replace(/\/$/, '')}/api/create-session`
        : '/api/create-session'

      const response = await fetch(createSessionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(assistantId ? { assistantId } : {})
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (!data.client_secret) {
        throw new Error('Missing client_secret in response')
      }

      return data.client_secret
    }
  },
  onClientTool: async ({ name, params, id, tool_call_id }): Promise<ClientToolMessageInput> => {
    console.log(`Client tool invoked: ${name}`, params, id, tool_call_id)
    return {
      tool_call_id: tool_call_id || id,
      name: name,
      status: 'success',
      content: `You invoked the "${name}" tool with parameters: ${JSON.stringify(params)}`
    }
  },
  onError: (error) => {
    console.error('Failed to create session:', error)
  },
  onEffect: ({ name, data }) => {
    console.log(`Effect triggered: ${name}`, data)
  }
})
</script>

<template>
  <div class="app-shell">
    <div class="left-panel">
      <HelloWorld msg="Vite + Vue" />
    </div>
    <ChatKit :control="chatkit.control" class="chat-panel" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
}

.left-panel {
  flex: 1;
  padding: 16px;
  border-right: 1px solid #e5e7eb;
  overflow: auto;
}

.chat-panel {
  flex: 0 0 500px;
  min-width: 360px;
}
@media (max-width: 1024px) {
  .app-shell {
    flex-direction: column;
  }

  .left-panel {
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .chat-panel {
    flex: 1 1 auto;
    min-width: 0;
  }
}
</style>
