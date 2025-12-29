import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useChatKit, ChatKit } from '@xpert-ai/chatkit-react';
import type { ChatKitOptions, ClientToolMessageInput } from '@xpert-ai/chatkit-types';
import { useMindmapStore } from '../store/useMindmapStore';
import { useAppStore } from '../store/useAppStore';
import { XPERT_API_URL, XPERT_ID, CHATKIT_FRAME_URL, API_BASE_URL } from '../lib/config';
import { convertMindmapFromSnake } from '../lib/mindmap';

export function ChatKitPanel() {
  const { theme, setThreadId, setChatkit } = useAppStore();
  const {
    mindmap,
    selectedNodeIds,
    setMindmap,
    lockInteraction,
    unlockInteraction,
    focusNode,
  } = useMindmapStore();

  // Use refs to always get the latest values in callbacks (avoid stale closure)
  const selectedNodeIdsRef = useRef(selectedNodeIds);
  const mindmapRef = useRef(mindmap);

  // Keep refs up to date
  useEffect(() => {
    selectedNodeIdsRef.current = selectedNodeIds;
  }, [selectedNodeIds]);

  useEffect(() => {
    mindmapRef.current = mindmap;
  }, [mindmap]);

  // Handle client tool calls from AI
  const handleClientTool = useCallback(
    async ({
      name,
      params,
      tool_call_id,
      id,
    }: {
      name: string;
      params: Record<string, unknown>;
      tool_call_id?: string;
      id?: string;
    }): Promise<ClientToolMessageInput> => {
      // Use refs to get latest values
      const currentSelectedNodeIds = selectedNodeIdsRef.current;
      const currentMindmap = mindmapRef.current;

      console.log('[MindmapAssistant] Client tool called:', name, params);
      console.log('[MindmapAssistant] Current selected nodes:', currentSelectedNodeIds);
      console.log('[MindmapAssistant] Current mindmap:', currentMindmap);

      // Get selected nodes
      if (name === 'get_selected_nodes') {
        const selectedNodes = currentSelectedNodeIds.map((nodeId) => {
          const node = currentMindmap.nodes[nodeId];
          return node
            ? { id: node.id, text: node.text, level: node.level, parentId: node.parentId }
            : null;
        }).filter(Boolean);

        const result = {
          nodeIds: currentSelectedNodeIds,
          nodes: selectedNodes,
          currentMindmap: currentMindmap,
        };

        console.log('[MindmapAssistant] Returning selected nodes:', result);

        return {
          tool_call_id: tool_call_id || id,
          name,
          status: 'success',
          content: JSON.stringify(result),
        };
      }

      // Default response for unknown tools
      return {
        tool_call_id: tool_call_id || id,
        name,
        status: 'success',
        content: 'OK',
      };
    },
    [] // No dependencies needed since we use refs
  );

  // Handle client effects from AI
  const handleClientEffect = useCallback(
    ({ name, data }: { name: string; data?: Record<string, unknown> }) => {
      console.log('[MindmapAssistant] Client effect:', name, data);

      // Update mindmap
      if (name === 'update_mindmap' && data?.mindmap) {
        try {
          // Convert from snake_case if needed
          const converted = convertMindmapFromSnake(data.mindmap as any);
          console.log('[MindmapAssistant] Converted mindmap:', converted);
          setMindmap(converted);
        } catch (error) {
          console.error('[MindmapAssistant] Failed to convert mindmap:', error);
        }
      }

      // Focus on a node
      if (name === 'focus_node' && data?.nodeId) {
        focusNode(data.nodeId as string);
      }

      // Highlight nodes (future feature)
      if (name === 'highlight_nodes' && data?.nodeIds) {
        console.log('Highlight nodes:', data.nodeIds);
      }
    },
    [setMindmap, focusNode]
  );

  // ChatKit options
  const chatkitOptions = useMemo<Partial<ChatKitOptions>>(
    () => ({
      theme: {
        colorScheme: theme,
        radius: 'round',
        density: 'normal',
      },
      header: {
        enabled: true,
        title: {
          enabled: true,
          text: 'AI Assistant',
        },
      },
      startScreen: {
        greeting: 'Hi! I can help you organize your thoughts into a mindmap.',
        prompts: [
          {
            icon: 'write',
            label: 'Add ideas to selected node',
            prompt: 'Add some ideas to the selected node',
          },
          {
            icon: 'lightbulb',
            label: 'Brainstorm on a topic',
            prompt: 'Help me brainstorm ideas about',
          },
          {
            icon: 'sparkle',
            label: 'Expand this mindmap',
            prompt: 'Expand this mindmap with more details',
          },
        ],
      },
      composer: {
        placeholder: 'Ask me to add, modify, or organize nodes...',
        attachments: { enabled: false },
      },
      history: {
        enabled: true,
        showDelete: true,
        showRename: true,
      },
    }),
    [theme]
  );

  // Initialize ChatKit
  const chatkit = useChatKit({
    ...chatkitOptions,
    frameUrl: CHATKIT_FRAME_URL || undefined,
    api: {
      apiUrl: XPERT_API_URL,
      xpertId: XPERT_ID,
      getClientSecret: async () => {
        const baseUrl = API_BASE_URL || '';
        const url = `${baseUrl}/api/create-session`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ xpertId: XPERT_ID }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.client_secret) {
          throw new Error('Missing client_secret in response');
        }

        return data.client_secret;
      },
    },
    onClientTool: handleClientTool,
    onEffect: handleClientEffect,
    onThreadChange: ({ threadId }) => {
      setThreadId(threadId);
    },
    onReady: () => {
      console.log('[MindmapAssistant] ChatKit ready');
      setChatkit(chatkit);
    },
    onResponseStart: () => {
      console.log('[MindmapAssistant] Response started');
      lockInteraction();
    },
    onResponseEnd: () => {
      console.log('[MindmapAssistant] Response ended');
      unlockInteraction();
    },
    onError: ({ error }) => {
      console.error('[MindmapAssistant] ChatKit error:', error);
      unlockInteraction();
    },
  });

  return (
    <div className="h-full flex flex-col">
      <ChatKit control={chatkit.control} className="flex-1" />
    </div>
  );
}
