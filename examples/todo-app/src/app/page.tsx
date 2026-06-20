import { Header } from "@/components/header";
import { KanbanBoard } from "@/components/kanban-board";
import { AuthGuard } from "@/components/auth-guard";

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 space-y-4 p-4 md:space-y-6 md:p-6">
          <KanbanBoard />
        </main>
      </div>
    </AuthGuard>
  );
}
