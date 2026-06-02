"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, Users, Bell, AppWindow, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { StatsResponse } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { title: "Tenants", value: stats?.tenants ?? 0, icon: Building2, description: "Organizaciones activas" },
    { title: "Usuarios", value: stats?.users ?? 0, icon: Users, description: "Usuarios registrados" },
    { title: "Apps", value: stats?.apps ?? 0, icon: AppWindow, description: "Aplicaciones integradas" },
    { title: "Suscripciones", value: stats?.subscriptions ?? 0, icon: CreditCard, description: "Planes activos" },
    { title: "Eventos", value: stats?.events ?? 0, icon: CalendarDays, description: "Eventos registrados" },
    { title: "Notificaciones", value: stats?.notifications ?? 0, icon: Bell, description: "Notificaciones enviadas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Bienvenido, {user?.full_name || user?.email}
        </h2>
        <p className="text-muted-foreground">
          Este es el panel de administración de Moonsbow Core.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Eventos del sistema en los últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Consulta la página de Eventos para ver el log completo.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Módulos activos</CardTitle>
            <CardDescription>Servicios habilitados en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Auth", "Tenants", "Billing", "Apps", "Webhooks", "Events", "Notifications"].map((mod) => (
                <div key={mod} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{mod}</span>
                  <span className="text-xs text-green-500">● Activo</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
