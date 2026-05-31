"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Bell } from "lucide-react";

interface Notification {
  id: string;
  user_id: string;
  tenant_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tenantId] = useState(user?.tenant_id || "");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id, tenantId],
    queryFn: () =>
      user?.id && tenantId
        ? api.listNotifications(user.id, tenantId)
        : Promise.resolve({ items: [], total: 0, page: 1, size: 20, pages: 0 }),
    enabled: !!user?.id && !!tenantId,
  });

  const markRead = useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications: Notification[] = ((data?.items || []) as unknown as Notification[]) || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notificaciones</h2>
        <p className="text-muted-foreground">Centro de notificaciones del sistema</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Bell className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tienes notificaciones</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card key={notif.id} className={notif.is_read ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{notif.title}</CardTitle>
                  {!notif.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead.mutate(notif.id)}
                      disabled={markRead.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Marcar leída
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {new Date(notif.created_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{notif.message}</p>
                {!notif.is_read && <Badge className="mt-2">Nueva</Badge>}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
