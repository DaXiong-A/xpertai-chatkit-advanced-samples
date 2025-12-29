import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useMindmapStore } from '../store/useMindmapStore';
import { useAppStore } from '../store/useAppStore';
import { buildGraph, type MindmapNodeData } from '../lib/layout';
import { MindmapNode } from './MindmapNode';

// Register custom node types - use any to avoid complex type issues with React Flow v12
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: any = {
  mindmapNode: MindmapNode,
};

export function MindmapCanvas() {
  const { theme } = useAppStore();
  const {
    mindmap,
    selectedNodeIds,
    setSelectedNodeIds,
    setReactFlow,
    interactionLocked,
  } = useMindmapStore();

  // Build graph from mindmap data
  const { nodes: graphNodes, edges: graphEdges } = useMemo(() => {
    return buildGraph(mindmap, selectedNodeIds);
  }, [mindmap, selectedNodeIds]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  // Sync nodes and edges when graph changes
  useEffect(() => {
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [graphNodes, graphEdges, setNodes, setEdges]);

  // Handle React Flow initialization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onInit = useCallback(
    (instance: any) => {
      setReactFlow(instance);
      // Fit view after a short delay
      setTimeout(() => {
        instance.fitView({ padding: 0.2, duration: 500 });
      }, 100);
    },
    [setReactFlow]
  );

  // Handle node click for selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      event.stopPropagation(); // Prevent event bubbling
      console.log('[MindmapCanvas] Node clicked:', node.id);
      if (!interactionLocked) {
        setSelectedNodeIds([node.id]);
      }
    },
    [setSelectedNodeIds, interactionLocked]
  );

  // Handle pane click to deselect (only when clicking empty area)
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Only deselect if clicking directly on the pane (not on a node)
      const target = event.target as HTMLElement;
      if (target.classList.contains('react-flow__pane')) {
        console.log('[MindmapCanvas] Pane clicked, deselecting');
        setSelectedNodeIds([]);
      }
    },
    [setSelectedNodeIds]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        // Interaction settings
        nodesDraggable={!interactionLocked}
        nodesConnectable={false}
        elementsSelectable={false}
        // Selection mode - disable default selection, we handle it manually
        selectionOnDrag={false}
        panOnDrag={[1, 2]}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={false}
        // Zoom settings
        minZoom={0.2}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        // Styling
        proOptions={{ hideAttribution: true }}
        className={theme === 'dark' ? 'dark' : ''}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={theme === 'dark' ? '#374151' : '#d1d5db'}
        />
        <Controls
          showInteractive={false}
          className={theme === 'dark' ? 'dark' : ''}
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as MindmapNodeData;
            return data?.color || '#6366f1';
          }}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
          className="!bg-gray-100 dark:!bg-gray-800"
        />
      </ReactFlow>
    </div>
  );
}
