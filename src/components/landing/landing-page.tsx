import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Users, BarChart3, Smartphone, CheckCircle } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue via-brand-blue-dark to-slate-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-gold rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Bowman Bathrooms</h1>
              <p className="text-brand-gold text-sm">Nexus CRM Platform</p>
            </div>
          </div>
          <Link
            href="/auth/signin"
            className="bg-white text-brand-blue px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              Enterprise CRM Platform
              <span className="block text-brand-gold">for Premium Renovations</span>
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Streamline your entire bathroom renovation workflow from initial enquiry 
              to project completion with our comprehensive, role-based CRM solution.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center bg-brand-gold text-brand-blue px-8 py-4 rounded-lg font-semibold text-lg hover:bg-brand-gold-light transition-colors"
            >
              Access Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Multi-Role Access"
              description="11 distinct user roles with specific permissions and workflows"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="13-Stage Pipeline"
              description="Comprehensive project tracking from enquiry to completion"
            />
            <FeatureCard
              icon={<Smartphone className="h-8 w-8" />}
              title="Mobile App"
              description="Dedicated installer and surveyor apps for field operations"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Enterprise Security"
              description="GDPR compliant with full audit trails and 2FA support"
            />
          </div>

          {/* Pipeline Stages */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-16">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">
              Complete Project Pipeline
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                "Enquiry",
                "Consultation",
                "Survey",
                "Design",
                "Sale",
                "Installation",
                "Completion"
              ].map((stage, index) => (
                <div key={stage} className="text-center">
                  <div className="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-brand-blue font-bold">{index + 1}</span>
                  </div>
                  <p className="text-white text-sm">{stage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">
                Everything You Need for Success
              </h3>
              <ul className="space-y-4">
                {[
                  "Multi-location franchise support",
                  "Automated workflow gating",
                  "Customer portal with payments",
                  "Real-time notifications",
                  "Comprehensive reporting",
                  "Third-party integrations"
                ].map((feature) => (
                  <li key={feature} className="flex items-center text-gray-200">
                    <CheckCircle className="h-5 w-5 text-brand-gold mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <h4 className="text-xl font-semibold text-white mb-4">User Roles</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  "Salesperson",
                  "Sales Manager",
                  "Project Manager",
                  "Install Manager",
                  "Installer",
                  "Surveyor",
                  "Admin",
                  "Director",
                  "Bookkeeper",
                  "Customer",
                  "AI Assistant"
                ].map((role) => (
                  <div key={role} className="text-gray-200 py-1">
                    • {role}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-300">
            © 2025 Bowman Bathrooms. All rights reserved. | Nexus CRM Platform
          </p>
        </div>
      </footer>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
      <div className="text-brand-gold mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-200 text-sm">{description}</p>
    </div>
  );
}
