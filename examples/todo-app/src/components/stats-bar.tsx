"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/actions/todo-actions";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle, ListTodo } from "lucide-react";

export function StatsBar() {
  const [stats, setStats] = useState({ total: 0, pending: 0, done: 0, urgent: 0 });

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const items = [
    { label: "Total", value: stats.total, icon: ListTodo },
    { label: "Pendientes", value: stats.pending, icon: Clock },
    { label: "Completadas", value: stats.done, icon: CheckSquare },
    { label: "Urgentes", value: stats.urgent, icon: AlertCircle },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
            <item.icon className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
