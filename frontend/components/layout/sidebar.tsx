"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Bell,
  CalendarDays,
  BookOpen,
  UtensilsCrossed,
  Landmark,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/tenants/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenants/", label: "Tenants", icon: Building2 },
  { href: "/billing/", label: "Billing", icon: CreditCard },
  { href: "/users/", label: "Usuarios", icon: Users },
  { href: "/notifications/", label: "Notificaciones", icon: Bell },
  { href: "/events/", label: "Eventos", icon: CalendarDays },
];

const pluginItems = [
  { href: "/plugins/lms/", label: "LMS", icon: BookOpen },
  { href: "/plugins/restaurant/", label: "Restaurant", icon: UtensilsCrossed },
  { href: "/plugins/finance/", label: "Finance", icon: Landmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        pathname === href || pathname === href.slice(0, -1)
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-6 w-6 rounded bg-primary" />
          Moonsbow
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4 px-3 space-y-6">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
        <div>
          <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Plugins
          </p>
          <div className="space-y-1">
            {pluginItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <Button variant="ghost" size="icon" className="lg:hidden absolute left-4 top-3 z-50" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <SidebarContent />
      </aside>
    </>
  );
}
