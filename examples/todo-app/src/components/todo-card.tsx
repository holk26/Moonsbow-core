"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Flag } from "lucide-react";
import { TodoCardMenu } from "./todo-card-menu";

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
  onLongPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary text-secondary-foreground",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

const priorityLabels: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export function TodoCard({
  todo,
  onClick,
  onLongPress,
  onEdit,
  onDelete,
  onMove,
}: TodoCardProps) {
  const showMenu = Boolean(onEdit || onDelete || onMove);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const startLongPress = () => {
    triggeredRef.current = false;
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      onLongPress?.();
    }, 500);
  };

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (triggeredRef.current) {
      triggeredRef.current = false;
      return;
    }
    onClick();
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    if (onLongPress) {
      event.preventDefault();
      onLongPress();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div className="relative rounded-lg border bg-background shadow-sm transition-shadow hover:shadow-md">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchMove={cancelLongPress}
        onTouchEnd={cancelLongPress}
        onContextMenu={handleContextMenu}
        className="min-h-11 cursor-pointer select-none p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-2 md:pr-10">
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
              {todo.dueDate.toLocaleDateString("es-ES")}
            </span>
          )}
        </div>
      </div>

      {showMenu && (
        <div className="absolute right-1 top-1 z-10 hidden md:block">
          <TodoCardMenu
            onEdit={onEdit ?? (() => {})}
            onDelete={onDelete ?? (() => {})}
            onMove={onMove}
          />
        </div>
      )}
    </div>
  );
}
