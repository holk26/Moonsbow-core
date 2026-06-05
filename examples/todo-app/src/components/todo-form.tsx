"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { createTodo, updateTodo } from "@/actions/todo-actions";

interface TodoFormProps {
  todo?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    categoryId: string | null;
  };
  categories: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function TodoForm({ todo, categories, onSuccess, onCancel }: TodoFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(todo?.title || "");
  const [description, setDescription] = useState(todo?.description || "");
  const [status, setStatus] = useState(todo?.status || "pending");
  const [priority, setPriority] = useState(todo?.priority || "medium");
  const [dueDate, setDueDate] = useState(
    todo?.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 16) : ""
  );
  const [categoryId, setCategoryId] = useState(todo?.categoryId || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      title,
      description: description || undefined,
      status: status as "pending" | "in_progress" | "done" | "archived",
      priority: priority as "low" | "medium" | "high" | "urgent",
      dueDate: dueDate || undefined,
      categoryId: categoryId || undefined,
    };

    try {
      if (todo) {
        await updateTodo(todo.id, data);
      } else {
        await createTodo(data);
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
        <label className="text-sm font-medium">Título *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la tarea"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalles de la tarea..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Estado</label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "pending", label: "Pendiente" },
              { value: "in_progress", label: "En progreso" },
              { value: "done", label: "Completada" },
            ]}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Prioridad</label>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: "low", label: "Baja" },
              { value: "medium", label: "Media" },
              { value: "high", label: "Alta" },
              { value: "urgent", label: "Urgente" },
            ]}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Fecha límite</label>
          <Input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Categoría</label>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[
              { value: "", label: "Sin categoría" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !title.trim()}>
          {todo ? "Guardar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}
