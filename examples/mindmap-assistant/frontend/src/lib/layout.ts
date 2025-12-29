// Mindmap layout algorithm
import type { Mindmap } from './mindmap';
import type { Node, Edge } from '@xyflow/react';

// Layout constants
const HORIZONTAL_SPACING = 200;
const VERTICAL_SPACING = 80;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 40;

// Level colors for visual hierarchy
export const LEVEL_COLORS = [
  '#6366f1', // indigo - root
  '#8b5cf6', // violet - level 1
  '#a855f7', // purple - level 2
  '#d946ef', // fuchsia - level 3
  '#ec4899', // pink - level 4
  '#f43f5e', // rose - level 5+
];

export function getLevelColor(level: number): string {
  return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
}

// Calculate tree layout positions
export function calculateLayout(
  mindmap: Mindmap
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  if (!mindmap.rootId || !mindmap.nodes[mindmap.rootId]) {
    return positions;
  }

  // Calculate subtree heights for balanced layout
  const subtreeHeights: Record<string, number> = {};

  function calculateSubtreeHeight(nodeId: string): number {
    const node = mindmap.nodes[nodeId];
    if (!node) return 0;

    const visibleChildren = node.collapsed
      ? []
      : node.children.filter((id) => mindmap.nodes[id]);

    if (visibleChildren.length === 0) {
      subtreeHeights[nodeId] = 1;
      return 1;
    }

    const childHeights = visibleChildren.map(calculateSubtreeHeight);
    const totalHeight = childHeights.reduce((sum, h) => sum + h, 0);
    subtreeHeights[nodeId] = totalHeight;
    return totalHeight;
  }

  calculateSubtreeHeight(mindmap.rootId);

  // Position nodes using calculated heights
  function positionNode(
    nodeId: string,
    x: number,
    yStart: number,
    yEnd: number
  ) {
    const node = mindmap.nodes[nodeId];
    if (!node) return;

    // Center node in its allocated vertical space
    const yCenter = (yStart + yEnd) / 2;
    positions[nodeId] = { x, y: yCenter };

    const visibleChildren = node.collapsed
      ? []
      : node.children.filter((id) => mindmap.nodes[id]);

    if (visibleChildren.length === 0) return;

    // Distribute children in the vertical space
    const totalChildHeight = subtreeHeights[nodeId] || 1;
    let currentY = yStart;

    visibleChildren.forEach((childId) => {
      const childHeight = subtreeHeights[childId] || 1;
      const allocatedSpace = ((yEnd - yStart) * childHeight) / totalChildHeight;
      positionNode(
        childId,
        x + HORIZONTAL_SPACING,
        currentY,
        currentY + allocatedSpace
      );
      currentY += allocatedSpace;
    });
  }

  // Start layout from root
  const totalHeight =
    (subtreeHeights[mindmap.rootId] || 1) * VERTICAL_SPACING;
  positionNode(mindmap.rootId, 0, -totalHeight / 2, totalHeight / 2);

  return positions;
}

// Node data type for React Flow
export interface MindmapNodeData extends Record<string, unknown> {
  id: string;
  text: string;
  level: number;
  isRoot: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
  color: string;
}

// Build React Flow nodes and edges from mindmap
export function buildGraph(
  mindmap: Mindmap,
  selectedNodeIds: string[]
): { nodes: Node<MindmapNodeData>[]; edges: Edge[] } {
  const positions = calculateLayout(mindmap);
  const nodes: Node<MindmapNodeData>[] = [];
  const edges: Edge[] = [];

  // Collect visible node IDs
  const visibleNodeIds = new Set<string>();

  function collectVisible(nodeId: string): boolean {
    const node = mindmap.nodes[nodeId];
    if (!node) return false;

    visibleNodeIds.add(nodeId);

    if (!node.collapsed) {
      node.children.forEach((childId) => {
        if (mindmap.nodes[childId]) {
          collectVisible(childId);
        }
      });
    }
    return true;
  }

  if (mindmap.rootId) {
    collectVisible(mindmap.rootId);
  }

  // Build nodes
  visibleNodeIds.forEach((nodeId) => {
    const node = mindmap.nodes[nodeId];
    const position = positions[nodeId];

    if (!node || !position) return;

    nodes.push({
      id: nodeId,
      type: 'mindmapNode',
      position,
      data: {
        id: nodeId,
        text: node.text,
        level: node.level,
        isRoot: node.parentId === null,
        isSelected: selectedNodeIds.includes(nodeId),
        hasChildren: node.children.length > 0,
        isCollapsed: node.collapsed,
        color: getLevelColor(node.level),
      },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      selectable: true,
      draggable: true,
    });
  });

  // Build edges
  visibleNodeIds.forEach((nodeId) => {
    const node = mindmap.nodes[nodeId];
    if (!node || node.collapsed) return;

    node.children.forEach((childId) => {
      if (visibleNodeIds.has(childId)) {
        edges.push({
          id: `${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          type: 'smoothstep',
          style: {
            stroke: getLevelColor(node.level + 1),
            strokeWidth: 2,
          },
          animated: false,
        });
      }
    });
  });

  return { nodes, edges };
}
