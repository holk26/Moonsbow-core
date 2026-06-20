# Mobile UX/UI Optimization for Moonsbow ToDo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Moonsbow ToDo dashboard usable and polished on mobile phones while keeping the existing desktop Kanban experience unchanged.

**Architecture:** We will keep the existing desktop components and introduce mobile-only components that are conditionally rendered with Tailwind responsive utilities (`md:hidden` / `hidden md:block`). All data access continues through the existing server actions in `examples/todo-app/src/actions/todo-actions.ts`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui base-nova components already present in `examples/todo-app/src/components/ui/`.

---

## File map

| File | Responsibility |
|------|----------------|
| `examples/todo-app/src/components/stats-bar.tsx` | Modify: make stat cards responsive (4 cols desktop, 2 cols mobile). |
| `examples/todo-app/src/components/header.tsx` | Modify: render mobile header below `md`, keep current header on desktop. |
| `examples/todo-app/src/components/header-mobile.tsx` | Create: avatar + dropdown menu for mobile. |
| `examples/todo-app/src/components/kanban-tabs.tsx` | Create: sticky tab bar + single-column task list for mobile. |
| `examples/todo-app/src/components/filter-drawer.tsx` | Create: mobile bottom sheet for status/priority filters. |
| `examples/todo-app/src/components/mobile-fab.tsx` | Create: floating action button for new task on mobile. |
| `examples/todo-app/src/components/todo-card.tsx` | Modify: larger touch targets, long-press context menu. |
| `examples/todo-app/src/components/todo-modal.tsx` | Modify: use bottom-sheet layout on mobile. |
| `examples/todo-app/src/components/todo-form.tsx` | Modify: responsive spacing and full-width fields on mobile. |
| `examples/todo-app/src/components/kanban-board.tsx` | Modify: wire mobile components, keep desktop grid. |
| `examples/todo-app/src/components/todo-filters.tsx` | Modify: show search + filter button on mobile, inline bar on desktop. |

---

### Task 1: Responsive StatsBar

**Files:**
- Modify: `examples/todo-app/src/components/stats-bar.tsx`

- [ ] **Step 1: Update grid and card padding for mobile**

Replace the outer `div` classes and compact the card content on small screens.

```tsx
<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
  {items.map((item) => (
    <Card key={item.label}>
      <CardContent className="flex items-center justify-between p-3 md:p-4">
        <div>
          <p className="text-xl font-bold md:text-2xl">{item.value}</p>
          <p className="text-[10px] text-muted-foreground md:text-xs">{item.label}</p>
        </div>
        <item.icon className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" />
      </CardContent>
    </Card>
  ))}
</div>
```

- [ ] **Step 2: Verify visually**

Run the dev server (`npm run dev` in `examples/todo-app`) and resize the browser. At widths below `768px` the stats should be a 2x2 grid; at larger widths, a single row of four.

- [ ] **Step 3: Commit**

```bash
git add examples/todo-app/src/components/stats-bar.tsx
git commit -m "feat(todo-app): make stats bar responsive"
```

---

### Task 2: Mobile Header

**Files:**
- Create: `examples/todo-app/src/components/header-mobile.tsx`
- Modify: `examples/todo-app/src/components/header.tsx`

- [ ] **Step 1: Create `HeaderMobile` component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, CheckSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UserData {
  name: string;
  email: string;
  tenantPlan: string;
}

