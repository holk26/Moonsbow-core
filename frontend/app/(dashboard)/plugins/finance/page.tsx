"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark } from "lucide-react";
import type { TransactionResponse, TenantResponse } from "@/lib/types";

export default function FinancePage() {
  const [tenantId, setTenantId] = useState("");

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", tenantId],
    queryFn: () =>
      tenantId ? api.listTransactions(tenantId) : Promise.resolve({ items: [], total: 0 }),
    enabled: !!tenantId,
  });

  const transactions: TransactionResponse[] = data?.items ?? [];
  const tenantList: TenantResponse[] = (tenants?.items as TenantResponse[]) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Finance</h2>
        <p className="text-muted-foreground">Transacciones y gestión financiera</p>
      </div>

      <div className="w-full max-w-sm">
        <Select value={tenantId} onValueChange={(v) => setTenantId(v || "")}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tenant" />
          </SelectTrigger>
          <SelectContent>
            {tenantList.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Landmark className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay transacciones para este tenant</p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((tx) => (
            <Card key={tx.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {tx.currency} {tx.amount.toFixed(2)}
                </CardTitle>
                <CardDescription>
                  <Badge
                    variant={
                      tx.status === "completed"
                        ? "default"
                        : tx.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {tx.status}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {tx.description && (
                  <p className="text-sm text-muted-foreground">{tx.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
