"use client";

import { useEffect } from "react";

export default function RegisterPage() {
  useEffect(() => {
    window.location.href = "/login/";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}
