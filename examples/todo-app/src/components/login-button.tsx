"use client";

import { Button } from "@/components/ui/button";

export function LoginButton() {
  const handleLogin = () => {
    const coreUrl =
      process.env.NEXT_PUBLIC_MOONSBOW_CORE_URL || "http://api.localhost";
    const redirectUrl = typeof window !== "undefined" ? window.location.origin : "";
    window.location.href = `${coreUrl}/login?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <Button onClick={handleLogin} className="w-full">
      Iniciar sesión con Moonsbow
    </Button>
  );
}
