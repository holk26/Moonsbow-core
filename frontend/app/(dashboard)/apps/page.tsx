"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Copy, KeyRound, AppWindow } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { AppResponse } from "@/lib/types";

const appSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  slug: z.string().min(1, "El slug es requerido")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .max(50, "Máximo 50 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  webhook_url: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  sync_url: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
});

type AppForm = z.infer<typeof appSchema>;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

export default function AppsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppResponse | null>(null);
  const [rotateTarget, setRotateTarget] = useState<AppResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppForm>({
    resolver: zodResolver(appSchema),
    defaultValues: { name: "", slug: "", description: "", webhook_url: "", sync_url: "" },
  });

  const nameValue = watch("name");

  const { data: apps, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => api.listApps(),
  });

  const createMutation = useMutation({
    mutationFn: api.createApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      toast.success("Aplicación creada correctamente");
      setOpen(false);
      reset({ name: "", slug: "", description: "", webhook_url: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateApp>[1] }) =>
      api.updateApp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      toast.success("Aplicación actualizada");
      setOpen(false);
      setEditing(null);
      reset({ name: "", slug: "", description: "", webhook_url: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      toast.success("Aplicación eliminada");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rotateMutation = useMutation({
    mutationFn: api.rotateAppKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      toast.success("API Key rotada");
      setRotateTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (formData: AppForm) => {
    const data = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      webhook_url: formData.webhook_url || undefined,
      sync_url: formData.sync_url || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (app: AppResponse) => {
    setEditing(app);
    reset({
      name: app.name,
      slug: app.slug,
      description: app.description || "",
      webhook_url: app.webhook_url || "",
      sync_url: app.sync_url || "",
    });
    setOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    reset({ name: "", slug: "", description: "", webhook_url: "", sync_url: "" });
    setOpen(true);
  };

  const appList = apps || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aplicaciones</h1>
          <p className="text-muted-foreground">Gestiona las apps integradas con Moonsbow</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva aplicación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar aplicación" : "Nueva aplicación"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Modifica los datos de la aplicación"
                  : "Registra una nueva aplicación para obtener una API Key"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Mi App de Productos"
                  {...register("name")}
                  onBlur={() => {
                    const currentSlug = watch("slug");
                    if (!currentSlug && nameValue) {
                      setValue("slug", slugify(nameValue), { shouldValidate: true });
                    }
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" placeholder="mi-app" {...register("slug")} />
                <p className="text-xs text-muted-foreground">
                  URL amigable. Solo minúsculas, números y guiones. Se genera automáticamente desde el nombre.
                </p>
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="¿Qué hace esta aplicación?"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://tuservicio.com/webhooks"
                  {...register("webhook_url")}
                />
                {errors.webhook_url && (
                  <p className="text-sm text-red-500">{errors.webhook_url.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sync_url">URL de sincronización</Label>
                <Input
                  id="sync_url"
                  placeholder="https://tuservicio.com/sync/moonsbow"
                  {...register("sync_url")}
                />
                <p className="text-xs text-muted-foreground">
                  Moonsbow enviará eventos de sincronización aquí cuando cambien usuarios, tenants o suscripciones.
                </p>
                {errors.sync_url && (
                  <p className="text-sm text-red-500">{errors.sync_url.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="rounded-md border p-10">
          <Skeleton className="h-8 w-full" />
        </div>
      ) : appList.length === 0 ? (
        <EmptyState
          icon={AppWindow}
          title="Sin aplicaciones conectadas"
          description="Registra una app para obtener una API Key y conectar tu servicio con Moonsbow."
          action={{ label: "Registrar aplicación", onClick: handleNew }}
          secondary={{ label: "¿Qué es una API Key?", href: "/integracion/" }}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[160px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appList.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    <Link href={`/apps/${app.id}`} className="hover:underline">{app.name}</Link>
                  </TableCell>
                  <TableCell>{app.slug}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 rounded flex items-center gap-1 w-fit">
                      {app.api_key.slice(0, 8)}...
                      <button
                        onClick={() => { navigator.clipboard.writeText(app.api_key); toast.success("Copiado"); }}
                        className="hover:text-primary"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.is_active ? "default" : "secondary"}>
                      {app.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(app)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setRotateTarget(app)}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(app)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Eliminar aplicación?"
        description={`¿Estás seguro de que quieres eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      <ConfirmDialog
        open={!!rotateTarget}
        onOpenChange={(open) => !open && setRotateTarget(null)}
        title="¿Rotar API Key?"
        description={`¿Rotar la API Key de "${rotateTarget?.name}"? La key anterior dejará de funcionar inmediatamente.`}
        confirmLabel="Rotar"
        onConfirm={() => rotateTarget && rotateMutation.mutate(rotateTarget.id)}
      />
    </div>
  );
}
