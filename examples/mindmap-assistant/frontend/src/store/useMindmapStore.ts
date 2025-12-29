import { create } from 'zustand';
import type { ReactFlowInstance } from '@xyflow/react';
import type { Mindmap } from '../lib/mindmap';
import {
  createSampleMindmap,
  addNodeToMindmap,
  deleteNodeFromMindmap,
  updateNodeText as updateNodeTextFn,
  toggleNodeCollapse as toggleNodeCollapseFn,
} from '../lib/mindmap';

interface MindmapState {
  // Mindmap data
  mindmap: Mindmap;
  setMindmap: (mindmap: Mindmap) => void;

  // React Flow instance
  reactFlow: ReactFlowInstance | null;
  setReactFlow: (instance: ReactFlowInstance | null) => void;

  // Selection state
  selectedNodeIds: string[];
  setSelectedNodeIds: (ids: string[]) => void;

  // Interaction lock (during AI response)
  interactionLocked: boolean;
  lockInteraction: () => void;
  unlockInteraction: () => void;

  // Node operations
  addNode: (parentId: string, text: string) => string;
  deleteNode: (nodeId: string) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  toggleCollapse: (nodeId: string) => void;

  // Batch operations
  addBranch: (parentId: string, texts: string[]) => string[];

  // Layout
  fitView: () => void;
  focusNode: (nodeId: string) => void;

  // Reset
  resetMindmap: () => void;
}

export const useMindmapStore = create<MindmapState>((set, get) => ({
  // Initial state with sample mindmap
  mindmap: createSampleMindmap(),
  setMindmap: (mindmap) => set({ mindmap }),

  // React Flow
  reactFlow: null,
  setReactFlow: (reactFlow) => set({ reactFlow }),

  // Selection
  selectedNodeIds: [],
  setSelectedNodeIds: (selectedNodeIds) => set({ selectedNodeIds }),

  // Interaction lock
  interactionLocked: false,
  lockInteraction: () => set({ interactionLocked: true }),
  unlockInteraction: () => set({ interactionLocked: false }),

  // Add single node
  addNode: (parentId, text) => {
    const { mindmap } = get();
    const { mindmap: newMindmap, newNodeId } = addNodeToMindmap(
      mindmap,
      parentId,
      text
    );
    set({ mindmap: newMindmap });
    return newNodeId;
  },

  // Delete node
  deleteNode: (nodeId) => {
    const { mindmap, selectedNodeIds } = get();
    try {
      const newMindmap = deleteNodeFromMindmap(mindmap, nodeId);
      set({
        mindmap: newMindmap,
        selectedNodeIds: selectedNodeIds.filter((id) => id !== nodeId),
      });
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  },

  // Update node text
  updateNodeText: (nodeId, text) => {
    const { mindmap } = get();
    try {
      const newMindmap = updateNodeTextFn(mindmap, nodeId, text);
      set({ mindmap: newMindmap });
    } catch (error) {
      console.error('Failed to update node text:', error);
    }
  },

  // Toggle collapse
  toggleCollapse: (nodeId) => {
    const { mindmap } = get();
    try {
      const newMindmap = toggleNodeCollapseFn(mindmap, nodeId);
      set({ mindmap: newMindmap });
    } catch (error) {
      console.error('Failed to toggle collapse:', error);
    }
  },

  // Add multiple children
  addBranch: (parentId, texts) => {
    const newIds: string[] = [];
    let currentMindmap = get().mindmap;

    texts.forEach((text) => {
      const { mindmap: newMindmap, newNodeId } = addNodeToMindmap(
        currentMindmap,
        parentId,
        text
      );
      currentMindmap = newMindmap;
      newIds.push(newNodeId);
    });

    set({ mindmap: currentMindmap });
    return newIds;
  },

  // Fit view
  fitView: () => {
    const { reactFlow } = get();
    if (reactFlow) {
      reactFlow.fitView({ padding: 0.2, duration: 300 });
    }
  },

  // Focus on a specific node
  focusNode: (nodeId) => {
    const { reactFlow, mindmap } = get();
    if (!reactFlow || !mindmap.nodes[nodeId]) return;

    const node = mindmap.nodes[nodeId];
    if (node) {
      reactFlow.setCenter(0, 0, { duration: 300 });
      setTimeout(() => {
        reactFlow.fitView({
          padding: 0.5,
          duration: 300,
          nodes: [{ id: nodeId }],
        });
      }, 100);
    }
  },

  // Reset to sample
  resetMindmap: () => {
    set({
      mindmap: createSampleMindmap(),
      selectedNodeIds: [],
    });
  },
}));
