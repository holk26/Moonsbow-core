"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  FilterDrawer,
  statusOptions,
  priorityOptions,
} from "@/components/filter-drawer";

interface TodoFiltersProps {
  filters: {
    status: string;
    priority: string;
    search: string;
  };
  onChange: (filters: TodoFiltersProps["filters"]) => void;
}

export function TodoFilters({ filters, onChange }: TodoFiltersProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="hidden md:flex gap-3">
        <Input
          placeholder="Buscar tareas..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="max-w-xs"
        />
        <Select
          aria-label="Estado"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          options={statusOptions}
        />
        <Select
          aria-label="Prioridad"
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value })}
          options={priorityOptions}
        />
      </div>
      <div className="md:hidden">
        <FilterDrawer
          filters={filters}
          onChange={onChange}
          triggerRef={triggerRef}
        />
      </div>
    </>
  );
}
