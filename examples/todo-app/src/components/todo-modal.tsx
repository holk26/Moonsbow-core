"use client";

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TodoForm } from "@/components/todo-form";

interface TodoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export function TodoModal({ open, onOpenChange, todo, categories, onSuccess }: TodoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{todo ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
      </DialogHeader>
      <TodoForm
        todo={todo}
        categories={categories}
        onSuccess={() => {
          onSuccess();
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}
