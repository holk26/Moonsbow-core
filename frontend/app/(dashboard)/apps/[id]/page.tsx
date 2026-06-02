"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useParams, useRouter } from "next/navigation";
import { Copy, ArrowLeft, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AppDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const appId = id as string;

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", appId],
    queryFn: () => api.getApp(appId),
  });

  const [form, setForm] = useState({ name: "", description: "", webhook_url: "" });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.updateApp>[1]) => api.updateApp(appId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", appId] });
      toast.success("App actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rotateMutation = useMutation({
    mutationFn: () => api.rotateAppKey(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", appId] });
      toast.success("API Key rotada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteApp(appId),
    onSuccess: () => {
      toast.success("App eliminada");
      router.push("/apps");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <p>Cargando...</p>;
  if (!app) return <p>App no encontrada</p>;

  const isDirty = form.name !== app.name || form.description !== (app.description || "") || form.webhook_url !== (app.webhook_url || "");

  return (
    <div className="space-y-4 max-w-2xl">
      <Button variant="ghost" onClick={() => router.push("/apps")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{app.name}</h1>
        <Badge variant={app.is_active ? "default" : "secondary"}>
          {app.is_active ? "Activa" : "Inactiva"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Slug</Label>
            <p className="text-sm text-muted-foreground">{app.slug}</p>
          </div>
          <div>
            <Label>API Key</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-sm">{app.api_key}</code>
              <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(app.api_key); toast.success("Copiado"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" defaultValue={app.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Descripción</Label>
            <Input id="desc" defaultValue={app.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook URL</Label>
            <Input id="webhook" defaultValue={app.webhook_url || ""} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={app.is_active} onCheckedChange={(v) => updateMutation.mutate({ is_active: v })} />
            <Label>Activa</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => updateMutation.mutate({
              name: form.name || app.name,
              description: form.description,
              webhook_url: form.webhook_url,
            })} disabled={!isDirty && !updateMutation.isPending}>
              Guardar cambios
            </Button>
            <Button variant="outline" onClick={() => rotateMutation.mutate()} disabled={rotateMutation.isPending}>
              <KeyRound className="mr-2 h-4 w-4" />
              Rotar API Key
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona peligrosa</CardTitle>
          <CardDescription>Acciones irreversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
