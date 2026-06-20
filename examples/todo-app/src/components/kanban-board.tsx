"use client";

import { useState, useEffect, useCallback } from "react";
import { KanbanColumn } from "@/components/kanban-column";
import { TodoModal } from "@/components/todo-modal";
import { TodoFilters } from "@/components/todo-filters";
import { KanbanTabs } from "@/components/kanban-tabs";
import { MobileFAB } from "@/components/mobile-fab";
import { TodoActionSheet } from "@/components/todo-action-sheet";
import { StatsBar } from "@/components/stats-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TodoFormData } from "@/lib/todo-types";
import {
  getTodos,
  getCategories,
  getStats,
  deleteTodo,
  updateTodo,
} from "@/actions/todo-actions";

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

function toTodo(raw: unknown): Todo {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid todo data");
  }
  const t = raw as Record<string, unknown>;
  const category =
    t.category && typeof t.category === "object"
      ? (t.category as Record<string, unknown>)
      : null;
  return {
    id: String(t.id),
    title: String(t.title),
    description: t.description == null ? null : String(t.description),
    status: String(t.status),
    priority: String(t.priority),
    dueDate: t.dueDate instanceof Date ? t.dueDate : null,
    categoryId: t.categoryId == null ? null : String(t.categoryId),
    category: category
      ? { name: String(category.name), color: String(category.color) }
      : null,
  };
}

const statuses: TodoFormData["status"][] = [
  "pending",
  "in_progress",
  "done",
  "archived",
];
const priorities: TodoFormData["priority"][] = [
  "low",
  "medium",
  "high",
  "urgent",
];

function isStatus(s: string): s is TodoFormData["status"] {
  return statuses.some((status) => status === s);
}

function isPriority(p: string): p is TodoFormData["priority"] {
  return priorities.some((priority) => priority === p);
}

function toTodoFormData(todo: Todo): TodoFormData {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    status: isStatus(todo.status) ? todo.status : "pending",
    priority: isPriority(todo.priority) ? todo.priority : "medium",
    dueDate: todo.dueDate,
    categoryId: todo.categoryId,
  };
}

export function KanbanBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ status: "all", priority: "all", search: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>();
  const [actionTodo, setActionTodo] = useState<Todo | undefined>();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, done: 0, urgent: 0 });

  const loadData = useCallback(
    async (ignoreRef: { current: boolean } = { current: false }) => {
      setLoading(true);
      try {
        const [todoData, categoryData, statsData] = await Promise.all([
          getTodos(filters),
          getCategories(),
          getStats(),
        ]);
        if (ignoreRef.current) return;
        setTodos(Array.isArray(todoData) ? todoData.map(toTodo) : []);
        setCategories(categoryData);
        setStats(statsData);
      } finally {
        if (!ignoreRef.current) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  useEffect(() => {
    const ignore = { current: false };
    loadData(ignore);
    return () => {
      ignore.current = true;
    };
  }, [loadData]);

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setModalOpen(true);
  };

  const handleNewTodo = () => {
    setSelectedTodo(undefined);
    setModalOpen(true);
  };

  const handleDelete = async (todo: Todo) => {
    await deleteTodo(todo.id);
    await loadData();
  };

  const handleMove = async (todo: Todo) => {
    const nextStatus = (current: string) => {
      if (current === "pending") return "in_progress";
      if (current === "in_progress") return "done";
      return "pending";
    };
    await updateTodo(todo.id, { status: nextStatus(todo.status) });
    await loadData();
  };

  const columns = [
    { title: "Pendiente", status: "pending" },
    { title: "En progreso", status: "in_progress" },
    { title: "Completada", status: "done" },
  ];

  if (loading) {
    return (
      <div
        className="flex h-64 items-center justify-center"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Cargando tareas…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatsBar stats={stats} />
      <div className="flex items-center justify-between">
        <TodoFilters filters={filters} onChange={setFilters} />
        <Button onClick={handleNewTodo} className="hidden md:flex">
          <Plus className="mr-2 h-4 w-4" />
          Nueva tarea
        </Button>
      </div>
      <div className="hidden grid-cols-3 gap-4 md:grid">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            status={col.status}
            todos={todos.filter((t) => t.status === col.status)}
            onTodoClick={handleTodoClick}
          />
        ))}
      </div>
      <div className="md:hidden">
        <KanbanTabs
          todos={todos}
          onTodoClick={handleTodoClick}
          onTodoMenu={setActionTodo}
        />
      </div>
      <TodoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        todo={selectedTodo ? toTodoFormData(selectedTodo) : undefined}
        categories={categories}
        onSuccess={loadData}
      />
      <MobileFAB onClick={handleNewTodo} />
      <TodoActionSheet
        open={!!actionTodo}
        onClose={() => setActionTodo(undefined)}
        onEdit={() => {
          if (actionTodo) {
            setSelectedTodo(actionTodo);
            setModalOpen(true);
          }
        }}
        onDelete={() => {
          if (actionTodo) {
            handleDelete(actionTodo);
          }
          setActionTodo(undefined);
        }}
        onMove={() => {
          if (actionTodo) {
            handleMove(actionTodo);
          }
          setActionTodo(undefined);
        }}
      />
    </div>
  );
}
