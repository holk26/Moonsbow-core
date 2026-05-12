"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Subscription {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string | null;
}

export default function BillingPage() {
  const [tenantId, setTenantId] = useState("");

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", tenantId],
    queryFn: () => (tenantId ? api.getSubscriptions(tenantId) : Promise.resolve([])),
    enabled: !!tenantId,
  });

  const subscriptions: Subscription[] = (data as Subscription[]) || [];
  const tenantList = (tenants?.items as Array<{ id: string; name: string }>) || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">Gestiona las suscripciones y planes</p>
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

      {tenantId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-muted-foreground">No hay suscripciones para este tenant</p>
          ) : (
            subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{sub.plan}</CardTitle>
                  <CardDescription>
                    <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                      {sub.status}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Inicio: {new Date(sub.start_date).toLocaleDateString()}
                  </p>
                  {sub.end_date && (
                    <p className="text-sm text-muted-foreground">
                      Fin: {new Date(sub.end_date).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
