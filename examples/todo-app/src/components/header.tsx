"use client";

import { useEffect, useState } from "react";
import { LogOut, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface User {
  name: string;
  email: string;
  tenantPlan: string;
}

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Moonsbow ToDo</h1>
          {user && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
              {user.tenantPlan}
            </span>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
