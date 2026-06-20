"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Dialog = ({ children, open, onOpenChange, ...props }: DialogProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" {...props}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>
    {children}
  </div>
);

const DialogTitle = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h2>
);

const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}>
    {children}
  </div>
);

export { Dialog, DialogHeader, DialogTitle, DialogFooter };
