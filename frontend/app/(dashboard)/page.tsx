"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CreditCard, Users, Bell, AppWindow, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { StatsResponse, EventResponse } from "@/lib/types";

function StatCard({ title, value, icon: Icon, description, loading }: {
  title: string; value: number | string; icon: React.ElementType; description: string; loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-16" /> : value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, eventsData] = await Promise.all([
          api.getStats(),
          api.listRecentEvents(5),
        ]);
        setStats(statsData);
        setRecentEvents(eventsData);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
          Panel de administración de Moonsbow Core
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} loading={loading} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Últimos eventos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos recientes.</p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{event.event_type}</p>
                      <p className="text-xs text-muted-foreground">Origen: {event.source}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{event.status}</span>
                  </div>
                ))}
              </div>
            )}
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
