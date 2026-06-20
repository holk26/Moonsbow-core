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

export function HeaderMobile({ user }: { user: UserData | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
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

        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Menú de usuario"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <User className="h-5 w-5" />
          </Button>

          {open && user && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border bg-background p-3 shadow-lg">
              <div className="mb-3">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                  {user.tenantPlan}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
