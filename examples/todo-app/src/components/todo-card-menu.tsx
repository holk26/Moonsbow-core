"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TodoCardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onMove?: () => void;
}

export function TodoCardMenu({ onEdit, onDelete, onMove }: TodoCardMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const firstItem = containerRef.current.querySelector<HTMLElement>(
      '[role="menuitem"]'
    );
    firstItem?.focus();
  }, [open]);

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleSelect =
    (callback: () => void) => (event: React.MouseEvent) => {
      event.stopPropagation();
      setOpen(false);
      callback();
    };

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
    );
    if (items.length === 0) return;

    const activeIndex = items.findIndex((item) => item === document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex =
        activeIndex >= 0 ? (activeIndex + 1) % items.length : 0;
      items[nextIndex].focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex =
        activeIndex >= 0
          ? (activeIndex - 1 + items.length) % items.length
          : items.length - 1;
      items[prevIndex].focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0].focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1].focus();
    }
  };

  const itemClass =
    "flex min-h-11 w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Acciones"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Acciones de tarea"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-md border border-border bg-background p-1 text-foreground shadow-md"
        >
          <button
            role="menuitem"
            onClick={handleSelect(onEdit)}
            className={cn(
              itemClass,
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>

          {onMove && (
            <button
              role="menuitem"
              onClick={handleSelect(onMove)}
              className={cn(
                itemClass,
                "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <ArrowRight className="h-4 w-4" />
              Mover a...
            </button>
          )}

          <button
            role="menuitem"
            onClick={handleSelect(onDelete)}
            className={cn(
              itemClass,
              "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
            )}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
