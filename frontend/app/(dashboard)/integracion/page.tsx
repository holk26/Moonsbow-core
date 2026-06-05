"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, Check, ArrowRight } from "lucide-react";

function generateTsSdk(apiKey: string, baseUrl: string): string {
  return [
    'import { createHmac } from "crypto";',
    "",
    `const API_BASE = "${baseUrl}";`,
    "",
    "class MoonsbowClient {",
    `  private apiKey = "${apiKey}";`,
    "",
    "  private headers(): Record<string, string> {",
    "    return {",
    '      "Content-Type": "application/json",',
    '      "X-API-Key": this.apiKey,',
    "    };",
    "  }",
    "",
    "  async request<T>(path: string, options: RequestInit = {}): Promise<T> {",
    '    const res = await fetch(`${API_BASE}${path}`, {',
    "      ...options,",
    "      headers: { ...this.headers(), ...(options.headers as Record<string, string> || {}) },",
    "    });",
    '    if (!res.ok) throw new Error(`HTTP ${res.status}`);',
    "    if (res.status === 204) return undefined as T;",
    "    return res.json() as Promise<T>;",
    "  }",
    "",
    '  createWebhook = (data: { event_types: string[]; url: string }) =>',
    '    this.request("/api/v1/webhooks/", { method: "POST", body: JSON.stringify(data) });',
    "",
    '  listWebhooks = () => this.request("/api/v1/webhooks/");',
    "",
    "  deleteWebhook = (id: string) =>",
    '    this.request(`/api/v1/webhooks/${id}`, { method: "DELETE" });',
    "}",
    "",
    "export function verifyWebhook(payload: string, signature: string, secret: string): boolean {",
    '  const expected = createHmac("sha256", secret).update(payload).digest("hex");',
    '  return expected === signature.replace("sha256=", "");',
    "}",
    "",
    "// Usage",
    "async function main() {",
    "  const client = new MoonsbowClient();",
    "  const sub = await client.createWebhook({",
    '    event_types: ["user.created", "subscription.updated"],',
    '    url: "https://your-service.com/webhooks",',
    "  });",
    '  console.log("Webhook secret:", sub.secret);',
    "}",
  ].join("\n");
}

function generatePySdk(apiKey: string, baseUrl: string): string {
  return [
    "import httpx",
    "import hmac",
    "import hashlib",
    "",
    `API_BASE = "${baseUrl}"`,
    `API_KEY = "${apiKey}"`,
    "",
    "class MoonsbowClient:",
    "    def __init__(self):",
    "        self.base_url = API_BASE",
    "        self.api_key = API_KEY",
    "",
    "    def _headers(self) -> dict[str, str]:",
    "        return {",
    '            "Content-Type": "application/json",',
    '            "X-API-Key": self.api_key,',
    "        }",
    "",
    "    async def request(self, method: str, path: str, **kwargs):",
    "        async with httpx.AsyncClient() as client:",
    "            res = await client.request(",
    "                method,",
    '                f"{self.base_url}{path}",',
    "                headers={**self._headers(), **kwargs.pop('headers', {})},",
    "                **kwargs,",
    "            )",
    "            res.raise_for_status()",
    "            return None if res.status_code == 204 else res.json()",
    "",
    '    async def create_webhook(self, event_types: list[str], url: str):',
    '        return await self.request("POST", "/api/v1/webhooks/", json={"event_types": event_types, "url": url})',
    "",
    "    async def list_webhooks(self):",
    '        return await self.request("GET", "/api/v1/webhooks/")',
    "",
    "    async def delete_webhook(self, id: str):",
    '        return await self.request("DELETE", f"/api/v1/webhooks/{id}")',
    "",
    "",
    "def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:",
    '    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()',
    '    return hmac.compare_digest(expected, signature.removeprefix("sha256="))',
    "",
    "",
    "# Usage",
    "async def main():",
    "    client = MoonsbowClient()",
    "    sub = await client.create_webhook(",
    '        event_types=["user.created", "subscription.updated"],',
    '        url="https://your-service.com/webhooks",',
    "    )",
    '    print("Webhook secret:", sub["secret"])',
  ].join("\n");
}

