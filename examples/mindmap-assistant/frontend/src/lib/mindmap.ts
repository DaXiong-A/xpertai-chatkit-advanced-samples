// Mindmap data types

// Snake case version (from backend/AI)
export interface MindmapNodeSnake {
  id: string;
  text: string;
  parent_id: string | null;
  children: string[];
  level: number;
  collapsed: boolean;
}

export interface MindmapSnake {
  id: string;
  title: string;
  root_id: string;
  nodes: Record<string, MindmapNodeSnake>;
  created_at?: string;
  updated_at?: string;
}

// Convert snake_case mindmap to camelCase
export function convertMindmapFromSnake(data: MindmapSnake | Mindmap): Mindmap {
  // Check if already camelCase
  if ('rootId' in data && typeof data.rootId === 'string') {
    return data as Mindmap;
  }

  const snakeData = data as MindmapSnake;
  const nodes: Record<string, MindmapNode> = {};

  for (const [key, node] of Object.entries(snakeData.nodes)) {
    nodes[key] = {
      id: node.id,
      text: node.text,
      parentId: node.parent_id,
      children: node.children || [],
      level: node.level,
      collapsed: node.collapsed || false,
    };
  }

  return {
    id: snakeData.id,
    title: snakeData.title,
    rootId: snakeData.root_id,
    nodes,
    createdAt: snakeData.created_at || new Date().toISOString(),
    updatedAt: snakeData.updated_at || new Date().toISOString(),
  };
}

// Camel case version (frontend)
export interface MindmapNode {
  id: string;
  text: string;
  parentId: string | null;
  children: string[];
  level: number;
  collapsed: boolean;
  style?: {
    color?: string;
    fontSize?: number;
  };
}

export interface Mindmap {
  id: string;
  title: string;
  rootId: string;
  nodes: Record<string, MindmapNode>;
  createdAt: string;
  updatedAt: string;
}

// Generate unique ID
export function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Create a new node
export function createNode(
  text: string,
  parentId: string | null,
  level: number
): MindmapNode {
  return {
    id: generateId(),
    text,
    parentId,
    children: [],
    level,
    collapsed: false,
  };
}

// Create initial sample mindmap
export function createSampleMindmap(): Mindmap {
  const rootId = 'root';
  const nodes: Record<string, MindmapNode> = {};

  // Root node
  nodes[rootId] = {
    id: rootId,
    text: 'Project Planning',
    parentId: null,
    children: ['goals', 'timeline', 'resources'],
    level: 0,
    collapsed: false,
  };

  // Level 1 nodes
  nodes['goals'] = {
    id: 'goals',
    text: 'Goals',
    parentId: rootId,
    children: ['goal1', 'goal2'],
    level: 1,
    collapsed: false,
  };

  nodes['timeline'] = {
    id: 'timeline',
    text: 'Timeline',
    parentId: rootId,
    children: ['phase1', 'phase2'],
    level: 1,
    collapsed: false,
  };

  nodes['resources'] = {
    id: 'resources',
    text: 'Resources',
    parentId: rootId,
    children: ['team', 'budget'],
    level: 1,
    collapsed: false,
  };

  // Level 2 nodes
  nodes['goal1'] = {
    id: 'goal1',
    text: 'Increase Revenue',
    parentId: 'goals',
    children: [],
    level: 2,
    collapsed: false,
  };

  nodes['goal2'] = {
    id: 'goal2',
    text: 'Improve UX',
    parentId: 'goals',
    children: [],
    level: 2,
    collapsed: false,
  };

  nodes['phase1'] = {
    id: 'phase1',
    text: 'Q1 2025',
    parentId: 'timeline',
    children: [],
    level: 2,
    collapsed: false,
  };

  nodes['phase2'] = {
    id: 'phase2',
    text: 'Q2 2025',
    parentId: 'timeline',
    children: [],
    level: 2,
    collapsed: false,
  };

  nodes['team'] = {
    id: 'team',
    text: 'Team Members',
    parentId: 'resources',
    children: [],
    level: 2,
    collapsed: false,
  };

  nodes['budget'] = {
    id: 'budget',
    text: 'Budget Allocation',
    parentId: 'resources',
    children: [],
    level: 2,
    collapsed: false,
  };

  return {
    id: 'sample-mindmap',
    title: 'Project Planning',
    rootId,
    nodes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Add a node to the mindmap
export function addNodeToMindmap(
  mindmap: Mindmap,
  parentId: string,
  text: string
): { mindmap: Mindmap; newNodeId: string } {
  const parent = mindmap.nodes[parentId];
  if (!parent) {
    throw new Error(`Parent node ${parentId} not found`);
  }

  const newNode = createNode(text, parentId, parent.level + 1);

  return {
    mindmap: {
      ...mindmap,
      nodes: {
        ...mindmap.nodes,
        [newNode.id]: newNode,
        [parentId]: {
          ...parent,
          children: [...parent.children, newNode.id],
        },
      },
      updatedAt: new Date().toISOString(),
    },
    newNodeId: newNode.id,
  };
}

// Delete a node and its children
export function deleteNodeFromMindmap(
  mindmap: Mindmap,
  nodeId: string
): Mindmap {
  const node = mindmap.nodes[nodeId];
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  if (node.parentId === null) {
    throw new Error('Cannot delete root node');
  }

  // Collect all descendant IDs
  const toDelete = new Set<string>();
  const collectDescendants = (id: string) => {
    toDelete.add(id);
    const n = mindmap.nodes[id];
    if (n) {
      n.children.forEach(collectDescendants);
    }
  };
  collectDescendants(nodeId);

  // Remove from parent's children
  const parent = mindmap.nodes[node.parentId];
  const newNodes = { ...mindmap.nodes };

  if (parent) {
    newNodes[parent.id] = {
      ...parent,
      children: parent.children.filter((id) => id !== nodeId),
    };
  }

  // Delete all collected nodes
  toDelete.forEach((id) => {
    delete newNodes[id];
  });

  return {
    ...mindmap,
    nodes: newNodes,
    updatedAt: new Date().toISOString(),
  };
}

// Update node text
export function updateNodeText(
  mindmap: Mindmap,
  nodeId: string,
  text: string
): Mindmap {
  const node = mindmap.nodes[nodeId];
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  return {
    ...mindmap,
    nodes: {
      ...mindmap.nodes,
      [nodeId]: {
        ...node,
        text,
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

// Toggle node collapse state
export function toggleNodeCollapse(
  mindmap: Mindmap,
  nodeId: string
): Mindmap {
  const node = mindmap.nodes[nodeId];
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  return {
    ...mindmap,
    nodes: {
      ...mindmap.nodes,
      [nodeId]: {
        ...node,
        collapsed: !node.collapsed,
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

// Get all visible nodes (respecting collapsed state)
export function getVisibleNodes(mindmap: Mindmap): MindmapNode[] {
  const visible: MindmapNode[] = [];
  const hiddenParents = new Set<string>();

  // First pass: find all collapsed nodes
  Object.values(mindmap.nodes).forEach((node) => {
    if (node.collapsed) {
      hiddenParents.add(node.id);
    }
  });

  // Second pass: collect visible nodes
  const isVisible = (nodeId: string): boolean => {
    const node = mindmap.nodes[nodeId];
    if (!node) return false;
    if (node.parentId === null) return true;
    if (hiddenParents.has(node.parentId)) return false;
    return isVisible(node.parentId);
  };

  Object.values(mindmap.nodes).forEach((node) => {
    if (isVisible(node.id)) {
      visible.push(node);
    }
  });

  return visible;
}
