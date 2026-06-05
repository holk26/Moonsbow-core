"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface TodoFiltersProps {
  filters: {
    status: string;
    priority: string;
    search: string;
  };
  onChange: (filters: TodoFiltersProps["filters"]) => void;
}

export function TodoFilters({ filters, onChange }: TodoFiltersProps) {
  return (
    <div className="flex gap-3">
      <Input
        placeholder="Buscar tareas..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="max-w-xs"
      />
      <Select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        options={[
          { value: "all", label: "Todos los estados" },
          { value: "pending", label: "Pendiente" },
          { value: "in_progress", label: "En progreso" },
          { value: "done", label: "Completada" },
        ]}
      />
      <Select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        options={[
          { value: "all", label: "Todas las prioridades" },
          { value: "low", label: "Baja" },
          { value: "medium", label: "Media" },
          { value: "high", label: "Alta" },
          { value: "urgent", label: "Urgente" },
        ]}
      />
    </div>
  );
}
