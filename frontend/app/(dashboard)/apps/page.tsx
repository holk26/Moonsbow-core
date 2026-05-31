"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppsPage() {
  const { data: apps, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => api.listApps().then((r) => r.items),
  });

  if (isLoading) return <p>Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aplicaciones</h1>
        <Button asChild>
          <Link href="/apps/new">Nueva App</Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {apps?.map((app: any) => (
          <div key={app.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{app.name}</h2>
                <p className="text-sm text-muted-foreground">{app.slug}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/apps/${app.id}`}>Ver</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
