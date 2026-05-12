"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";

interface Course {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  is_active: boolean;
}

export default function LMSPage() {
  const [tenantId, setTenantId] = useState("");

  const { data: tenants } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.listTenants(1, 100),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["courses", tenantId],
    queryFn: () => (tenantId ? api.listCourses(tenantId) : Promise.resolve({ items: [], total: 0 })),
    enabled: !!tenantId,
  });

  const courses: Course[] = ((data?.items || []) as unknown as Course[]) || [];
  const tenantList = (tenants?.items as Array<{ id: string; name: string }>) || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">LMS</h2>
        <p className="text-muted-foreground">Gestión de cursos y contenido educativo</p>
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
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay cursos para este tenant</p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>
                  <Badge variant={course.is_active ? "default" : "secondary"}>
                    {course.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {course.description && (
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                )}
                {course.instructor && (
                  <p className="text-sm">Instructor: {course.instructor}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
