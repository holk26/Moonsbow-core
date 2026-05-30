"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TenantResponse } from "@/lib/types";

const tenantSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  slug: z.string().min(1, "El slug es requerido")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .max(50, "Máximo 50 caracteres"),
  plan: z.string().min(1, "El plan es requerido"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type TenantForm = z.infer<typeof tenantSchema>;

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TenantResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { name: "", slug: "", plan: "free", description: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(),
  });

  const createMutation = useMutation({
    mutationFn: api.createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant creado correctamente");
      setOpen(false);
      reset({ name: "", slug: "", plan: "free", description: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al crear tenant");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateTenant>[1] }) =>
      api.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant actualizado correctamente");
      setOpen(false);
      setEditing(null);
      reset({ name: "", slug: "", plan: "free", description: "" });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al actualizar tenant");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant eliminado correctamente");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al eliminar tenant");
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
      plan: tenant.plan,
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
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground">Gestiona las organizaciones de la plataforma</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Tenant" : "Crear Tenant"}</DialogTitle>
              <DialogDescription>
                {editing ? "Modifica los datos del tenant" : "Completa los datos para crear un nuevo tenant"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...register("slug")}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Input
                  id="plan"
                  {...register("plan")}
                />
                {errors.plan && (
                  <p className="text-sm text-red-500">{errors.plan.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {editing ? "Guardar cambios" : "Crear tenant"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay tenants registrados
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
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
                        onClick={() => deleteMutation.mutate(tenant.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
