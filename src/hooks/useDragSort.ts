import { useState, useCallback, useRef } from 'react';

export function useDragSort<T>(items: T[], setItems: (fn: (prev: T[]) => T[]) => void) {
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handlers = useCallback((idx: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragIdx.current = idx;
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overIdx !== idx) setOverIdx(idx);
    },
    onDragLeave: () => setOverIdx(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragIdx.current;
      if (from == null || from === idx) {
        setOverIdx(null);
        return;
      }
      setItems(prev => {
        const next = [...prev];
        const [removed] = next.splice(from, 1);
        next.splice(idx, 0, removed);
        return next;
      });
      dragIdx.current = null;
      setOverIdx(null);
    },
    onDragEnd: () => {
      dragIdx.current = null;
      setOverIdx(null);
    },
  }), [overIdx, setItems]);

  return { handlers, overIdx };
}
