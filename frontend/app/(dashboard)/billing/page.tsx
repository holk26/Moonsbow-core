"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SubscriptionResponse } from "@/lib/types";

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

  const subscriptions: SubscriptionResponse[] = data || [];
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
                    Inicio: {sub.started_at ? new Date(sub.started_at).toLocaleDateString() : "—"}
                  </p>
                  {sub.expires_at && (
                    <p className="text-sm text-muted-foreground">
                      Expira: {new Date(sub.expires_at).toLocaleDateString()}
                    </p>
                  )}
                  {sub.external_id && (
                    <p className="text-xs text-muted-foreground">
                      ID externo: {sub.external_id}
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
