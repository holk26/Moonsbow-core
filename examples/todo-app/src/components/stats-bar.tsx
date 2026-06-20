"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/actions/todo-actions";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle, ListTodo } from "lucide-react";

interface StatsBarProps {
  stats?: { total: number; pending: number; in_progress: number; done: number; urgent: number };
}

export function StatsBar({ stats: propStats }: StatsBarProps) {
  const [internalStats, setInternalStats] = useState({ total: 0, pending: 0, in_progress: 0, done: 0, urgent: 0 });

  useEffect(() => {
    if (!propStats) {
      getStats().then(setInternalStats);
    }
  }, [propStats]);

  const stats = propStats ?? internalStats;

  const items = [
    { label: "Total", value: stats.total, icon: ListTodo },
    { label: "Pendientes", value: stats.pending, icon: Clock },
    { label: "Completadas", value: stats.done, icon: CheckSquare },
    { label: "Urgentes", value: stats.urgent, icon: AlertCircle },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center justify-between p-3 md:p-4">
            <div>
              <p className="text-xl font-bold md:text-2xl">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
            <item.icon className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" aria-hidden="true" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
