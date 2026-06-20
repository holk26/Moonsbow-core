"use client";

import { useEffect, useState } from "react";
import {
  generateAssistantKey,
  listAssistantKeys,
  revokeAssistantKey,
} from "@/actions/assistant-key-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, KeyRound, Loader2, RotateCcw, Trash2 } from "lucide-react";

interface KeyItem {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export function AssistantSettings() {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [name, setName] = useState("");
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const data = await listAssistantKeys();
      setKeys(data);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const result = await generateAssistantKey(name);
      setPlainKey(result.plainKey);
      setName("");
      await loadKeys();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await revokeAssistantKey(id);
      await loadKeys();
    } finally {
      setRevokingId(null);
    }
  };

  const copyLink = () => {
    if (!plainKey) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `URL: ${origin}/api/mcp\nHeader: Authorization: Bearer ${plainKey}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Conectar tu asistente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Copia el link y el header de autorización para conectar Hermes u
          OpenClaw con tus tareas.
        </p>

        <form onSubmit={handleGenerate} className="flex gap-2">
          <Input
            placeholder="Nombre del asistente (ej. Hermes)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Generar clave"
            )}
          </Button>
        </form>

        {plainKey && (
          <div className="rounded-md border bg-muted p-4 space-y-3">
            <p className="text-sm font-medium">Link generado</p>
            <div className="space-y-1 text-xs font-mono">
              <p>
                URL:{" "}
                {typeof window !== "undefined"
                  ? window.location.origin
                  : ""}
                /api/mcp
              </p>
              <p>Header: Authorization: Bearer {plainKey}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={copyLink}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copiado" : "Copiar link para Hermes"}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Claves activas</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadKeys()}
              disabled={isLoadingKeys}
              className="gap-1"
            >
              {isLoadingKeys ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Actualizar
            </Button>
          </div>
          {isLoadingKeys && keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cargando claves...</p>
          ) : (
            <ul className="space-y-2">
              {keys.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Creada {new Date(key.createdAt).toLocaleDateString()}
                      {key.revokedAt && " · Revocada"}
                      {key.lastUsedAt &&
                        ` · Último uso ${new Date(
                          key.lastUsedAt
                        ).toLocaleDateString()}`}
                    </p>
                  </div>
                  {!key.revokedAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevoke(key.id)}
                      disabled={revokingId === key.id}
                      aria-label="Revocar clave"
                    >
                      {revokingId === key.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </li>
              ))}
              {keys.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay claves generadas todavía.
                </p>
              )}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
