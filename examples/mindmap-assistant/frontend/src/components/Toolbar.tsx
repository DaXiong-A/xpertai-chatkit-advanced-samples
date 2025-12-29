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

  const buttonClass = `
    p-2 rounded-lg transition-colors
    hover:bg-gray-200 dark:hover:bg-gray-700
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Left side: Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
          Mindmap Assistant
        </h1>
        <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
          AI-Powered
        </span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1">
        {/* Add child node */}
        <button
          onClick={handleAddChild}
          disabled={selectedNodeIds.length !== 1 || interactionLocked}
          className={buttonClass}
          title="Add child node (select a node first)"
        >
          <Plus size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* Delete selected */}
        <button
          onClick={handleDelete}
          disabled={selectedNodeIds.length === 0 || interactionLocked}
          className={buttonClass}
          title="Delete selected nodes"
        >
          <Trash2 size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

        {/* Fit view */}
        <button
          onClick={fitView}
          className={buttonClass}
          title="Fit view"
        >
          <ZoomIn size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* Reset */}
        <button
          onClick={resetMindmap}
          disabled={interactionLocked}
          className={buttonClass}
          title="Reset to sample mindmap"
        >
          <RotateCcw size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={buttonClass}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <Moon size={20} className="text-gray-600" />
          ) : (
            <Sun size={20} className="text-gray-300" />
          )}
        </button>
      </div>
    </div>
  );
}
