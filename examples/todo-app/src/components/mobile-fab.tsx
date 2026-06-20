"use client";

import { Plus } from "lucide-react";

interface MobileFABProps {
  onClick: () => void;
}

export function MobileFAB({ onClick }: MobileFABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 md:hidden"
      aria-label="Nueva tarea"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
