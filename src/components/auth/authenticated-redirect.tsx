"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

interface User {
  id: string;
  role: string;
  dashboardUrl?: string;
}

interface AuthenticatedRedirectProps {
  user: User;
}

export function AuthenticatedRedirect({ user }: AuthenticatedRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    // Get the appropriate dashboard URL for the user's role
    const roleConfig = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];
    const dashboardUrl = user.dashboardUrl || roleConfig?.dashboardUrl || "/dashboard";
    
    router.replace(dashboardUrl);
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
