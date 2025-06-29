import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import Link from "next/link";
import {
  Users,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

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

  // Get current time for greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Mock data for demonstration - in production this would come from API
  const mockStats = {
    totalClients: 247,
    activeProjects: 34,
    pendingTasks: 12,
    monthlyTarget: 85,
  };

  const recentActivity = [
    { type: "client", action: "New client registered", name: "Sarah Johnson", time: "2 hours ago" },
    { type: "project", action: "Project updated", name: "Bathroom Renovation #BR-2024-156", time: "4 hours ago" },
    { type: "task", action: "Survey completed", name: "Kitchen Design Project", time: "1 day ago" },
  ];

  const quickActions = [
    { name: "Add New Client", href: "/dashboard/clients/new", icon: Users, color: "bg-brand-blue" },
    { name: "Create Project", href: "/dashboard/projects/new", icon: FileText, color: "bg-brand-gold" },
    { name: "Schedule Appointment", href: "/dashboard/calendar", icon: Calendar, color: "bg-green-500" },
    { name: "View Reports", href: "/dashboard/reports", icon: BarChart3, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-light rounded-xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {greeting}, {session.user.name.split(' ')[0]}!
            </h1>
            <p className="text-brand-blue-light text-lg opacity-90">
              {session.user.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            {session.user.showroom && (
              <div className="flex items-center mt-2 text-sm opacity-80">
                <MapPin className="h-4 w-4 mr-1" />
                {session.user.showroom.name}
              </div>
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-right">
              <p className="text-sm opacity-80">Today's Date</p>
              <p className="text-xl font-semibold">
                {new Date().toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900">{mockStats.totalClients}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link 
              href="/dashboard/clients"
              className="text-sm text-brand-blue hover:text-brand-blue-dark font-medium flex items-center"
            >
              View all clients <Eye className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">{mockStats.activeProjects}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link 
              href="/dashboard/projects"
              className="text-sm text-brand-blue hover:text-brand-blue-dark font-medium flex items-center"
            >
              Manage projects <Edit className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{mockStats.pendingTasks}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Due this week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Target</p>
              <p className="text-3xl font-bold text-gray-900">{mockStats.monthlyTarget}%</p>
            </div>
            <div className="bg-brand-gold/10 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-brand-gold" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-brand-gold h-2 rounded-full transition-all duration-500" 
                style={{ width: `${mockStats.monthlyTarget}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className="group flex flex-col items-center p-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              >
                <div className={`${action.color} p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">{action.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  {activity.type === 'client' && (
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  {activity.type === 'project' && (
                    <div className="bg-green-100 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  {activity.type === 'task' && (
                    <div className="bg-orange-100 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4 text-orange-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link 
              href="/dashboard/activity" 
              className="text-sm text-brand-blue hover:text-brand-blue-dark font-medium"
            >
              View all activity →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Important Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Survey Reminder</p>
                <p className="text-sm text-blue-700">You have 3 surveys scheduled for this week</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Monthly Target</p>
                <p className="text-sm text-green-700">You're ahead of schedule - great work!</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-orange-50">
              <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">Follow-up Required</p>
                <p className="text-sm text-orange-700">2 clients need follow-up calls this week</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link 
              href="/dashboard/notifications" 
              className="text-sm text-brand-blue hover:text-brand-blue-dark font-medium"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
