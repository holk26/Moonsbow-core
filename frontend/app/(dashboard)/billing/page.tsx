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
import { Plus, CreditCard, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import type { SubscriptionResponse } from "@/lib/types";

const subscriptionSchema = z.object({
  tenant_id: z.string().uuid("Selecciona una organización"),
  plan: z.enum(["free", "pro", "enterprise"], { message: "Selecciona un plan" }),
  status: z.enum(["active", "cancelled", "past_due"], { message: "Selecciona un estado" }),
  expires_at: z.string().optional(),
  external_id: z.string().optional(),
});

type SubscriptionForm = z.infer<typeof subscriptionSchema>;

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState("");
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionForm>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { tenant_id: "", plan: "free", status: "active", expires_at: "", external_id: "" },
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
      reset({ tenant_id: tenantId, plan: "free", status: "active", expires_at: "", external_id: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const subscriptions: SubscriptionResponse[] = data || [];
  const tenantList = (tenants?.items as Array<{ id: string; name: string }>) || [];
  const hasTenants = tenantList.length > 0;

  const onSubmit = (formData: SubscriptionForm) => {
    createMutation.mutate({
      tenant_id: formData.tenant_id || tenantId,
      plan: formData.plan,
      status: formData.status,
      expires_at: formData.expires_at || undefined,
      external_id: formData.external_id || undefined,
    });
  };

  const handleNew = () => {
    reset({ tenant_id: tenantId, plan: "free", status: "active", expires_at: "", external_id: "" });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturación</h2>
          <p className="text-muted-foreground">Gestiona las suscripciones y planes</p>
        </div>
        {tenantId && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva suscripción
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva suscripción</DialogTitle>
                <DialogDescription>Crea una suscripción para la organización seleccionada</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Organización *</Label>
                  <Select
                    value={watch("tenant_id")}
                    onValueChange={(v) => setValue("tenant_id", v || "", { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una organización" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenantList.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tenant_id && (
                    <p className="text-sm text-red-500">{errors.tenant_id.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Plan *</Label>
                  <Select
                    value={watch("plan")}
                    onValueChange={(v) => setValue("plan", v as "free" | "pro" | "enterprise", { shouldValidate: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free — para pruebas</SelectItem>
                      <SelectItem value="pro">Pro — para producción</SelectItem>
                      <SelectItem value="enterprise">Enterprise — personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.plan && (
                    <p className="text-sm text-red-500">{errors.plan.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Estado *</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(v) => setValue("status", v as "active" | "cancelled" | "past_due", { shouldValidate: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="past_due">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires">Fecha de expiración</Label>
                  <Input id="expires" type="datetime-local" {...register("expires_at")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="external">ID externo</Label>
                  <Input id="external" placeholder="ID de Stripe/Paddle (opcional)" {...register("external_id")} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>Crear</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!hasTenants ? (
        <EmptyState
          icon={Building2}
          title="Necesitas una organización"
          description="Las suscripciones pertenecen a una organización. Crea la primera para gestionar planes de facturación."
          action={{ label: "Crear organización", href: "/tenants/" }}
        />
      ) : (
        <>
          <div className="w-full max-w-sm">
            <Select value={tenantId} onValueChange={(v) => setTenantId(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una organización" />
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
                <EmptyState
                  icon={CreditCard}
                  title="Sin suscripciones"
                  description={`La organización seleccionada no tiene suscripciones activas. Crea una para asignarle un plan.`}
                  action={{ label: "Nueva suscripción", onClick: handleNew }}
                />
              ) : (
                subscriptions.map((sub) => (
                  <Card key={sub.id}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">{sub.plan}</CardTitle>
                      <CardDescription>
                        <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                          {sub.status === "active" ? "Activa" : sub.status === "cancelled" ? "Cancelada" : "Vencida"}
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
        </>
      )}
    </div>
  );
}
