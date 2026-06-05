"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TenantResponse } from "@/lib/types";

const tenantSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  slug: z.string().min(1, "El slug es requerido")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .max(50, "Máximo 50 caracteres"),
  plan: z.enum(["free", "pro", "enterprise"], { message: "Selecciona un plan válido" }),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type TenantForm = z.infer<typeof tenantSchema>;

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

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TenantResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { name: "", slug: "", plan: "free", description: "" },
  });

  const nameValue = watch("name");

  const { data, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(),
  });

  const createMutation = useMutation({
    mutationFn: api.createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Organización creada correctamente");
      setOpen(false);
      reset({ name: "", slug: "", plan: "free", description: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al crear organización");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateTenant>[1] }) =>
      api.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Organización actualizada correctamente");
      setOpen(false);
      setEditing(null);
      reset({ name: "", slug: "", plan: "free", description: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al actualizar organización");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Organización eliminada correctamente");
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al eliminar organización");
    },
  });

  const onSubmit = (formData: TenantForm) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tenant: TenantResponse) => {
    setEditing(tenant);
    reset({
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan as "free" | "pro" | "enterprise",
      description: tenant.description || "",
    });
    setOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    reset({ name: "", slug: "", plan: "free", description: "" });
    setOpen(true);
  };

  const tenants = data?.items ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organizaciones</h2>
          <p className="text-muted-foreground">Gestiona las organizaciones de la plataforma</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva organización
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar organización" : "Crear organización"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Modifica los datos de la organización"
                  : "Crea una nueva organización para agrupar usuarios y aplicaciones"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Acme Corporation"
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
                <Input id="slug" placeholder="mi-organizacion" {...register("slug")} />
                <p className="text-xs text-muted-foreground">
                  URL amigable. Solo minúsculas, números y guiones. Se genera automáticamente desde el nombre.
                </p>
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plan *</Label>
                <Select
                  value={watch("plan")}
                  onValueChange={(v) => setValue("plan", v as "free" | "pro" | "enterprise", { shouldValidate: true })}
                >
                  <SelectTrigger id="plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free — para pruebas y desarrollo</SelectItem>
                    <SelectItem value="pro">Pro — para producción con soporte</SelectItem>
                    <SelectItem value="enterprise">Enterprise — personalizado y SLA</SelectItem>
                  </SelectContent>
                </Select>
                {errors.plan && (
                  <p className="text-sm text-red-500">{errors.plan.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el propósito de esta organización..."
                  rows={3}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {editing ? "Guardar cambios" : "Crear organización"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="rounded-md border p-10 text-center text-muted-foreground">Cargando...</div>
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aún no tienes organizaciones"
          description="Las organizaciones agrupan usuarios, aplicaciones y datos. Crea la primera para empezar a usar Moonsbow Core."
          action={{ label: "Crear organización", onClick: handleNew }}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tenant.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenant.is_active ? "default" : "secondary"}>
                      {tenant.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tenant)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(tenant)}
                        disabled={deleteMutation.isPending}
                      >
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
        title="¿Eliminar organización?"
        description={`¿Estás seguro de que quieres eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
