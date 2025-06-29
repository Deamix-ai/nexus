'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface ReportData {
    period: number;
    summary: {
        totalRevenue: number;
        projectsClosed: number;
        projectsInProgress: number;
        conversionRate: number;
        totalProjects: number;
        averageProjectValue: number;
    };
    pipeline: Array<{
        stage: string;
        count: number;
        value: number;
    }>;
    monthlyTrends: Array<{
        month: string;
        projects: number;
        revenue: number;
    }>;
    teamPerformance: Array<{
        user: any;
        projectsCount: number;
        totalValue: number;
    }>;
    recentActivities: any[];
    projectsByStatus: {
        completed: number;
        inProgress: number;
        cancelled: number;
        onHold: number;
    };
}

export default function ReportsPage() {
    const { data: session, status } = useSession();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [error, setError] = useState<string | null>(null);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/reports?period=${period}`);
            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }
            const data = await response.json();
            setReportData(data);
            setError(null);
        } catch (err) {
            setError('Failed to load report data');
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchReportData();
        }
    }, [period, status]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    };

    const getStageDisplayName = (stage: string) => {
        const stageNames: { [key: string]: string } = {
            'ENQUIRY': 'Initial Enquiry',
            'SURVEY_BOOKED': 'Survey Booked',
            'SURVEY_COMPLETED': 'Survey Completed',
            'DESIGN_APPOINTMENT': 'Design Appointment',
            'QUOTE_PREPARED': 'Quote Prepared',
            'QUOTE_PRESENTED': 'Quote Presented',
            'QUOTE_ACCEPTED': 'Quote Accepted',
            'DEPOSIT_PAID': 'Deposit Paid',
            'FINAL_PAYMENT': 'Final Payment',
            'INSTALLATION_SCHEDULED': 'Installation Scheduled',
            'INSTALLATION_IN_PROGRESS': 'Installation In Progress',
            'INSTALLATION_COMPLETED': 'Installation Completed',
            'PROJECT_COMPLETED': 'Project Completed'
        };
        return stageNames[stage] || stage;
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session?.user) {
        redirect("/auth/signin");
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
                        <p className="text-gray-600">Loading report data...</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !reportData) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
                        <p className="text-red-600">{error || 'Failed to load report data'}</p>
                    </div>
                    <button
                        onClick={fetchReportData}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
                    <p className="text-gray-600">Analyze your performance and track key metrics</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export
                    </button>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 3 Months</option>
                        <option value="180">Last 6 Months</option>
                        <option value="365">This Year</option>
                    </select>
                </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Sales ({period} days)
                                </dt>
                                <dd className="flex items-baseline">
                                    <div className="text-2xl font-semibold text-gray-900">
                                        {formatCurrency(reportData.summary.totalRevenue)}
                                    </div>
                                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {reportData.summary.conversionRate.toFixed(1)}%
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Projects Closed
                                </dt>
                                <dd className="flex items-baseline">
                                    <div className="text-2xl font-semibold text-gray-900">
                                        {reportData.summary.projectsClosed}
                                    </div>
                                    <div className="ml-2 text-sm text-gray-500">
                                        of {reportData.summary.totalProjects}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Active Projects
                                </dt>
                                <dd className="flex items-baseline">
                                    <div className="text-2xl font-semibold text-gray-900">
                                        {reportData.summary.projectsInProgress}
                                    </div>
                                    <div className="ml-2 text-sm text-gray-500">
                                        in progress
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Average Project Value
                                </dt>
                                <dd className="flex items-baseline">
                                    <div className="text-2xl font-semibold text-gray-900">
                                        {formatCurrency(reportData.summary.averageProjectValue)}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts and Additional Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pipeline Status */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Pipeline Status</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {reportData.pipeline.map((stage) => (
                                <div key={stage.stage} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">
                                                {getStageDisplayName(stage.stage)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {stage.count} projects
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min((stage.count / Math.max(...reportData.pipeline.map(p => p.count))) * 100, 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="ml-4 text-sm font-medium text-gray-900">
                                        {formatCurrency(stage.value)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Performance */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Team Performance</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {reportData.teamPerformance.slice(0, 5).map((member) => (
                                <div key={member.user.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {member.user.name.charAt(0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                                            <p className="text-sm text-gray-500">{member.projectsCount} projects</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {formatCurrency(member.totalValue)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {reportData.recentActivities.slice(0, 10).map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{activity.user?.name}</span> {activity.description}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {activity.project?.title && `Project: ${activity.project.title} • `}
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
