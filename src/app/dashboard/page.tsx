import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Redirect to role-specific dashboard
  const roleConfig = ROLE_PERMISSIONS[session.user.role];
  if (roleConfig?.dashboardUrl && roleConfig.dashboardUrl !== "/dashboard") {
    redirect(roleConfig.dashboardUrl);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Nexus CRM
        </h1>
        <p className="text-gray-600">
          You are signed in as {session.user.name} ({session.user.role.replace('_', ' ')})
        </p>
        {session.user.showroom && (
          <p className="text-gray-600 mt-2">
            Location: {session.user.showroom.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
          <p className="text-gray-600">
            Navigate using the sidebar to access your role-specific features and tools.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
          <p className="text-gray-600">
            Common tasks and shortcuts will appear here based on your role and current projects.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
          <p className="text-gray-600">
            Important updates and alerts will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}
