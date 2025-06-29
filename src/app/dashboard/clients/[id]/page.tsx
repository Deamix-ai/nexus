"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ClientAddress {
  street: string;
  city: string;
  county: string;
  postcode: string;
}

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  stage: string;
  estimatedValue: number;
  actualValue?: number;
  enquiryDate: string;
  consultationDate?: string;
  surveyDate?: string;
  designPresentedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: ClientAddress;
  leadSource: string;
  leadSourceDetail?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  projects: Project[];
  activities: Activity[];
}

const statusColors: Record<string, string> = {
  'ACTIVE': 'bg-green-100 text-green-800',
  'PROSPECT': 'bg-blue-100 text-blue-800',
  'INACTIVE': 'bg-gray-100 text-gray-800',
  'LOST': 'bg-red-100 text-red-800',
};

const stageColors: Record<string, string> = {
  'ENQUIRY': 'bg-gray-100 text-gray-800',
  'ENGAGED_ENQUIRY': 'bg-blue-100 text-blue-800',
  'CONSULTATION_BOOKED': 'bg-indigo-100 text-indigo-800',
  'QUALIFIED_LEAD': 'bg-purple-100 text-purple-800',
  'SURVEY_COMPLETE': 'bg-yellow-100 text-yellow-800',
  'DESIGN_PRESENTED': 'bg-orange-100 text-orange-800',
  'SALE_CLIENT_COMMITS': 'bg-green-100 text-green-800',
  'DESIGN_SIGN_OFF': 'bg-teal-100 text-teal-800',
  'PAYMENT_75_PROJECT_HANDOVER': 'bg-cyan-100 text-cyan-800',
  'PROJECT_SCHEDULED': 'bg-blue-100 text-blue-800',
  'INSTALLATION_IN_PROGRESS': 'bg-green-100 text-green-800',
  'COMPLETION_SIGN_OFF': 'bg-emerald-100 text-emerald-800',
  'COMPLETED': 'bg-green-100 text-green-800',
  'LOST_NOT_PROCEEDING': 'bg-red-100 text-red-800',
};

const activityTypeIcons: Record<string, string> = {
  'CALL': '📞',
  'EMAIL': '📧',
  'MEETING': '🤝',
  'SITE_VISIT': '🏠',
  'CONSULTATION': '💬',
  'SURVEY': '📏',
  'DESIGN_REVIEW': '🎨',
  'FOLLOW_UP': '🔄',
  'OTHER': '📝'
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientId = params.id as string;

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Client not found");
          } else if (response.status === 403) {
            setError("You don't have permission to view this client");
          } else {
            setError("Failed to fetch client");
          }
          return;
        }

        const data = await response.json();
        setClient(data.client);
      } catch (err) {
        setError("Failed to fetch client");
        console.error("Error fetching client:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchClient();
    }
  }, [clientId, session]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Link
          href="/dashboard/clients"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Clients
        </Link>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Client not found</div>
        <Link
          href="/dashboard/clients"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link 
              href="/dashboard/clients"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Clients
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {client.firstName} {client.lastName}
          </h1>
          <div className="flex items-center space-x-3 mt-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[client.status] || 'bg-gray-100 text-gray-800'}`}>
              {client.status}
            </span>
            <span className="text-gray-500">
              Client since {formatDate(client.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Client
          </Link>
          <Link
            href={`/dashboard/projects/new?clientId=${client.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Project
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1">
                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-800">
                      {client.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1">
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-800">
                      {client.phone}
                    </a>
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.address.street}<br />
                    {client.address.city}<br />
                    {client.address.county}<br />
                    {client.address.postcode}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead Source</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.leadSource}
                    {client.leadSourceDetail && (
                      <span className="text-gray-500 block text-xs">{client.leadSourceDetail}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Notes</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-900">{client.notes}</p>
              </div>
            </div>
          )}

          {/* Projects */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Projects ({client.projects.length})
              </h3>
              <Link
                href={`/dashboard/projects/new?clientId=${client.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Project
              </Link>
            </div>
            <div className="px-6 py-4">
              {client.projects.length > 0 ? (
                <div className="space-y-4">
                  {client.projects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="text-lg font-medium text-blue-600 hover:text-blue-800"
                          >
                            {project.projectNumber}
                          </Link>
                          <p className="text-gray-600">{project.name}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(project.estimatedValue)}
                          </div>
                          {project.actualValue && (
                            <div className="text-sm text-gray-500">
                              Actual: {formatCurrency(project.actualValue)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stageColors[project.stage] || 'bg-gray-100 text-gray-800'}`}>
                          {project.stage.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          Created {formatDate(project.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new project for this client.</p>
                  <div className="mt-6">
                    <Link
                      href={`/dashboard/projects/new?clientId=${client.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create Project
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Activity Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="px-6 py-4">
              {client.activities.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {client.activities.map((activity, activityIdx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== client.activities.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white text-white text-sm">
                                {activityTypeIcons[activity.type] || '📝'}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                                <p className="text-sm text-gray-500">{activity.description}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  by {activity.createdBy.firstName} {activity.createdBy.lastName}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDateTime(activity.date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
                  <p className="mt-1 text-sm text-gray-500">No activities recorded for this client yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <a
                href={`tel:${client.phone}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Client
              </a>
              <a
                href={`mailto:${client.email}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Email
              </a>
              <Link
                href={`/dashboard/calendar/new?clientId=${client.id}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Schedule Meeting
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
