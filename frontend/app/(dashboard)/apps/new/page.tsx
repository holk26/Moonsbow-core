"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function NewAppPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.post("/apps", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      router.push("/apps");
    },
  });

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Nueva Aplicación</h1>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>
      <Button
        onClick={() => mutation.mutate({ name, slug })}
        disabled={!name || !slug}
      >
        Crear
      </Button>
    </div>
  );
}
