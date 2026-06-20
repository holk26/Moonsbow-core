import { Header } from "@/components/header";
import { KanbanBoard } from "@/components/kanban-board";
import { AuthGuard } from "@/components/auth-guard";

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 space-y-6 p-6">
          <KanbanBoard />
        </main>
      </div>
    </AuthGuard>
  );
}
