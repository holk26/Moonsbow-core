"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UtensilsCrossed } from "lucide-react";

interface MenuItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
}

export default function RestaurantPage() {
  const [tenantId, setTenantId] = useState("");

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["menu", tenantId],
    queryFn: () => (tenantId ? api.listMenu(tenantId) : Promise.resolve({ items: [], total: 0 })),
    enabled: !!tenantId,
  });

  const items: MenuItem[] = ((data?.items || []) as unknown as MenuItem[]) || [];
  const tenantList = (tenants?.items as Array<{ id: string; name: string }>) || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Restaurant</h2>
        <p className="text-muted-foreground">Menú y gestión de órdenes</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay items en el menú</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription>
                  <Badge variant="outline">{item.category}</Badge>
                  <Badge variant={item.is_available ? "default" : "secondary"} className="ml-2">
                    {item.is_available ? "Disponible" : "Agotado"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <p className="text-lg font-bold">${item.price.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
