"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";

export default function UsersPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.is_superuser;

  const { data: usersList, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.listUsers(),
    enabled: isAdmin,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name || undefined,
      });
      setSuccess(`Usuario ${form.email} creado exitosamente`);
      setForm({ email: "", password: "", full_name: "" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  const allUsers = usersList || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
          <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nuevo usuario</DialogTitle>
                <DialogDescription>
                  Crea una cuenta de usuario para la plataforma
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre completo</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="usuario@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-500">{success}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creando..." : "Crear usuario"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 text-sm">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
          <CardDescription>Información de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {(user.full_name || user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user.full_name || "Sin nombre"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  {user.is_superuser && <Badge variant="outline">Super Admin</Badge>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Todos los usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                    </TableRow>
                  ) : allUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    allUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.is_superuser ? "outline" : "secondary"}>
                            {u.is_superuser ? "Super Admin" : "Usuario"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_active ? "default" : "secondary"}>
                            {u.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