export function HeaderMobile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          name: payload.name || payload.email,
          email: payload.email,
          tenantPlan: payload.tenant_plan || "free",
        });
      } catch {
        // invalid token
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <header className="border-b bg-background md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          <h1 className="text-base font-semibold">Moonsbow ToDo</h1>
        </div>
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
              aria-expanded={open}
              aria-label="Menú de usuario"
            >
              <User className="h-5 w-5" />
            </button>
            {open && (
              <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border bg-background p-3 shadow-lg">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                  {user.tenantPlan}
                </span>
                <hr className="my-2 border-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Modify `Header` to hide on mobile and include `HeaderMobile`**

```tsx
import { HeaderMobile } from "./header-mobile";

export function Header() {
  // existing desktop header unchanged...
  return (
    <>
      <HeaderMobile />
      <header className="hidden border-b bg-background md:block">
        {/* existing desktop header markup */}
      </header>
    </>
  );
}
```

Keep the existing desktop header markup exactly as it is today.

- [ ] **Step 3: Verify**

At widths below `768px` only the compact header with avatar should appear. Tapping the avatar shows the dropdown with user info and logout.

- [ ] **Step 4: Commit**

```bash
git add examples/todo-app/src/components/header.tsx examples/todo-app/src/components/header-mobile.tsx
git commit -m "feat(todo-app): add mobile header with avatar menu"
```

---

### Task 3: Mobile Kanban Tabs

**Files:**
- Create: `examples/todo-app/src/components/kanban-tabs.tsx`
- Modify: `examples/todo-app/src/components/kanban-board.tsx` (in Task 8)

- [ ] **Step 1: Create `KanbanTabs` component**

```tsx
"use client";

import { useState } from "react";
import { TodoCard } from "@/components/todo-card";
import { EmptyState } from "@/components/empty-state";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  categoryId: string | null;
  category: { name: string; color: string } | null;
}

interface KanbanTabsProps {
  todos: Todo[];
  onTodoClick: (todo: Todo) => void;
  onTodoMenu?: (todo: Todo) => void;
}

const tabs = [
  { title: "Pendiente", status: "pending" },
  { title: "En progreso", status: "in_progress" },
  { title: "Completada", status: "done" },
];

export function KanbanTabs({ todos, onTodoClick, onTodoMenu }: KanbanTabsProps) {
  const [active, setActive] = useState("pending");

  const filtered = todos.filter((t) => t.status === active);
  const activeTab = tabs.find((t) => t.status === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-30 -mx-3 bg-background px-3 py-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const count = todos.filter((t) => t.status === tab.status).length;
            const isActive = tab.status === active;
            return (
              <button
                key={tab.status}
                type="button"
                onClick={() => setActive(tab.status)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
                aria-pressed={isActive}
              >
                {tab.title}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isActive ? "bg-primary-foreground text-primary" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2 pb-20">
        {filtered.length === 0 ? (
          <EmptyState title="Sin tareas" description={`No hay tareas ${activeTab.title.toLowerCase()}`} />
        ) : (
          filtered.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onClick={() => onTodoClick(todo)}
              onLongPress={() => onTodoMenu?.(todo)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Import `KanbanTabs` temporarily into a test page or into `KanbanBoard` (see Task 8) and confirm tabs switch and show the correct task count.

- [ ] **Step 3: Commit**

```bash
git add examples/todo-app/src/components/kanban-tabs.tsx
git commit -m "feat(todo-app): add mobile kanban tabs component"
```

---

### Task 4: Mobile Filter Drawer

**Files:**
- Create: `examples/todo-app/src/components/filter-drawer.tsx`
- Modify: `examples/todo-app/src/components/todo-filters.tsx`

- [ ] **Step 1: Create `FilterDrawer` component**

```tsx
"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface FilterDrawerProps {
  filters: {
    status: string;
    priority: string;
    search: string;
  };
  onChange: (filters: FilterDrawerProps["filters"]) => void;
}

export function FilterDrawer({ filters, onChange }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar tareas..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-xl border-t bg-background p-4 shadow-lg transition-transform duration-200 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!open}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Filtros</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-2 hover:bg-secondary"
            aria-label="Cerrar filtros"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Estado</label>
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
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Prioridad</label>
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
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              onChange({ status: "all", priority: "all", search: filters.search });
              setOpen(false);
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Modify `TodoFilters` to use `FilterDrawer` on mobile**

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FilterDrawer } from "./filter-drawer";

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
    <>
      <div className="hidden flex-1 gap-3 md:flex">
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
      <div className="flex-1 md:hidden">
        <FilterDrawer filters={filters} onChange={onChange} />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify**

On mobile the filter bar should show only the search input and a filter icon. Tapping the icon opens the bottom drawer; selecting options updates the list.

- [ ] **Step 4: Commit**

```bash
git add examples/todo-app/src/components/todo-filters.tsx examples/todo-app/src/components/filter-drawer.tsx
git commit -m "feat(todo-app): add mobile filter drawer"
```

---

### Task 5: Mobile Floating Action Button

**Files:**
- Create: `examples/todo-app/src/components/mobile-fab.tsx`

- [ ] **Step 1: Create `MobileFAB` component**

```tsx
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
```

- [ ] **Step 2: Verify**

The button should appear only below `768px` and open the new-task modal when clicked.

- [ ] **Step 3: Commit**

```bash
git add examples/todo-app/src/components/mobile-fab.tsx
git commit -m "feat(todo-app): add mobile floating action button"
```

---

### Task 6: TodoCard Touch Targets and Long-Press Menu

**Files:**
- Modify: `examples/todo-app/src/components/todo-card.tsx`
- Create: `examples/todo-app/src/components/todo-card-menu.tsx`

- [ ] **Step 1: Create `TodoCardMenu` for desktop accessibility**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2, ArrowRight } from "lucide-react";

