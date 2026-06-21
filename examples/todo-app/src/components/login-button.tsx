"use client";

import { Button } from "@/components/ui/button";

export function LoginButton() {
  const handleLogin = () => {
    const coreUrl =
      process.env.NEXT_PUBLIC_MOONSBOW_CORE_URL || "http://api.localhost";
    const callbackUrl =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";
    window.location.href = `${coreUrl}/login?redirect=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <Button onClick={handleLogin} className="w-full">
      Iniciar sesión con Moonsbow
    </Button>
  );
}
