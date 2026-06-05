"use client";

import { useState, useEffect } from "react";
import { KanbanColumn } from "@/components/kanban-column";
import { TodoModal } from "@/components/todo-modal";
import { TodoFilters } from "@/components/todo-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getTodos, getCategories } from "@/actions/todo-actions";

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

export function KanbanBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ status: "all", priority: "all", search: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>();
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [todoData, categoryData] = await Promise.all([
      getTodos(filters),
      getCategories(),
    ]);
    setTodos(todoData as Todo[]);
    setCategories(categoryData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setModalOpen(true);
  };

  const handleNewTodo = () => {
    setSelectedTodo(undefined);
    setModalOpen(true);
  };

  const columns = [
    { title: "Pendiente", status: "pending" },
    { title: "En progreso", status: "in_progress" },
    { title: "Completada", status: "done" },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TodoFilters filters={filters} onChange={setFilters} />
        <Button onClick={handleNewTodo}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva tarea
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
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
      <TodoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        todo={selectedTodo}
        categories={categories}
        onSuccess={loadData}
      />
    </div>
  );
}