interface TodoCardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onMove?: () => void;
}

export function TodoCardMenu({ onEdit, onDelete, onMove }: TodoCardMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary"
        aria-label="Opciones"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 rounded-md border bg-background p-1 shadow-lg">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-secondary"
          >
            <Pencil className="h-4 w-4" /> Editar
          </button>
          {onMove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onMove();
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-secondary"
            >
              <ArrowRight className="h-4 w-4" /> Mover
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-destructive hover:bg-secondary"
          >
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modify `TodoCard` to support long-press and add action menu**

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Flag } from "lucide-react";
import { TodoCardMenu } from "./todo-card-menu";
import { useRef, useState } from "react";

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

export function TodoCard({
  todo,
  onClick,
  onLongPress,
  onEdit,
  onDelete,
  onMove,
}: TodoCardProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const startLongPress = () => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      onLongPress?.();
      setIsPressing(false);
    }, 600);
  };

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  };

  return (
    <div
      onClick={onClick}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.();
      }}
      className={cn(
        "relative cursor-pointer rounded-lg border bg-background p-4 shadow-sm transition-shadow hover:shadow-md md:p-3",
        isPressing && "scale-[0.98] bg-secondary/50"
      )}
      role="button"
      tabIndex={0}
      aria-label={`Tarea ${todo.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug">{todo.title}</h4>
        <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>
          {onEdit && onDelete && (
            <TodoCardMenu onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
          )}
        </div>
      </div>
      {todo.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {todo.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className={cn("text-xs", priorityColors[todo.priority])}
        >
          <Flag className="mr-1 h-3 w-3" />
          {priorityLabels[todo.priority]}
        </Badge>
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
```

- [ ] **Step 3: Verify**

On desktop the three-dot menu appears on each card. On mobile, long-pressing a card triggers `onLongPress` (wired to open the action menu in Task 8). All touch targets are at least 44 px.

- [ ] **Step 4: Commit**

```bash
git add examples/todo-app/src/components/todo-card.tsx examples/todo-app/src/components/todo-card-menu.tsx
git commit -m "feat(todo-app): improve card touch targets and add action menu"
```

---

### Task 7: Mobile Action Menu for Long-Press

**Files:**
- Create: `examples/todo-app/src/components/todo-action-sheet.tsx`

- [ ] **Step 1: Create `TodoActionSheet`**

```tsx
"use client";

import { Pencil, Trash2, ArrowRight, X } from "lucide-react";

interface TodoActionSheetProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove?: () => void;
}

export function TodoActionSheet({
  open,
  onClose,
  onEdit,
  onDelete,
  onMove,
}: TodoActionSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-xl bg-background p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Acciones</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 hover:bg-secondary"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left active:bg-secondary"
          >
            <Pencil className="h-5 w-5" /> Editar tarea
          </button>
          {onMove && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onMove();
              }}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left active:bg-secondary"
            >
              <ArrowRight className="h-5 w-5" /> Cambiar estado
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete();
            }}
            className="flex w-full items-center gap-3 rounded-lg border border-destructive/20 p-3 text-left text-destructive active:bg-secondary"
          >
            <Trash2 className="h-5 w-5" /> Eliminar tarea
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add examples/todo-app/src/components/todo-action-sheet.tsx
git commit -m "feat(todo-app): add mobile todo action sheet"
```

---

### Task 8: Mobile Sheet-Style Modal

**Files:**
- Modify: `examples/todo-app/src/components/todo-modal.tsx`

- [ ] **Step 1: Update `TodoModal` to render as a sheet on mobile**

```tsx
"use client";

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TodoForm } from "@/components/todo-form";
import { X } from "lucide-react";

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
    <>
      {/* Desktop modal */}
      <div className="hidden md:block">
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
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-xl bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {todo ? "Editar tarea" : "Nueva tarea"}
              </h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md p-2 hover:bg-secondary"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <TodoForm
              todo={todo}
              categories={categories}
              onSuccess={() => {
                onSuccess();
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Update `TodoForm` for mobile spacing**

In `examples/todo-app/src/components/todo-form.tsx`, change the two-column grids to be single-column on mobile:

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
```

Apply the same class to both grid sections (status/priority and dueDate/category). The `DialogFooter` can remain, but on mobile add `flex-col-reverse md:flex-row`:

```tsx
<DialogFooter className="flex-col-reverse gap-2 md:flex-row md:gap-0">
```

- [ ] **Step 3: Verify**

On mobile the modal should slide up from the bottom and occupy most of the screen. On desktop it should remain a centered dialog.

- [ ] **Step 4: Commit**

```bash
git add examples/todo-app/src/components/todo-modal.tsx examples/todo-app/src/components/todo-form.tsx
git commit -m "feat(todo-app): use bottom sheet modal on mobile"
```

---

### Task 9: Wire Mobile Components into KanbanBoard

**Files:**
- Modify: `examples/todo-app/src/components/kanban-board.tsx`

- [ ] **Step 1: Import new components and add action-sheet state**

```tsx
"use client";

import { useState, useEffect } from "react";
import { KanbanColumn } from "@/components/kanban-column";
import { TodoModal } from "@/components/todo-modal";
import { TodoFilters } from "@/components/todo-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getTodos, getCategories, deleteTodo, updateTodo } from "@/actions/todo-actions";
import { KanbanTabs } from "@/components/kanban-tabs";
import { MobileFAB } from "@/components/mobile-fab";
import { TodoActionSheet } from "@/components/todo-action-sheet";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  categoryId: string | null;
  category: { name: string; color: string } | null;
}

export function KanbanBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ status: "all", priority: "all", search: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>();
  const [actionTodo, setActionTodo] = useState<Todo | undefined>();
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [todoData, categoryData] = await Promise.all([
      getTodos(filters),
      getCategories(),
    ]);
    setTodos(todoData as Todo[]);
    setCategories(categoryData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setModalOpen(true);
  };

  const handleNewTodo = () => {
    setSelectedTodo(undefined);
    setModalOpen(true);
  };

  const handleDelete = async (todo: Todo) => {
    await deleteTodo(todo.id);
    loadData();
  };

  const handleMove = async (todo: Todo) => {
    const nextStatus =
      todo.status === "pending"
        ? "in_progress"
        : todo.status === "in_progress"
        ? "done"
        : "pending";
    await updateTodo(todo.id, { status: nextStatus });
    loadData();
  };

  const columns = [
    { title: "Pendiente", status: "pending" },
    { title: "En progreso", status: "in_progress" },
    { title: "Completada", status: "done" },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <TodoFilters filters={filters} onChange={setFilters} />
        <Button onClick={handleNewTodo} className="hidden md:flex">
          <Plus className="mr-2 h-4 w-4" />
          Nueva tarea
        </Button>
      </div>

      {/* Desktop Kanban */}
      <div className="hidden grid-cols-3 gap-4 md:grid">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            status={col.status}
            todos={todos.filter((t) => t.status === col.status)}
            onTodoClick={handleTodoClick}
          />
        ))}
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden">
        <KanbanTabs
          todos={todos}
          onTodoClick={handleTodoClick}
          onTodoMenu={(todo) => setActionTodo(todo)}
        />
      </div>

      <MobileFAB onClick={handleNewTodo} />

      <TodoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        todo={selectedTodo}
        categories={categories}
        onSuccess={loadData}
      />

      <TodoActionSheet
        open={!!actionTodo}
        onClose={() => setActionTodo(undefined)}
        onEdit={() => {
          if (actionTodo) {
            setSelectedTodo(actionTodo);
            setModalOpen(true);
          }
        }}
        onDelete={() => {
          if (actionTodo) handleDelete(actionTodo);
          setActionTodo(undefined);
        }}
        onMove={() => {
          if (actionTodo) handleMove(actionTodo);
          setActionTodo(undefined);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update `KanbanColumn` to pass menu props on desktop**

This is optional because the desktop menu is now inside `TodoCard`. If you want the desktop Kanban to also show the three-dot menu, ensure `KanbanColumn` passes `onEdit`/`onDelete`/`onMove` to `TodoCard`. For this plan, the desktop behavior remains click-to-edit; the menu is only a progressive enhancement for keyboard users.

- [ ] **Step 3: Verify**

Open the app on a mobile viewport. Confirm:
- Tabs switch between statuses.
- FAB opens the new-task sheet.
- Long-pressing a card opens the action sheet.
- Desktop view still shows the 3-column Kanban and inline filters.

- [ ] **Step 4: Commit**

```bash
git add examples/todo-app/src/components/kanban-board.tsx
git commit -m "feat(todo-app): wire mobile components into kanban board"
```

---

### Task 10: Build and Deploy

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Run local build**

```bash
cd examples/todo-app
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 2: Test responsive layouts in Chrome DevTools**

Open `http://localhost:3000` (or the local Dokploy URL), toggle DevTools device toolbar, and test:
- iPhone SE
- iPhone 14
- Android small

Verify login, create task, edit via long-press, filter drawer, and logout.

- [ ] **Step 3: Push and deploy**

```bash
cd /home/holk/Documents/proyectos/Moonsbow-core
git push origin main
```

Wait for Dokploy auto-deploy or trigger manually. Confirm the deployment reaches `done` state.

- [ ] **Step 4: Verify production**

Visit `https://todo.app.moonsbow.com` on a phone or mobile viewport and repeat the full flow.

- [ ] **Step 5: Commit any final fixes**

If any fixes were needed during verification, commit them with a clear message.

---

## Self-review checklist

| Spec requirement | Task |
|------------------|------|
| Mobile header with avatar menu | Task 2 |
| Responsive stats bar | Task 1 |
| Mobile tabs for Kanban | Task 3 + Task 9 |
| Mobile filter drawer | Task 4 |
| Mobile FAB for new task | Task 5 + Task 9 |
| Long-press action menu | Task 6 + Task 7 + Task 9 |
| Mobile sheet modal | Task 8 |
| Desktop layout unchanged | All tasks use `md:hidden` / `hidden md:*` |
| Build & deploy verification | Task 10 |
