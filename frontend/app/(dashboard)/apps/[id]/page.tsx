"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

export default function AppDetailPage() {
  const { id } = useParams();
  const { data: app, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: () => api.getApp(id as string),
  });

  if (isLoading) return <p>Cargando...</p>;
  if (!app) return <p>App no encontrada</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{app.name}</h1>
      <div className="rounded-lg border p-4 space-y-2">
        <p><strong>Slug:</strong> {app.slug}</p>
        <p><strong>API Key:</strong> <code className="bg-muted px-1 rounded">{app.api_key}</code></p>
        <p><strong>Activo:</strong> {app.is_active ? "Sí" : "No"}</p>
        {app.webhook_url && <p><strong>Webhook URL:</strong> {app.webhook_url}</p>}
      </div>
      <Button
        onClick={() => api.rotateAppKey(id as string).then(() => window.location.reload())}
        variant="outline"
      >
        Rotar API Key
      </Button>
    </div>
  );
}
