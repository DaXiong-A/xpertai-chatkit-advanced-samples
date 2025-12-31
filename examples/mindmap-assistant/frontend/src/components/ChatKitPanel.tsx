import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useChatKit, ChatKit } from '@xpert-ai/chatkit-react';
import type { ChatKitOptions, ClientToolMessageInput, SupportedLocale } from '@xpert-ai/chatkit-types';
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
      // Use the correct tool call id - prefer id over tool_call_id
      const callId = id || tool_call_id;

      // Use refs to get latest values
      const currentSelectedNodeIds = selectedNodeIdsRef.current;
      const currentMindmap = mindmapRef.current;

      console.log('[MindmapAssistant] Client tool called:', name);
      console.log('[MindmapAssistant] Tool call id:', callId, '(id:', id, ', tool_call_id:', tool_call_id, ')');
      console.log('[MindmapAssistant] Current selected nodes:', currentSelectedNodeIds);

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
          tool_call_id: callId,
          name,
          status: 'success',
          content: JSON.stringify(result),
        };
      }

      // Default response for unknown tools
      return {
        tool_call_id: callId,
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

  // ChatKit options - Minimal theme to blend with app
  const chatkitOptions = useMemo<Partial<ChatKitOptions>>(
    () => ({
      locale: 'en' as SupportedLocale,
      theme: {
        colorScheme: theme,
        radius: 'soft',
        density: 'normal',
        color: {
          accent: {
            primary: '#8b5cf6',
            level: 1,
          },
        },
      },
      header: {
        enabled: true,
        title: {
          enabled: true,
          text: 'Mindmap Assistant',
        },
      },
      startScreen: {
        greeting: 'Hi! I can help you organize your thoughts into a mindmap.',
        prompts: [
          {
            icon: 'sparkle',
            label: 'Expand selected node',
            prompt: 'Please expand the selected node with 3-5 related sub-nodes',
          },
          {
            icon: 'lightbulb',
            label: 'Brainstorm',
            prompt: 'Help me brainstorm ideas around the current topic',
          },
          {
            icon: 'write',
            label: 'Organize structure',
            prompt: 'Please analyze and optimize the structure of this mindmap',
          },
          {
            icon: 'circle-question',
            label: 'Deep analysis',
            prompt: 'Please analyze the mindmap content and provide suggestions',
          },
        ],
      },
      composer: {
        placeholder: 'Describe what you want to add or modify...',
        attachments: { enabled: false },
      },
      history: {
        enabled: true,
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
      console.log('[MindmapAssistant] chatkit.control.options:', chatkit.control.options);
      console.log('[MindmapAssistant] onClientTool exists:', !!chatkit.control.options.onClientTool);
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
    <div className="h-full flex flex-col relative z-10">
      <ChatKit control={chatkit.control} className="flex-1" />
    </div>
  );
}
