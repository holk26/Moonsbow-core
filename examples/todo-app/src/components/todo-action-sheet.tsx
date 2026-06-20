"use client";

import { useEffect, useRef } from "react";
import { Pencil, Trash2, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TodoActionSheetProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove?: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function TodoActionSheet({
  open,
  onClose,
  onEdit,
  onDelete,
  onMove,
  triggerRef,
}: TodoActionSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(open);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = [
        closeButtonRef.current,
        editButtonRef.current,
        onMove ? moveButtonRef.current : null,
        deleteButtonRef.current,
      ].filter(Boolean) as HTMLButtonElement[];

      if (focusable.length === 0) return;

      const activeIndex = focusable.findIndex(
        (element) => element === document.activeElement
      );

      if (event.shiftKey) {
        const previousIndex =
          activeIndex <= 0 ? focusable.length - 1 : activeIndex - 1;
        focusable[previousIndex]?.focus();
      } else {
        const nextIndex =
          activeIndex === -1 || activeIndex === focusable.length - 1
            ? 0
            : activeIndex + 1;
        focusable[nextIndex]?.focus();
      }

      event.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onMove]);

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
      closeButtonRef.current?.focus();
    } else {
      document.body.classList.remove("overflow-hidden");
      if (wasOpenRef.current && triggerRef?.current) {
        triggerRef.current.focus();
      }
    }

    wasOpenRef.current = open;

    return () => document.body.classList.remove("overflow-hidden");
  }, [open, triggerRef]);

  if (!open) return null;

  const itemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-50 w-full max-w-lg rounded-t-2xl bg-background p-4 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="todo-action-sheet-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="todo-action-sheet-title"
            className="text-base font-semibold text-foreground"
          >
            Acciones de tarea
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <button
            ref={editButtonRef}
            type="button"
            onClick={() => {
              onClose();
              onEdit();
            }}
            className={cn(
              itemClass,
              "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Pencil className="h-4 w-4" />
            Editar tarea
          </button>

          {onMove && (
            <button
              ref={moveButtonRef}
              type="button"
              onClick={() => {
                onClose();
                onMove();
              }}
              className={cn(
                itemClass,
                "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <ArrowRight className="h-4 w-4" />
              Cambiar estado
            </button>
          )}

          <button
            ref={deleteButtonRef}
            type="button"
            onClick={() => {
              onClose();
              onDelete();
            }}
            className={cn(
              itemClass,
              "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
            )}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar tarea
          </button>
        </div>
      </div>
    </div>
  );
}
