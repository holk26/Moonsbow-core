"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TodoForm } from "@/components/todo-form";
import { TodoFormData } from "@/lib/todo-types";
import { X } from "lucide-react";

interface TodoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: TodoFormData;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}

function ModalTodoForm({
  todo,
  categories,
  onSuccess,
  onOpenChange,
}: {
  todo?: TodoFormData;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <TodoForm
      todo={todo}
      categories={categories}
      onSuccess={() => {
        onSuccess();
        onOpenChange(false);
      }}
      onCancel={() => onOpenChange(false)}
    />
  );
}

export function TodoModal({ open, onOpenChange, todo, categories, onSuccess }: TodoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onOpenChange]);

  const title = todo ? "Editar tarea" : "Nueva tarea";

  return (
    <>
      <div className="hidden md:block">
        <Dialog
          open={open}
          onOpenChange={onOpenChange}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <DialogHeader>
            <DialogTitle id="modal-title">{title}</DialogTitle>
          </DialogHeader>
          <ModalTodoForm
            todo={todo}
            categories={categories}
            onSuccess={onSuccess}
            onOpenChange={onOpenChange}
          />
        </Dialog>
      </div>

      <div
        className={cn("fixed inset-0 z-50 md:hidden", !open && "hidden")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-xl bg-background p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="sheet-title"
              className="text-lg font-semibold leading-none tracking-tight"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 hover:bg-accent"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ModalTodoForm
            todo={todo}
            categories={categories}
            onSuccess={onSuccess}
            onOpenChange={onOpenChange}
          />
        </div>
      </div>
    </>
  );
}
