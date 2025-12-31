import { Sun, Moon, RotateCcw, ZoomIn, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useMindmapStore } from '../store/useMindmapStore';

export function Toolbar() {
  const { theme, toggleTheme } = useAppStore();
  const {
    selectedNodeIds,
    addNode,
    deleteNode,
    fitView,
    resetMindmap,
    interactionLocked,
  } = useMindmapStore();

  const handleAddChild = () => {
    if (selectedNodeIds.length === 1) {
      addNode(selectedNodeIds[0], 'New Idea');
    }
  };

  const handleDelete = () => {
    if (selectedNodeIds.length > 0) {
      selectedNodeIds.forEach((id) => {
        deleteNode(id);
      });
    }
  };

  return (
    <div className="toolbar flex items-center justify-between px-4 py-2.5">
      {/* Left side: Title */}
      <div className="flex items-center gap-2">
        <h1 className="app-title">Mindmap Assistant</h1>
        <span className="ai-badge">AI</span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1">
        {/* Add child node */}
        <button
          onClick={handleAddChild}
          disabled={selectedNodeIds.length !== 1 || interactionLocked}
          className="toolbar-btn"
          title="Add child node (select a node first)"
        >
          <Plus size={20} className="text-gray-500 dark:text-gray-400" />
        </button>

        {/* Delete selected */}
        <button
          onClick={handleDelete}
          disabled={selectedNodeIds.length === 0 || interactionLocked}
          className="toolbar-btn"
          title="Delete selected nodes"
        >
          <Trash2 size={20} className="text-gray-500 dark:text-gray-400" />
        </button>

        <div className="toolbar-divider" />

        {/* Fit view */}
        <button
          onClick={fitView}
          className="toolbar-btn"
          title="Fit view"
        >
          <ZoomIn size={20} className="text-gray-500 dark:text-gray-400" />
        </button>

        {/* Reset */}
        <button
          onClick={resetMindmap}
          disabled={interactionLocked}
          className="toolbar-btn"
          title="Reset to sample mindmap"
        >
          <RotateCcw size={20} className="text-gray-500 dark:text-gray-400" />
        </button>

        <div className="toolbar-divider" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="toolbar-btn"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <Moon size={20} className="text-gray-500" />
          ) : (
            <Sun size={20} className="text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}
