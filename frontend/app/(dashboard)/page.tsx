"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, Users, Bell } from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  tenants: number;
  users: number;
  notifications: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ tenants: 0, users: 0, notifications: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        // Fetch tenants
        const tenantsData = await api.listTenants(1, 1);
        // For users, we'll count from tenants or use a separate endpoint
        // Since we don't have a direct users endpoint, we'll show tenants count
        setStats({
          tenants: tenantsData.total || 0,
          users: 1, // At least the current user
          notifications: 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { title: "Tenants", value: stats.tenants.toString(), icon: Building2, description: "Organizaciones activas" },
    { title: "Usuarios", value: stats.users.toString(), icon: Users, description: "Usuarios registrados" },
    { title: "Suscripciones", value: "—", icon: CreditCard, description: "Planes activos" },
    { title: "Notificaciones", value: stats.notifications.toString(), icon: Bell, description: "No leídas" },
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-sm text-muted-foreground">No hay eventos recientes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plugins activos</CardTitle>
            <CardDescription>Módulos habilitados en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["LMS", "Restaurant", "Finance"].map((plugin) => (
                <div key={plugin} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{plugin}</span>
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
