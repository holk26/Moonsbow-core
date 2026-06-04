"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Building2, CreditCard, Users, Bell, AppWindow, CalendarDays, ArrowRight, Code2, Webhook, BookOpen } from "lucide-react";
import Link from "next/link";
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

function QuickStartStep({ number, title, description, href, icon: Icon }: {
  number: number; title: string; description: string; href: string; icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href={href}>
            Empezar <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
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

  const isEmpty = !loading && stats && stats.apps === 0 && stats.tenants === 0;

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

      {isEmpty && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>🚀 Primeros pasos</CardTitle>
            <CardDescription>
              Tu plataforma está lista. Sigue estos pasos para empezar a usar Moonsbow Core.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickStartStep
              number={1}
              title="Crear una organización (Tenant)"
              description="Los tenants agrupan usuarios, apps y datos. Es el primer paso para organizar tu plataforma."
              href="/tenants"
              icon={Building2}
            />
            <QuickStartStep
              number={2}
              title="Registrar una aplicación"
              description="Crea una app para obtener una API Key y conectar tu servicio con Moonsbow."
              href="/apps"
              icon={AppWindow}
            />
            <QuickStartStep
              number={3}
              title="Configurar webhooks"
              description="Suscríbete a eventos como user.created o subscription.updated para recibir notificaciones en tiempo real."
              href="/integracion"
              icon={Webhook}
            />
            <QuickStartStep
              number={4}
              title="Integrar con tu código"
              description="Usa el centro de integración para generar código SDK en TypeScript o Python listo para usar."
              href="/integracion"
              icon={Code2}
            />
            <QuickStartStep
              number={5}
              title="Leer la documentación"
              description="Consulta la documentación de la API, autenticación y verificación de webhooks."
              href="/integracion"
              icon={BookOpen}
            />
          </CardContent>
        </Card>
      )}

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
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No hay eventos recientes.</p>
                <p className="text-xs text-muted-foreground">
                  Los eventos aparecerán cuando tus apps empiecen a publicar actividad.
                  {" "}
                  <Link href="/integracion" className="underline">
                    Ver cómo enviar eventos
                  </Link>
                </p>
              </div>
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
