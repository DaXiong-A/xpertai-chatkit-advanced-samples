"""Mindmap data models and storage."""

from __future__ import annotations
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
import uuid


class MindmapNode(BaseModel):
    """A node in the mindmap."""
    id: str
    text: str
    parent_id: Optional[str] = None
    children: list[str] = Field(default_factory=list)
    level: int = 0
    collapsed: bool = False


class Mindmap(BaseModel):
    """Complete mindmap data structure."""
    id: str
    title: str
    root_id: str
    nodes: dict[str, MindmapNode]
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


def generate_node_id() -> str:
    """Generate a unique node ID."""
    return f"node_{uuid.uuid4().hex[:8]}"


def create_sample_mindmap() -> Mindmap:
    """Create a sample mindmap for demo purposes."""
    root_id = "root"
    nodes: dict[str, MindmapNode] = {}

    # Root node
    nodes[root_id] = MindmapNode(
        id=root_id,
        text="Project Planning",
        parent_id=None,
        children=["goals", "timeline", "resources"],
        level=0,
    )

    # Level 1 nodes
    nodes["goals"] = MindmapNode(
        id="goals",
        text="Goals",
        parent_id=root_id,
        children=["goal1", "goal2"],
        level=1,
    )

    nodes["timeline"] = MindmapNode(
        id="timeline",
        text="Timeline",
        parent_id=root_id,
        children=["phase1", "phase2"],
        level=1,
    )

    nodes["resources"] = MindmapNode(
        id="resources",
        text="Resources",
        parent_id=root_id,
        children=["team", "budget"],
        level=1,
    )

    # Level 2 nodes
    nodes["goal1"] = MindmapNode(
        id="goal1",
        text="Increase Revenue",
        parent_id="goals",
        children=[],
        level=2,
    )

    nodes["goal2"] = MindmapNode(
        id="goal2",
        text="Improve UX",
        parent_id="goals",
        children=[],
        level=2,
    )

    nodes["phase1"] = MindmapNode(
        id="phase1",
        text="Q1 2025",
        parent_id="timeline",
        children=[],
        level=2,
    )

    nodes["phase2"] = MindmapNode(
        id="phase2",
        text="Q2 2025",
        parent_id="timeline",
        children=[],
        level=2,
    )

    nodes["team"] = MindmapNode(
        id="team",
        text="Team Members",
        parent_id="resources",
        children=[],
        level=2,
    )

    nodes["budget"] = MindmapNode(
        id="budget",
        text="Budget Allocation",
        parent_id="resources",
        children=[],
        level=2,
    )

    return Mindmap(
        id="sample-mindmap",
        title="Project Planning",
        root_id=root_id,
        nodes=nodes,
    )


class MindmapStore:
    """In-memory store for mindmap data."""

    def __init__(self) -> None:
        self._mindmaps: dict[str, Mindmap] = {}
        # Create a default sample mindmap
        sample = create_sample_mindmap()
        self._mindmaps[sample.id] = sample

    def get_mindmap(self, mindmap_id: str) -> Mindmap | None:
        """Get a mindmap by ID."""
        return self._mindmaps.get(mindmap_id)

    def get_or_create_mindmap(self, mindmap_id: str) -> Mindmap:
        """Get or create a mindmap."""
        if mindmap_id not in self._mindmaps:
            self._mindmaps[mindmap_id] = create_sample_mindmap()
            self._mindmaps[mindmap_id].id = mindmap_id
        return self._mindmaps[mindmap_id]

    def save_mindmap(self, mindmap: Mindmap) -> None:
        """Save a mindmap."""
        mindmap.updated_at = datetime.now().isoformat()
        self._mindmaps[mindmap.id] = mindmap

    def add_node(
        self,
        mindmap_id: str,
        parent_id: str,
        text: str,
    ) -> tuple[Mindmap, MindmapNode]:
        """Add a new node to the mindmap."""
        mindmap = self.get_or_create_mindmap(mindmap_id)

        if parent_id not in mindmap.nodes:
            raise ValueError(f"Parent node {parent_id} not found")

        parent = mindmap.nodes[parent_id]
        new_id = generate_node_id()

        new_node = MindmapNode(
            id=new_id,
            text=text,
            parent_id=parent_id,
            children=[],
            level=parent.level + 1,
        )

        # Add to parent's children
        parent.children.append(new_id)
        mindmap.nodes[new_id] = new_node
        self.save_mindmap(mindmap)

        return mindmap, new_node

    def add_branch(
        self,
        mindmap_id: str,
        parent_id: str,
        texts: list[str],
    ) -> tuple[Mindmap, list[MindmapNode]]:
        """Add multiple nodes as children of a parent."""
        mindmap = self.get_or_create_mindmap(mindmap_id)

        if parent_id not in mindmap.nodes:
            raise ValueError(f"Parent node {parent_id} not found")

        parent = mindmap.nodes[parent_id]
        new_nodes: list[MindmapNode] = []

        for text in texts:
            new_id = generate_node_id()
            new_node = MindmapNode(
                id=new_id,
                text=text,
                parent_id=parent_id,
                children=[],
                level=parent.level + 1,
            )
            parent.children.append(new_id)
            mindmap.nodes[new_id] = new_node
            new_nodes.append(new_node)

        self.save_mindmap(mindmap)
        return mindmap, new_nodes

    def delete_node(self, mindmap_id: str, node_id: str) -> Mindmap:
        """Delete a node and all its descendants."""
        mindmap = self.get_or_create_mindmap(mindmap_id)

        if node_id not in mindmap.nodes:
            raise ValueError(f"Node {node_id} not found")

        node = mindmap.nodes[node_id]
        if node.parent_id is None:
            raise ValueError("Cannot delete root node")

        # Collect all descendant IDs
        to_delete: set[str] = set()

        def collect_descendants(nid: str) -> None:
            to_delete.add(nid)
            n = mindmap.nodes.get(nid)
            if n:
                for child_id in n.children:
                    collect_descendants(child_id)

        collect_descendants(node_id)

        # Remove from parent's children
        parent = mindmap.nodes.get(node.parent_id)
        if parent:
            parent.children = [c for c in parent.children if c != node_id]

        # Delete all collected nodes
        for nid in to_delete:
            del mindmap.nodes[nid]

        self.save_mindmap(mindmap)
        return mindmap

    def update_node_text(
        self,
        mindmap_id: str,
        node_id: str,
        text: str,
    ) -> Mindmap:
        """Update a node's text."""
        mindmap = self.get_or_create_mindmap(mindmap_id)

        if node_id not in mindmap.nodes:
            raise ValueError(f"Node {node_id} not found")

        mindmap.nodes[node_id].text = text
        self.save_mindmap(mindmap)
        return mindmap
