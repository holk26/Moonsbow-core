"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import type { EventResponse } from "@/lib/types";

export default function EventsPage() {
  const [tenantId, setTenantId] = useState("");

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["events", tenantId],
    queryFn: () => (tenantId ? api.listEvents(tenantId) : Promise.resolve([])),
    enabled: !!tenantId,
  });

  const events: EventResponse[] = data || [];
  const tenantList = (tenants?.items as Array<{ id: string; name: string }>) || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
        <p className="text-muted-foreground">Log de eventos del sistema</p>
      </div>

      <div className="w-full max-w-sm">
        <Select value={tenantId} onValueChange={(v) => setTenantId(v || "")}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tenant" />
          </SelectTrigger>
          <SelectContent>
            {tenantList.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CalendarDays className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay eventos para este tenant</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{event.event_type}</CardTitle>
                  <Badge variant="outline">{event.status}</Badge>
                </div>
                <CardDescription>Origen: {event.source}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
