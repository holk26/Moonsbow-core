"use client";

import { TodoCard } from "@/components/todo-card";
import { EmptyState } from "@/components/empty-state";

interface KanbanColumnProps {
  title: string;
  status: string;
  todos: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    dueDate: Date | null;
    category: { name: string; color: string } | null;
  }[];
  onTodoClick: (todo: KanbanColumnProps["todos"][0]) => void;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  done: "Completada",
};

const statusColors: Record<string, string> = {
  pending: "border-t-yellow-400",
  in_progress: "border-t-blue-400",
  done: "border-t-green-400",
};

export function KanbanColumn({ title, status, todos, onTodoClick }: KanbanColumnProps) {
  return (
    <div className={`flex flex-col rounded-lg border border-t-4 bg-muted/30 ${statusColors[status]}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
          {todos.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {todos.length === 0 ? (
          <EmptyState title="Sin tareas" description={`No hay tareas ${statusLabels[status].toLowerCase()}`} />
        ) : (
          todos.map((todo) => (
            <TodoCard key={todo.id} todo={todo} onClick={() => onTodoClick(todo)} />
          ))
        )}
      </div>
    </div>
  );
}
