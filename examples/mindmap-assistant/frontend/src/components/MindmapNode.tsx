import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { MindmapNodeData } from '../lib/layout';
import { useMindmapStore } from '../store/useMindmapStore';

interface MindmapNodeProps {
  data: MindmapNodeData;
  selected?: boolean;
}

export const MindmapNode = memo(function MindmapNode({
  data,
  selected: rfSelected,
}: MindmapNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateNodeText, toggleCollapse, interactionLocked } =
    useMindmapStore();

  // Use isSelected from data (our manual selection) or React Flow's selected prop
  const selected = data.isSelected || rfSelected;

  // Debug: log when selection changes
  useEffect(() => {
    if (selected) {
      console.log('[MindmapNode] Node selected:', data.id, data.text);
    }
  }, [selected, data.id, data.text]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle double click to edit
  const handleDoubleClick = useCallback(() => {
    if (!interactionLocked) {
      setEditText(data.text);
      setIsEditing(true);
    }
  }, [data.text, interactionLocked]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editText.trim() && editText !== data.text) {
      updateNodeText(data.id, editText.trim());
    }
  }, [editText, data.text, data.id, updateNodeText]);

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleBlur();
      } else if (e.key === 'Escape') {
        setEditText(data.text);
        setIsEditing(false);
      }
    },
    [handleBlur, data.text]
  );

  // Handle collapse toggle
  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!interactionLocked) {
        toggleCollapse(data.id);
      }
    },
    [data.id, toggleCollapse, interactionLocked]
  );

  const nodeStyle = {
    backgroundColor: selected ? '#2563eb' : data.color, // Blue when selected
    borderColor: selected ? '#fff' : 'transparent',
    transform: selected ? 'scale(1.05)' : 'scale(1)',
    boxShadow: selected ? '0 0 20px rgba(37, 99, 235, 0.6)' : 'none',
  };

  return (
    <div
      className={`
        relative px-4 py-2 rounded-lg text-white font-medium
        min-w-[100px] max-w-[200px] text-center
        transition-all duration-200 cursor-pointer
        ${selected ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : ''}
        ${data.isRoot ? 'text-lg font-bold' : 'text-sm'}
        ${interactionLocked ? 'opacity-75 cursor-not-allowed' : 'hover:brightness-110'}
      `}
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}
    >
      {/* Source handle (right side) */}
      {!data.isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-white/50 !w-2 !h-2 !border-0"
        />
      )}

      {/* Content */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-white text-center outline-none border-b border-white/50"
        />
      ) : (
        <span className="truncate block">{data.text}</span>
      )}

      {/* Collapse button */}
      {data.hasChildren && (
        <button
          onClick={handleToggleCollapse}
          className={`
            absolute -right-3 top-1/2 -translate-y-1/2
            w-6 h-6 rounded-full bg-white shadow-md
            flex items-center justify-center
            text-gray-600 hover:text-gray-800
            transition-colors
          `}
        >
          {data.isCollapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      )}

      {/* Target handle (left side) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-white/50 !w-2 !h-2 !border-0"
      />
    </div>
  );
});
