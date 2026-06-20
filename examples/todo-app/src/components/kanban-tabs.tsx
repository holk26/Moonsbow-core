"use client";

import { useMemo, useState } from "react";
import { TodoCard } from "@/components/todo-card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  categoryId: string | null;
  category: { name: string; color: string } | null;
}

interface KanbanTabsProps {
  todos: Todo[];
  onTodoClick: (todo: Todo) => void;
  onTodoMenu?: (todo: Todo) => void;
}

const tabs = [
  { label: "Pendiente", shortLabel: "Pendiente", status: "pending" },
  { label: "En progreso", shortLabel: "Progreso", status: "in_progress" },
  { label: "Completada", shortLabel: "Hecha", status: "done" },
];

export function KanbanTabs({ todos, onTodoClick, onTodoMenu }: KanbanTabsProps) {
  const [activeStatus, setActiveStatus] = useState("pending");

  const counts = useMemo(() => {
    return tabs.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.status] = todos.filter((todo) => todo.status === tab.status).length;
      return acc;
    }, {});
  }, [todos]);

  const activeTodos = useMemo(
    () => todos.filter((todo) => todo.status === activeStatus),
    [todos, activeStatus]
  );

  const activeTab = tabs.find((tab) => tab.status === activeStatus) ?? tabs[0];

  return (
    <div className="flex min-w-0 flex-col">
      <div className="sticky top-0 z-10 min-w-0 border-b bg-background">
        <div
          className="flex min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Estados de tareas"
        >
          {tabs.map((tab) => {
            const isActive = activeStatus === tab.status;

            return (
              <button
                key={tab.status}
                id={`tab-${tab.status}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.status}`}
                onClick={() => setActiveStatus(tab.status)}
                className={cn(
                  "flex flex-shrink-0 items-center justify-center gap-1 whitespace-nowrap px-2 py-3 text-xs font-medium transition-colors md:gap-2 md:px-3 md:text-sm",
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
                <span
                  className={cn(
                    "flex-shrink-0 rounded-full px-2 py-0.5 text-xs",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {counts[tab.status]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex-1 p-4 pb-24 md:pb-4"
        role="tabpanel"
        id={`panel-${activeTab.status}`}
        aria-labelledby={`tab-${activeTab.status}`}
      >
        {activeTodos.length === 0 ? (
          <EmptyState
            title="Sin tareas"
            description={`No hay tareas ${activeTab.label.toLowerCase()}`}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {activeTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onClick={() => onTodoClick(todo)}
                onLongPress={() => onTodoMenu?.(todo)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
