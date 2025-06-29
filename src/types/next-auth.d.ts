import "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      showroomId?: string;
      showroom?: {
        id: string;
        name: string;
        type: string;
      };
      permissions: Record<string, any>;
      twoFactorEnabled: boolean;
      dashboardUrl: string;
      avatar?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    showroomId?: string;
    showroom?: {
      id: string;
      name: string;
      type: string;
    };
    permissions: Record<string, any>;
    twoFactorEnabled: boolean;
    dashboardUrl?: string;
    avatar?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    showroomId?: string;
    showroom?: {
      id: string;
      name: string;
      type: string;
    };
    permissions: Record<string, any>;
    twoFactorEnabled: boolean;
    dashboardUrl: string;
  }
}
