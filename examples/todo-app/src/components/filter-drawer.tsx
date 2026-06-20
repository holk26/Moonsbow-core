"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface FilterDrawerProps {
  filters: { status: string; priority: string; search: string };
  onChange: (filters: FilterDrawerProps["filters"]) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En progreso" },
  { value: "done", label: "Completada" },
];

export const priorityOptions = [
  { value: "all", label: "Todas las prioridades" },
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export function FilterDrawer({
  filters,
  onChange,
  triggerRef,
}: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleClear = () => {
    onChange({ ...filters, status: "all", priority: "all" });
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else {
      triggerRef?.current?.focus();
    }
  }, [open, triggerRef]);

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Buscar tareas..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="flex-1"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="filter-drawer"
        aria-label="Abrir filtros"
      >
        <Filter className="h-4 w-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-50 w-full max-w-lg rounded-t-lg bg-background p-4 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
            id="filter-drawer"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="filter-title" className="text-lg font-semibold">
                Filtros
              </h2>
              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="filter-status" className="text-sm font-medium">
                  Estado
                </label>
                <Select
                  id="filter-status"
                  value={filters.status}
                  onChange={(e) =>
                    onChange({ ...filters, status: e.target.value })
                  }
                  options={statusOptions}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="filter-priority"
                  className="text-sm font-medium"
                >
                  Prioridad
                </label>
                <Select
                  id="filter-priority"
                  value={filters.priority}
                  onChange={(e) =>
                    onChange({ ...filters, priority: e.target.value })
                  }
                  options={priorityOptions}
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleClear}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
