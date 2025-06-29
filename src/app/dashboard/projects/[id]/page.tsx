"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import StageProgression from "@/components/projects/stage-progression";
import ProjectDocuments from "@/components/projects/project-documents";
import ProjectCommunications from "@/components/projects/project-communications";
import ActivityTimeline from "@/components/shared/activity-timeline";

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  stage: string;
  priority: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: {
    street: string;
    city: string;
    county: string;
    postcode: string;
  };
  leadSource: string;
  leadSourceDetail?: string;
  description?: string;
  estimatedValue?: number;
  actualValue?: number;
  margin?: number;
  enquiryDate: string;
  consultationDate?: string;
  surveyDate?: string;
  designPresentedDate?: string;
  saleDate?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  tags: string[];
  assignedUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  showroom: {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

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

const priorityColors: Record<string, string> = {
  'LOW': 'bg-gray-100 text-gray-800',
  'MEDIUM': 'bg-blue-100 text-blue-800',
  'HIGH': 'bg-orange-100 text-orange-800',
  'URGENT': 'bg-red-100 text-red-800',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Project not found");
          } else if (response.status === 403) {
            setError("You don't have permission to view this project");
          } else {
            setError("Failed to fetch project");
          }
          return;
        }

        const data = await response.json();
        setProject(data.project);
      } catch (err) {
        setError("Failed to fetch project");
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchProject();
    }
  }, [projectId, session]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Not set";
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
          href="/dashboard/projects"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Project not found</div>
        <Link
          href="/dashboard/projects"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Projects
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
              href="/dashboard/projects"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Projects
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{project.projectNumber}</h1>
          <p className="text-gray-600">{project.name}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/projects/${project.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Project
          </Link>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Edit Project
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Move to Next Stage
          </button>
        </div>
      </div>

      {/* Status and Key Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Current Stage</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stageColors[project.stage] || 'bg-gray-100 text-gray-800'}`}>
                  {project.stage.replace(/_/g, ' ')}
                </span>
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Estimated Value</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(project.estimatedValue)}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {project.assignedUser.firstName} {project.assignedUser.lastName}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[project.priority] || 'bg-gray-100 text-gray-800'}`}>
                  {project.priority}
                </span>
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progression */}
      <StageProgression
        currentStage={project.stage}
        projectId={project.id}
        onStageChange={(newStage) => {
          setProject(prev => prev ? { ...prev, stage: newStage } : null);
        }}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Client Information</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.clientName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <a href={`mailto:${project.clientEmail}`} className="text-blue-600 hover:text-blue-800">
                  {project.clientEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <a href={`tel:${project.clientPhone}`} className="text-blue-600 hover:text-blue-800">
                  {project.clientPhone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.clientAddress.street}<br />
                {project.clientAddress.city}<br />
                {project.clientAddress.county}<br />
                {project.clientAddress.postcode}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Lead Source</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.leadSource}
                {project.leadSourceDetail && (
                  <span className="text-gray-500"> - {project.leadSourceDetail}</span>
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.description || "No description provided"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Showroom</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.showroom.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.createdBy.firstName} {project.createdBy.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(project.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(project.updatedAt)}</dd>
            </div>
            {project.tags.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Tags</dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Project Timeline</h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Enquiry Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(project.enquiryDate)}</dd>
              </div>
              {project.consultationDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Consultation Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.consultationDate)}</dd>
                </div>
              )}
              {project.surveyDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Survey Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.surveyDate)}</dd>
                </div>
              )}
              {project.designPresentedDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Design Presented</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.designPresentedDate)}</dd>
                </div>
              )}
              {project.saleDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sale Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.saleDate)}</dd>
                </div>
              )}
              {project.scheduledStartDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled Start</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.scheduledStartDate)}</dd>
                </div>
              )}
              {project.scheduledEndDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled End</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(project.scheduledEndDate)}</dd>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Financial Information</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Estimated Value</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(project.estimatedValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Actual Value</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(project.actualValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Margin</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {project.margin ? `${project.margin}%` : "Not set"}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Project Documents */}
      <ProjectDocuments projectId={project.id} />

      {/* Project Communications */}
      <ProjectCommunications
        projectId={project.id}
        clientEmail={project.clientEmail}
        clientPhone={project.clientPhone}
      />

      {/* Activity Timeline */}
      <ActivityTimeline projectId={project.id} />
    </div>
  );
}
