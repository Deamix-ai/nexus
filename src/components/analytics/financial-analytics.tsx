'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import {
    DollarSign,
    TrendingUp,
    Users,
    Receipt,
    Repeat,
    Calendar,
    AlertCircle,
    CheckCircle
} from 'lucide-react'

interface FinancialAnalyticsProps {
    timeframe?: '7d' | '30d' | '90d' | '1y'
}

interface AnalyticsData {
    revenue: {
        total: number
        growth: number
        trend: Array<{ period: string; amount: number }>
    }
    payments: {
        total: number
        successful: number
        failed: number
        pending: number
    }
    invoices: {
        total: number
        paid: number
        overdue: number
        draft: number
    }
    subscriptions: {
        active: number
        mrr: number // Monthly Recurring Revenue
        churn: number
        newSignups: number
    }
    topClients: Array<{
        name: string
        amount: number
        payments: number
    }>
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280']

export default function FinancialAnalytics({ timeframe = '30d' }: FinancialAnalyticsProps) {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAnalytics()
    }, [timeframe])

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            // In a real implementation, this would fetch from an analytics API
            // For now, we'll use mock data
            const mockData: AnalyticsData = {
                revenue: {
                    total: 125400,
                    growth: 12.5,
                    trend: [
                        { period: 'Week 1', amount: 28000 },
                        { period: 'Week 2', amount: 32000 },
                        { period: 'Week 3', amount: 29500 },
                        { period: 'Week 4', amount: 35900 }
                    ]
                },
                payments: {
                    total: 234,
                    successful: 198,
                    failed: 12,
                    pending: 24
                },
                invoices: {
                    total: 89,
                    paid: 67,
                    overdue: 8,
                    draft: 14
                },
                subscriptions: {
                    active: 45,
                    mrr: 12800,
                    churn: 2.1,
                    newSignups: 8
                },
                topClients: [
                    { name: 'Johnson Construction', amount: 24500, payments: 12 },
                    { name: 'Smith Developments', amount: 18200, payments: 8 },
                    { name: 'Brown Properties', amount: 15600, payments: 6 },
                    { name: 'Wilson Homes', amount: 12400, payments: 9 },
                    { name: 'Davis Renovations', amount: 9800, payments: 5 }
                ]
            }

            setData(mockData)
        } catch (err) {
            setError('Failed to load analytics')
            console.error('Analytics error:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount)
    }

    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">{error || 'Failed to load analytics'}</p>
            </div>
        )
    }

    const paymentStatusData = [
        { name: 'Successful', value: data.payments.successful, color: COLORS[0] },
        { name: 'Pending', value: data.payments.pending, color: COLORS[1] },
        { name: 'Failed', value: data.payments.failed, color: COLORS[2] }
    ]

    const invoiceStatusData = [
        { name: 'Paid', value: data.invoices.paid, color: COLORS[0] },
        { name: 'Draft', value: data.invoices.draft, color: COLORS[1] },
        { name: 'Overdue', value: data.invoices.overdue, color: COLORS[2] }
    ]

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-3xl font-bold">{formatCurrency(data.revenue.total)}</p>
                                <p className={`text-sm ${data.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPercentage(data.revenue.growth)} from last period
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                                <p className="text-3xl font-bold">{data.subscriptions.active}</p>
                                <p className="text-sm text-gray-600">
                                    MRR: {formatCurrency(data.subscriptions.mrr)}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <Repeat className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                                <p className="text-3xl font-bold">{data.payments.total}</p>
                                <p className="text-sm text-green-600">
                                    {data.payments.successful} successful
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                                <p className="text-3xl font-bold">{data.invoices.total}</p>
                                <p className="text-sm text-orange-600">
                                    {data.invoices.overdue} overdue
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <Receipt className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Revenue over the selected time period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.revenue.trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                                <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Payment Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Status</CardTitle>
                        <CardDescription>Breakdown of payment statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={paymentStatusData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {paymentStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Clients */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Clients</CardTitle>
                        <CardDescription>Highest revenue generating clients</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topClients.map((client, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{client.name}</p>
                                        <p className="text-sm text-gray-600">{client.payments} payments</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">{formatCurrency(client.amount)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Status</CardTitle>
                        <CardDescription>Current invoice status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={invoiceStatusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366F1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Subscription Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Metrics</CardTitle>
                    <CardDescription>Key subscription business metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{data.subscriptions.active}</p>
                            <p className="text-sm text-gray-600">Active Subscriptions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.subscriptions.mrr)}</p>
                            <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{data.subscriptions.newSignups}</p>
                            <p className="text-sm text-gray-600">New Signups</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{data.subscriptions.churn}%</p>
                            <p className="text-sm text-gray-600">Churn Rate</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
