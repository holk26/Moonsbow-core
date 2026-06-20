"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TodoFormData } from "@/lib/todo-types";

import { createTodo, updateTodo } from "@/actions/todo-actions";

interface TodoFormProps {
  todo?: TodoFormData;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function TodoForm({ todo, categories, onSuccess, onCancel }: TodoFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(todo?.title || "");
  const [description, setDescription] = useState(todo?.description || "");
  const [status, setStatus] = useState<TodoFormData["status"]>(todo?.status || "pending");
  const [priority, setPriority] = useState<TodoFormData["priority"]>(
    todo?.priority || "medium"
  );
  const [dueDate, setDueDate] = useState(
    todo?.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 16) : ""
  );
  const [categoryId, setCategoryId] = useState(todo?.categoryId || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title,
      description: description || undefined,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      categoryId: categoryId || undefined,
    };

    try {
      if (todo) {
        await updateTodo(todo.id!, payload);
      } else {
        await createTodo(payload);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save todo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="todo-title" className="text-sm font-medium">
          Título *
        </label>
        <Input
          id="todo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la tarea"
          required
        />
      </div>
      <div>
        <label htmlFor="todo-description" className="text-sm font-medium">
          Descripción
        </label>
        <Textarea
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles de la tarea..."
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="todo-status" className="text-sm font-medium">
            Estado
          </label>
          <Select
            id="todo-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TodoFormData["status"])}
            options={[
              { value: "pending", label: "Pendiente" },
              { value: "in_progress", label: "En progreso" },
              { value: "done", label: "Completada" },
            ]}
          />
        </div>
        <div>
          <label htmlFor="todo-priority" className="text-sm font-medium">
            Prioridad
          </label>
          <Select
            id="todo-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoFormData["priority"])}
            options={[
              { value: "low", label: "Baja" },
              { value: "medium", label: "Media" },
              { value: "high", label: "Alta" },
              { value: "urgent", label: "Urgente" },
            ]}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="todo-due-date" className="text-sm font-medium">
            Fecha límite
          </label>
          <Input
            id="todo-due-date"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="todo-category" className="text-sm font-medium">
            Categoría
          </label>
          <Select
            id="todo-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[
              { value: "", label: "Sin categoría" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 md:flex-row md:justify-end md:gap-0 md:space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full md:w-auto">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !title.trim()} className="w-full md:w-auto">
          {todo ? "Guardar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
