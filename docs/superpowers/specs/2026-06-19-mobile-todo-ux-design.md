# Mobile UX/UI Optimization for Moonsbow ToDo

**Date:** 2026-06-19
**Scope:** Satellite ToDo app (`examples/todo-app/`) frontend only
**Goal:** Make the dashboard usable and polished on phones while keeping the current desktop Kanban experience intact.

---

## Background

The current dashboard uses a fixed 3-column Kanban layout, a horizontal filter bar, and a header that shows the full user name, email, plan badge, and logout button. On mobile screens this becomes cramped and hard to interact with.

## Design Decisions

We will keep the existing desktop layout and introduce mobile-optimized components that are conditionally rendered. The server actions and data flow remain unchanged.

### 1. Header

| View | Behavior |
|------|----------|
| Mobile | Logo + app name + circular avatar only. Tapping the avatar opens a dropdown menu with name, email, plan badge, and logout. |
| Desktop | Existing header with full user info inline. |

### 2. StatsBar

| View | Behavior |
|------|----------|
| Mobile | 2x2 grid of compact stat cards with smaller icon and text. |
| Desktop | 4-column grid as today. |

### 3. Kanban Board

| View | Behavior |
|------|----------|
| Mobile | Sticky tab bar with three tabs: **Pendiente**, **En progreso**, **Completada**. Each tab shows a vertical list of tasks for that status. The tab label includes a task count badge. |
| Desktop | Three-column Kanban board as today. |

### 4. Filters

| View | Behavior |
|------|----------|
| Mobile | Fixed search input at the top plus a **Filtros** button. Tapping the button opens a bottom sheet/drawer with status, priority, and sort options. |
| Desktop | Horizontal inline filter bar as today. |

### 5. New Task Button

| View | Behavior |
|------|----------|
| Mobile | Floating Action Button (FAB) in the bottom-right corner, always visible above the content. |
| Desktop | "Nueva tarea" button in the toolbar as today. |

### 6. Task Cards

- Minimum touch target of 44 px for any interactive element.
- Mobile: long-press on a card opens a context menu with **Editar**, **Mover a...**, and **Eliminar**.
- Desktop: normal click opens the edit modal.

### 7. Modal / Form

- Mobile: opens as a bottom sheet that occupies most of the viewport. Form fields are stacked vertically. The save button remains accessible when the on-screen keyboard is open.
- Desktop: centered modal dialog as today.

## Components to Create / Modify

### New components

- `HeaderMobile` — mobile header with avatar dropdown.
- `KanbanTabs` — mobile tabbed task list.
- `FilterDrawer` — mobile filter bottom sheet.
- `MobileFAB` — floating new-task button.
- `LongPressMenu` — long-press context menu wrapper.
- `useMediaQuery` hook (or use Tailwind responsive classes) for conditional rendering.

### Modified components

- `Header` — render `HeaderMobile` on small screens, keep current layout on desktop.
- `StatsBar` — add responsive grid classes.
- `KanbanBoard` — render `KanbanTabs` on mobile, keep 3-column grid on desktop.
- `TodoFilters` — render `FilterDrawer` on mobile, keep inline bar on desktop.
- `TodoModal` / `TodoForm` — use sheet styling on mobile.
- `TodoCard` — add long-press behavior and larger touch targets.

## Data Flow

No changes. All new components continue to call:

- `getTodos(filters)` / `getStats()` / `getCategories()` for reads.
- `createTodo(data)` / `updateTodo(id, data)` / `deleteTodo(id)` for writes.

## Responsive Breakpoint

Use Tailwind's `md:` breakpoint (`768px`) as the switch point:

- `md:hidden` for mobile-only elements.
- `hidden md:flex` / `hidden md:grid` for desktop-only elements.

## Accessibility

- All interactive elements must have a minimum 44 x 44 px touch target.
- Visible focus states on tabs, buttons, and menu items.
- `aria-expanded` and `aria-controls` on the avatar menu and filter drawer.
- Long-press menu must be reachable by assistive technology (provide an equivalent action button on each card).

## Verification Plan

1. Open Chrome DevTools and test at:
   - iPhone SE (375 x 667)
   - iPhone 14 (390 x 844)
   - Android small (360 x 640)
2. Verify the full flow:
   - Login redirect and callback.
   - Create a new task via FAB.
   - Switch tabs and view tasks.
   - Long-press a task and edit it.
   - Apply filters via the drawer.
   - Logout.
3. Confirm desktop layout is unchanged.
4. Run `npm run build` without errors and deploy via Dokploy.

## Out of Scope

- Offline support or PWA features.
- Push notifications.
- Drag-and-drop reordering on mobile.
- Changes to the Moonsbow Core backend or API.
