import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { AssistantSettings } from "@/components/settings/assistant-settings";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold">Configuración</h1>
            <AssistantSettings />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
