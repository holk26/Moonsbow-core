"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Flag } from "lucide-react";

interface TodoCardProps {
  todo: {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    dueDate: Date | null;
    category: { name: string; color: string } | null;
  };
  onClick: () => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const priorityLabels: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export function TodoCard({ todo, onClick }: TodoCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border bg-background p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium">{todo.title}</h4>
        <Badge
          variant="secondary"
          className={cn("text-xs", priorityColors[todo.priority])}
        >
          <Flag className="mr-1 h-3 w-3" />
          {priorityLabels[todo.priority]}
        </Badge>
      </div>
      {todo.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {todo.description}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        {todo.category && (
          <span
            className="rounded-full px-2 py-0.5 text-xs text-white"
            style={{ backgroundColor: todo.category.color }}
          >
            {todo.category.name}
          </span>
        )}
        {todo.dueDate && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(todo.dueDate).toLocaleDateString("es-ES")}
          </span>
        )}
      </div>
    </div>
  );
}
