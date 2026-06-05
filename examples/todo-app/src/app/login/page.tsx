import { LoginButton } from "@/components/login-button";
import { CheckSquare } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center space-y-2">
          <CheckSquare className="h-10 w-10" />
          <h1 className="text-2xl font-bold">Moonsbow ToDo</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus tareas de forma autónoma
          </p>
        </div>
        <LoginButton />
        <p className="text-center text-xs text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <a
            href={`${process.env.NEXT_PUBLIC_MOONSBOW_CORE_URL}/register`}
            className="underline"
          >
            Regístrate en Moonsbow
          </a>
        </p>
      </div>
    </div>
  );
}
