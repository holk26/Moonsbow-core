"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  apps: "Aplicaciones",
  integracion: "Integración",
  tenants: "Organizaciones",
  billing: "Facturación",
  users: "Usuarios",
  notifications: "Notificaciones",
  events: "Eventos",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const isDetail = segments.length > 1 && !["new", "integracion"].includes(segments[1]);

  const currentLabel = routeLabels[segments[0]] || segments[0];

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link href="/" className="hover:text-foreground transition-colors">
        Dashboard
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">
        {currentLabel}
        {isDetail && " > Detalle"}
      </span>
    </nav>
  );
}
