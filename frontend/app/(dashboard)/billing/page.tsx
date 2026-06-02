"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionResponse } from "@/lib/types";

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tenant_id: "",
    plan: "free",
    status: "active",
    expires_at: "",
    external_id: "",
  });

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", tenantId],
    queryFn: () => (tenantId ? api.getSubscriptions(tenantId) : Promise.resolve([])),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: api.createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Suscripción creada");
      setOpen(false);
      setForm({ tenant_id: tenantId, plan: "free", status: "active", expires_at: "", external_id: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const subscriptions: SubscriptionResponse[] = data || [];
  const tenantList = (tenants?.items as Array<{ id: string; name: string }>) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      tenant_id: form.tenant_id || tenantId,
      plan: form.plan,
      status: form.status,
      expires_at: form.expires_at || undefined,
      external_id: form.external_id || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
          <p className="text-muted-foreground">Gestiona las suscripciones y planes</p>
        </div>
        {tenantId && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Suscripción
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Suscripción</DialogTitle>
                <DialogDescription>Crea una suscripción para el tenant seleccionado</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v || "free" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v || "active" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="past_due">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires">Fecha de expiración</Label>
                  <Input id="expires" type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="external">ID externo</Label>
                  <Input id="external" value={form.external_id} onChange={(e) => setForm({ ...form, external_id: e.target.value })} placeholder="Stripe/Paddle ID" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>Crear</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
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
            <Skeleton className="h-32 w-full" />
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
                    <p className="text-xs text-muted-foreground">ID externo: {sub.external_id}</p>
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
