"use client";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="lg:hidden w-10" />
      <h1 className="text-lg font-semibold">Panel de Administración</h1>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {(user.full_name || user.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {user.is_superuser && (
              <Badge variant="secondary" className="hidden sm:inline-flex">Admin</Badge>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
