"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Shield,
  Users,
  X,
  Building2,
  CreditCard,
  Wrench,
  MapPin,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  showroom?: {
    name: string;
    type: string;
  };
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const NAVIGATION = {
  ADMIN: [
    { name: "Dashboard", href: "/dashboard/admin", icon: Home },
    { name: "Users", href: "/dashboard/admin/users", icon: Users },
    { name: "Showrooms", href: "/dashboard/admin/showrooms", icon: Building2 },
    { name: "System Settings", href: "/dashboard/admin/settings", icon: Settings },
    { name: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
    { name: "Audit Logs", href: "/dashboard/admin/audit", icon: Shield },
  ],
  SALESPERSON: [
    { name: "Dashboard", href: "/dashboard/sales", icon: Home },
    { name: "Projects", href: "/dashboard/projects", icon: FileText },
    { name: "Clients", href: "/dashboard/clients", icon: Users },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Messages", href: "/dashboard/sales/messages", icon: MessageSquare },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  ],
  SALES_MANAGER: [
    { name: "Dashboard", href: "/dashboard/sales-management", icon: Home },
    { name: "Team Projects", href: "/dashboard/sales-management/projects", icon: FileText },
    { name: "Team Performance", href: "/dashboard/sales-management/team", icon: TrendingUp },
    { name: "Customers", href: "/dashboard/sales-management/customers", icon: Users },
    { name: "Reports", href: "/dashboard/sales-management/reports", icon: BarChart3 },
  ],
  PROJECT_MANAGER: [
    { name: "Dashboard", href: "/dashboard/projects", icon: Home },
    { name: "My Projects", href: "/dashboard/projects/list", icon: FileText },
    { name: "Schedule", href: "/dashboard/projects/schedule", icon: Calendar },
    { name: "Purchase Orders", href: "/dashboard/projects/orders", icon: Package },
    { name: "Communications", href: "/dashboard/projects/messages", icon: MessageSquare },
  ],
  INSTALL_MANAGER: [
    { name: "Dashboard", href: "/dashboard/installations", icon: Home },
    { name: "Active Jobs", href: "/dashboard/installations/jobs", icon: Wrench },
    { name: "Team Management", href: "/dashboard/installations/team", icon: Users },
    { name: "Schedule", href: "/dashboard/installations/schedule", icon: Calendar },
    { name: "Check-ins", href: "/dashboard/installations/checkins", icon: UserCheck },
  ],
  DIRECTOR: [
    { name: "Executive Dashboard", href: "/dashboard/executive", icon: Home },
    { name: "Performance", href: "/dashboard/executive/performance", icon: TrendingUp },
    { name: "Reports", href: "/dashboard/executive/reports", icon: BarChart3 },
    { name: "Analytics", href: "/dashboard/executive/analytics", icon: BarChart3 },
  ],
  BOOKKEEPER: [
    { name: "Financial Dashboard", href: "/dashboard/finance", icon: Home },
    { name: "Invoices", href: "/dashboard/finance/invoices", icon: FileText },
    { name: "Payments", href: "/dashboard/finance/payments", icon: CreditCard },
    { name: "Reports", href: "/dashboard/finance/reports", icon: BarChart3 },
  ],
  CUSTOMER: [
    { name: "My Project", href: "/portal/customer", icon: Home },
    { name: "Documents", href: "/portal/customer/documents", icon: FileText },
    { name: "Payments", href: "/portal/customer/payments", icon: CreditCard },
    { name: "Messages", href: "/portal/customer/messages", icon: MessageSquare },
  ],
} as const;

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = NAVIGATION[user.role as keyof typeof NAVIGATION] || NAVIGATION.SALESPERSON;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Nexus CRM</h1>
              <p className="text-xs text-gray-500">Bowman Bathrooms</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-brand-blue text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info in Sidebar */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          {user.showroom && (
            <div className="mt-2 text-xs text-gray-500">
              <MapPin className="inline h-3 w-3 mr-1" />
              {user.showroom.name}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                {pathname.split('/').pop()?.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