export default function IntegracionPage() {
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [language, setLanguage] = useState<"ts" | "py">("ts");
  const [syncLang, setSyncLang] = useState<"ts" | "py">("ts");
  const [activeTab, setActiveTab] = useState("sdk");
  const [copied, setCopied] = useState(false);

  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookUrlError, setWebhookUrlError] = useState("");

  const predefinedEvents = [
    { value: "user.created", label: "Usuario creado" },
    { value: "user.updated", label: "Usuario actualizado" },
    { value: "subscription.updated", label: "Suscripción actualizada" },
    { value: "subscription.cancelled", label: "Suscripción cancelada" },
    { value: "payment.succeeded", label: "Pago exitoso" },
    { value: "payment.failed", label: "Pago fallido" },
  ];

  function toggleEventType(value: string) {
    setSelectedEventTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function validateWebhookUrl(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  const queryClient = useQueryClient();

  const { data: apps, isLoading: appsLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: () => api.listApps(1, 100),
  });

  const selectedApp = apps?.find((a) => a.id === selectedAppId);

  const { data: webhooks, isLoading: webhooksLoading } = useQuery({
    queryKey: ["webhooks", selectedAppId],
    queryFn: () => {
      if (!selectedApp) throw new Error("No app selected");
      return api.listWebhooks(selectedApp.api_key);
    },
    enabled: !!selectedAppId && activeTab === "webhooks",
  });

  const createWebhookMutation = useMutation({
    mutationFn: () => {
      if (!selectedApp) throw new Error("No app selected");
      if (!validateWebhookUrl(webhookUrl)) {
        throw new Error("La URL del webhook no es válida");
      }
      return api.createWebhook(selectedApp.api_key, {
        event_types: selectedEventTypes,
        url: webhookUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", selectedAppId] });
      toast.success("Webhook creado");
      setSelectedEventTypes([]);
      setWebhookUrl("");
      setWebhookUrlError("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => {
      if (!selectedApp) throw new Error("No app selected");
      return api.deleteWebhook(selectedApp.api_key, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", selectedAppId] });
      toast.success("Webhook eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copiado al portapapeles");
  };

  const generatedCode = selectedApp
    ? language === "ts"
      ? generateTsSdk(selectedApp.api_key, API_BASE)
      : generatePySdk(selectedApp.api_key, API_BASE)
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Centro de integración</h1>
        <p className="text-muted-foreground">
          Genera código SDK, configura webhooks y consulta la documentación de la API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecciona una aplicación</CardTitle>
          <CardDescription>
            Elige la app para la que quieres generar código o configurar webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appsLoading ? (
            <p>Cargando apps...</p>
          ) : apps && apps.length > 0 ? (
            <Select value={selectedAppId} onValueChange={(v) => v && setSelectedAppId(v)}>
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder="Selecciona una app" />
              </SelectTrigger>
              <SelectContent>
                {apps.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No tienes apps registradas.</p>
              <Button asChild>
                <Link href="/apps/">
                  Crear nueva app <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedApp && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sdk">SDK</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="docs">Documentación</TabsTrigger>
            <TabsTrigger value="autonomia">Autonomía</TabsTrigger>
          </TabsList>

          <TabsContent value="sdk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Código SDK</CardTitle>
                <CardDescription>
                  Cliente listo para usar con la API key de <strong>{selectedApp.name}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={language === "ts" ? "default" : "outline"}
                    onClick={() => setLanguage("ts")}
                  >
                    TypeScript
                  </Button>
                  <Button
                    variant={language === "py" ? "default" : "outline"}
                    onClick={() => setLanguage("py")}
                  >
                    Python
                  </Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-[500px] font-mono">
                    <code>{generatedCode}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(generatedCode)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Suscripciones de webhook</CardTitle>
                <CardDescription>
                  Gestiona las suscripciones de <strong>{selectedApp.name}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Eventos a suscribir *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {predefinedEvents.map((evt) => (
                      <label
                        key={evt.value}
                        className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEventTypes.includes(evt.value)}
                          onChange={() => toggleEventType(evt.value)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm">{evt.label}</span>
                        <code className="ml-auto text-xs text-muted-foreground">{evt.value}</code>
                      </label>
                    ))}
                  </div>
                  {selectedEventTypes.length === 0 && (
                    <p className="text-sm text-muted-foreground">Selecciona al menos un evento.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>URL del webhook *</Label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value);
                      if (e.target.value && !validateWebhookUrl(e.target.value)) {
                        setWebhookUrlError("Debe ser una URL válida (https://...)");
                      } else {
                        setWebhookUrlError("");
                      }
                    }}
                    placeholder="https://tu-servicio.com/webhooks"
                  />
                  {webhookUrlError && (
                    <p className="text-sm text-red-500">{webhookUrlError}</p>
                  )}
                </div>
                <Button
                  onClick={() => createWebhookMutation.mutate()}
                  disabled={
                    createWebhookMutation.isPending || selectedEventTypes.length === 0 || !webhookUrl || !!webhookUrlError
                  }
                >
                  Crear suscripción
                </Button>

                {webhooksLoading ? (
                  <p>Cargando webhooks...</p>
                ) : webhooks && webhooks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Eventos</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Secreto</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((wh) => (
                        <TableRow key={wh.id}>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {wh.event_types.map((et) => (
                                <Badge key={et} variant="secondary">
                                  {et}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{wh.url}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-1 rounded">
                                {wh.secret.slice(0, 8)}...
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(wh.secret)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteWebhookMutation.mutate(wh.id)}
                              disabled={deleteWebhookMutation.isPending}
                            >
                              Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay suscripciones activas.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentación rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Autenticación</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>JWT Bearer</strong> — Para usuarios humanos. Obtén token en{" "}
                      <code>POST /api/v1/auth/login</code> y envíalo en{" "}
                      <code>Authorization: Bearer {"<token>"}</code>.
                    </p>
                    <p>
                      <strong>API Key</strong> — Para servicios. Usa el header{" "}
                      <code>X-API-Key: {selectedApp.api_key.slice(0, 8)}...</code>
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Endpoints principales</h3>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Método</TableHead>
                          <TableHead>Ruta</TableHead>
                          <TableHead>Auth</TableHead>
                          <TableHead>Descripción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>POST</TableCell>
                          <TableCell>/api/v1/auth/login</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>Iniciar sesión</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>POST</TableCell>
                          <TableCell>/api/v1/apps/</TableCell>
                          <TableCell>JWT</TableCell>
                          <TableCell>Crear app</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>POST</TableCell>
                          <TableCell>/api/v1/webhooks/</TableCell>
                          <TableCell>API Key</TableCell>
                          <TableCell>Suscribirse a eventos</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>POST</TableCell>
                          <TableCell>/api/v1/billing/subscriptions</TableCell>
                          <TableCell>JWT</TableCell>
                          <TableCell>Crear suscripción</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>POST</TableCell>
                          <TableCell>/api/v1/events/</TableCell>
                          <TableCell>JWT</TableCell>
                          <TableCell>Publicar evento</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Verificación de webhooks</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Moonsbow firma cada webhook con HMAC-SHA256. El header es{" "}
                    <code>X-Webhook-Signature: sha256={"<hmac>"}</code>.
                  </p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                    <code>{`import hmac, hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature.removeprefix("sha256="))`}</code>
                  </pre>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Códigos de error</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex gap-2 items-center">
                      <Badge variant="destructive">401</Badge>
                      <span>Token expirado o API key inválida</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="destructive">403</Badge>
                      <span>App inactiva o sin permisos</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="destructive">409</Badge>
                      <span>Email o slug duplicado</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="destructive">422</Badge>
                      <span>Error de validación de campos</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="autonomia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Arquitectura Hub-and-Spoke</CardTitle>
                <CardDescription>
                  Tu app es soberana. Moonsbow empuja cambios; tú no necesitas preguntar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Moonsbow es la fuente de verdad para escrituras (registro, cambio de plan, billing).</li>
                  <li>Tu app mantiene réplicas locales de usuarios, tenants y suscripciones.</li>
                  <li>Moonsbow envía webhooks de sincronización cuando los datos cambian.</li>
                  <li>El JWT incluye claims de tenant (<code>tenant_id</code>, <code>tenant_slug</code>, <code>tenant_plan</code>) para validación offline.</li>
                  <li>99% de las consultas diarias se resuelven localmente (2ms, no 200ms).</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Esquema de base de datos local</CardTitle>
                <CardDescription>
                  Crea estas tablas en la base de datos de tu app para mantener réplicas locales.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-[400px] font-mono">
                    <code>{`-- Tablas locales que cada app debe tener

CREATE TABLE moonsbow_users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    tenant_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE moonsbow_tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moonsbow_tenants_slug ON moonsbow_tenants(slug);

CREATE TABLE moonsbow_subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moonsbow_subscriptions_tenant ON moonsbow_subscriptions(tenant_id);`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(`CREATE TABLE moonsbow_users (id UUID PRIMARY KEY, email VARCHAR(255) NOT NULL, full_name VARCHAR(255), tenant_id UUID, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, synced_at TIMESTAMPTZ DEFAULT NOW()); CREATE TABLE moonsbow_tenants (id UUID PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, plan VARCHAR(50) NOT NULL, description TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, synced_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX idx_moonsbow_tenants_slug ON moonsbow_tenants(slug); CREATE TABLE moonsbow_subscriptions (id UUID PRIMARY KEY, tenant_id UUID NOT NULL, plan VARCHAR(50) NOT NULL, status VARCHAR(50) NOT NULL, started_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, synced_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX idx_moonsbow_subscriptions_tenant ON moonsbow_subscriptions(tenant_id);`)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recibir sync webhooks</CardTitle>
                <CardDescription>
                  Implementa un endpoint que reciba las sincronizaciones de Moonsbow y actualice tus tablas locales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={syncLang === "ts" ? "default" : "outline"} onClick={() => setSyncLang("ts")}>TypeScript</Button>
                  <Button variant={syncLang === "py" ? "default" : "outline"} onClick={() => setSyncLang("py")}>Python</Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-[500px] font-mono">
                    <code>{syncLang === "ts" ? `// Express — POST /webhooks/moonsbow-sync
import crypto from "crypto";

app.post("/webhooks/moonsbow-sync", async (req, res) => {
  const signature = req.headers["x-sync-signature"] as string;
  const apiKey = process.env.MOONSBOW_API_KEY;

  const expected = crypto
    .createHmac("sha256", apiKey)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (!crypto.timingSafeEqual(
    Buffer.from(signature.replace("sha256=", "")),
    Buffer.from(expected)
  )) {
    return res.status(401).send("Invalid signature");
  }

  const { event_type, payload } = req.body;

  switch (event_type) {
    case "sync.user.created":
      await db.query(
        \`INSERT INTO moonsbow_users (id, email, full_name, tenant_id, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING\`,
        [payload.id, payload.email, payload.full_name, payload.tenant_id, payload.is_active, payload.created_at]
      );
      break;

    case "sync.tenant.updated":
      await db.query(
        \`UPDATE moonsbow_tenants SET name = $1, slug = $2, plan = $3, is_active = $4, updated_at = $5
         WHERE id = $6\`,
        [payload.name, payload.slug, payload.plan, payload.is_active, payload.updated_at, payload.id]
      );
      break;

    case "sync.subscription.created":
      await db.query(
        \`INSERT INTO moonsbow_subscriptions (id, tenant_id, plan, status, started_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING\`,
        [payload.id, payload.tenant_id, payload.plan, payload.status, payload.started_at, payload.created_at]
      );
      break;
  }

  res.sendStatus(200);
});` : `# FastAPI — POST /webhooks/moonsbow-sync
import hmac
import hashlib
import json
import os
from fastapi import Request, HTTPException

@app.post("/webhooks/moonsbow-sync")
async def moonsbow_sync(request: Request):
    body = await request.body()
    signature = request.headers.get("x-sync-signature", "")
    api_key = os.environ["MOONSBOW_API_KEY"]

    expected = hmac.new(api_key.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature.replace("sha256=", "")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = json.loads(body)
    event_type = data["event_type"]
    payload = data["payload"]

    if event_type == "sync.user.created":
        await db.execute(
            """INSERT INTO moonsbow_users (id, email, full_name, tenant_id, is_active, created_at)
               VALUES (:id, :email, :full_name, :tenant_id, :is_active, :created_at)
               ON CONFLICT (id) DO NOTHING""",
            payload,
        )
    elif event_type == "sync.tenant.updated":
        await db.execute(
            """UPDATE moonsbow_tenants
               SET name = :name, slug = :slug, plan = :plan, is_active = :is_active, updated_at = :updated_at
               WHERE id = :id""",
            payload,
        )
    elif event_type == "sync.subscription.created":
        await db.execute(
            """INSERT INTO moonsbow_subscriptions (id, tenant_id, plan, status, started_at, created_at)
               VALUES (:id, :tenant_id, :plan, :status, :started_at, :created_at)
               ON CONFLICT (id) DO NOTHING""",
            payload,
        )

    return {"status": "ok"}`}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(syncLang === "ts" ? "// See TypeScript sync webhook code above" : "# See Python sync webhook code above")}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validar JWT offline</CardTitle>
                <CardDescription>
                  El JWT que Moonsbow firma contiene claims del tenant. Tu app puede validarlo localmente sin llamar a la API.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={syncLang === "ts" ? "default" : "outline"} onClick={() => setSyncLang("ts")}>TypeScript</Button>
                  <Button variant={syncLang === "py" ? "default" : "outline"} onClick={() => setSyncLang("py")}>Python</Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-[400px] font-mono">
                    <code>{syncLang === "ts" ? `import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.MOONSBOW_SECRET_KEY);

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
  return {
    userId: payload.sub as string,
    tenantId: payload.tenant_id as string | undefined,
    tenantSlug: payload.tenant_slug as string | undefined,
    tenantPlan: payload.tenant_plan as string | undefined,
  };
}

// Usage
const { userId, tenantPlan } = await verifyToken(
  req.headers.authorization!.replace("Bearer ", "")
);
if (tenantPlan !== "pro") {
  throw new Error("Pro plan required");
}` : `import jwt
import os
from jwt.exceptions import InvalidTokenError
from fastapi import HTTPException

SECRET = os.environ["MOONSBOW_SECRET_KEY"]

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        return {
            "user_id": payload["sub"],
            "tenant_id": payload.get("tenant_id"),
            "tenant_slug": payload.get("tenant_slug"),
            "tenant_plan": payload.get("tenant_plan"),
        }
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Usage
claims = verify_token(authorization.replace("Bearer ", ""))
if claims["tenant_plan"] != "pro":
    raise HTTPException(status_code=403, detail="Pro plan required")`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eventos de sincronización</CardTitle>
                <CardDescription>
                  Lista completa de eventos que Moonsbow envía a tu <code>sync_url</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Cuándo se dispara</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><code>sync.user.created</code></TableCell>
                      <TableCell>Al registrar un nuevo usuario</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>sync.tenant.created</code></TableCell>
                      <TableCell>Al crear una organización</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>sync.tenant.updated</code></TableCell>
                      <TableCell>Al cambiar plan o datos de una organización</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>sync.subscription.created</code></TableCell>
                      <TableCell>Al crear una suscripción</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>sync.subscription.updated</code></TableCell>
                      <TableCell>Al cambiar estado o plan de una suscripción</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checklist de implementación</CardTitle>
                <CardDescription>
                  Sigue estos pasos para que tu app sea 100% autónoma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Crear tablas moonsbow_users, moonsbow_tenants, moonsbow_subscriptions en tu base de datos",
                    "Configurar sync_url en tu app (desde el formulario de Apps arriba)",
                    "Implementar endpoint /webhooks/moonsbow-sync para recibir sincronizaciones",
                    "Guardar MOONSBOW_SECRET_KEY en variables de entorno para validar JWT offline",
                    "Reemplazar consultas a /api/v1/tenants/ por lecturas locales",
                    "Monitorear logs de sincronización",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">{i + 1}</span>
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
