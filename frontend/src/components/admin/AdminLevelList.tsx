import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { levelsApi } from '@/services/levelsApi';
import type { Level } from '@/types';
import './AdminLevelList.css';

interface SortableItemProps {
  level: Level;
  index: number;
  onDelete: (id: string) => void;
}

function SortableItem({ level, index, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`admin-levels__item${isDragging ? ' admin-levels__item--dragging' : ''}`}
    >
      <span className="admin-levels__drag" {...attributes} {...listeners}>
        ⠿
      </span>
      {level.coverImage ? (
        <img className="admin-levels__cover" src={level.coverImage} alt="" />
      ) : (
        <div className="admin-levels__cover" style={{ background: 'var(--color-panel-muted)' }} />
      )}
      <div className="admin-levels__info">
        <div className="admin-levels__number">Nivel #{index + 1}</div>
        <div className="admin-levels__title">{level.gameTitle}</div>
      </div>
      <div className="admin-levels__actions">
        <button
          className="admin-levels__delete"
          onClick={() => onDelete(level.id)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

interface AdminLevelListProps {
  levels: Level[];
}

export function AdminLevelList({ levels }: AdminLevelListProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(levels);

  useEffect(() => {
    setItems(levels);
  }, [levels]);

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => levelsApi.reorder(orderedIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['levels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => levelsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['levels'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((l) => l.id === active.id);
    const newIndex = items.findIndex((l) => l.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    reorderMutation.mutate(newItems.map((l) => l.id));
  };

  if (items.length === 0) {
    return <p className="admin__message">No hay niveles creados</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="admin-levels">
          {items.map((level, index) => (
            <SortableItem
              key={level.id}
              level={level}
              index={index}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
