import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const roleConfig = ROLE_PERMISSIONS[session.user.role as keyof typeof ROLE_PERMISSIONS];
    const dashboardUrl = session.user.dashboardUrl || roleConfig?.dashboardUrl || "/dashboard";
    redirect(dashboardUrl);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue-dark to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-blue rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">B</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Nexus CRM</h1>
            <p className="text-gray-600">Sign in to your Bowman Bathrooms account</p>
          </div>

          <SignInForm />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need access? Contact your system administrator
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-white/70 text-sm">
            © 2025 Bowman Bathrooms. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
