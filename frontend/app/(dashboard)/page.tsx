"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, Users, Bell } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { title: "Tenants", value: "—", icon: Building2, description: "Organizaciones activas" },
    { title: "Suscripciones", value: "—", icon: CreditCard, description: "Planes activos" },
    { title: "Usuarios", value: "—", icon: Users, description: "Usuarios registrados" },
    { title: "Notificaciones", value: "—", icon: Bell, description: "No leídas" },
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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
