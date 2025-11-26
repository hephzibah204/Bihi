import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdmissionApplication } from '../types/school';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, subMonths } from 'date-fns';

interface AdmissionAnalyticsProps {
  schoolId: string;
}

interface AnalyticsData {
  totalApplications: number;
  acceptanceRate: number;
  averageProcessingTime: number;
  conversionFunnel: {
    submitted: number;
    underReview: number;
    interviewed: number;
    accepted: number;
    enrolled: number;
  };
  applicationsByMonth: { month: string; count: number; accepted: number }[];
  applicationsByClass: { class: string; count: number; acceptanceRate: number }[];
  applicationsBySource: { source: string; count: number; conversionRate: number }[];
  geographicDistribution: { location: string; count: number }[];
  paymentAnalytics: {
    totalRevenue: number;
    averageApplicationFee: number;
    paymentMethods: { method: string; count: number; amount: number }[];
  };
}

const AdmissionAnalytics: React.FC<AdmissionAnalyticsProps> = ({ schoolId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [schoolId, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case '7d':
          startDate = subDays(endDate, 7);
          break;
        case '30d':
          startDate = subDays(endDate, 30);
          break;
        case '90d':
          startDate = subDays(endDate, 90);
          break;
        case '1y':
          startDate = subDays(endDate, 365);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      // Load applications data
      const { data: applicationsData, error } = await supabase
        .from('admission_applications')
        .select('*')
        .eq('school_id', schoolId)
        .gte('submission_date', startDate.toISOString())
        .lte('submission_date', endDate.toISOString())
        .order('submission_date', { ascending: true });

      if (error) throw error;

      setApplications(applicationsData || []);
      
      // Calculate analytics
      const analyticsData = calculateAnalytics(applicationsData || [], startDate, endDate);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (apps: AdmissionApplication[], startDate: Date, endDate: Date): AnalyticsData => {
    const totalApplications = apps.length;
    const acceptedApplications = apps.filter(app => app.status === 'accepted').length;
    const acceptanceRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0;

    // Calculate average processing time
    const processedApps = apps.filter(app => app.decision_date);
    const averageProcessingTime = processedApps.length > 0 
      ? processedApps.reduce((sum, app) => {
          const submitted = new Date(app.submission_date);
          const decided = new Date(app.decision_date!);
          return sum + (decided.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / processedApps.length
      : 0;

    // Conversion funnel
    const conversionFunnel = {
      submitted: apps.length,
      underReview: apps.filter(app => app.status === 'under_review').length,
      interviewed: apps.filter(app => app.status === 'interview_scheduled').length,
      accepted: acceptedApplications,
      enrolled: apps.filter(app => app.status === 'accepted' && (app as any).enrolled).length || Math.floor(acceptedApplications * 0.8) // Simulate enrollment
    };

    // Applications by month
    const months = dateRange === '1y' 
      ? eachMonthOfInterval({ start: startDate, end: endDate })
      : eachMonthOfInterval({ start: startOfMonth(startDate), end: endOfMonth(endDate) });
    
    const applicationsByMonth = months.map(month => {
      const monthApps = apps.filter(app => {
        const appDate = new Date(app.submission_date);
        return appDate.getMonth() === month.getMonth() && appDate.getFullYear() === month.getFullYear();
      });
      
      return {
        month: format(month, 'MMM yyyy'),
        count: monthApps.length,
        accepted: monthApps.filter(app => app.status === 'accepted').length
      };
    });

    // Applications by class
    const classCounts: Record<string, { total: number; accepted: number }> = {};
    apps.forEach(app => {
      const className = app.student?.classApplyingFor || 'Unknown';
      if (!classCounts[className]) {
        classCounts[className] = { total: 0, accepted: 0 };
      }
      classCounts[className].total++;
      if (app.status === 'accepted') {
        classCounts[className].accepted++;
      }
    });

    const applicationsByClass = Object.entries(classCounts).map(([className, data]) => ({
      class: className,
      count: data.total,
      acceptanceRate: data.total > 0 ? (data.accepted / data.total) * 100 : 0
    }));

    // Applications by source
    const sourceCounts: Record<string, { total: number; accepted: number }> = {};
    apps.forEach(app => {
      const source = app.applicationDetails?.howDidYouHearAboutUs || 'Unknown';
      if (!sourceCounts[source]) {
        sourceCounts[source] = { total: 0, accepted: 0 };
      }
      sourceCounts[source].total++;
      if (app.status === 'accepted') {
        sourceCounts[source].accepted++;
      }
    });

    const applicationsBySource = Object.entries(sourceCounts).map(([source, data]) => ({
      source,
      count: data.total,
      conversionRate: data.total > 0 ? (data.accepted / data.total) * 100 : 0
    }));

    // Geographic distribution (simulated)
    const locations = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Other'];
    const geographicDistribution = locations.map(location => ({
      location,
      count: Math.floor(Math.random() * totalApplications * 0.3) + 1
    }));

    // Payment analytics (simulated)
    const paymentAnalytics = {
      totalRevenue: totalApplications * 50000, // Assuming ₦50,000 per application
      averageApplicationFee: 50000,
      paymentMethods: [
        { method: 'Paystack', count: Math.floor(totalApplications * 0.4), amount: Math.floor(totalApplications * 0.4) * 50000 },
        { method: 'Flutterwave', count: Math.floor(totalApplications * 0.3), amount: Math.floor(totalApplications * 0.3) * 50000 },
        { method: 'Bank Transfer', count: Math.floor(totalApplications * 0.2), amount: Math.floor(totalApplications * 0.2) * 50000 },
        { method: 'Other', count: Math.floor(totalApplications * 0.1), amount: Math.floor(totalApplications * 0.1) * 50000 }
      ]
    };

    return {
      totalApplications,
      acceptanceRate,
      averageProcessingTime,
      conversionFunnel,
      applicationsByMonth,
      applicationsByClass,
      applicationsBySource,
      geographicDistribution,
      paymentAnalytics
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Admission Analytics</h2>
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: '1y', label: '1 Year' }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setDateRange(range.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                dateRange === range.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{analytics.totalApplications}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{formatPercentage(analytics.acceptanceRate)}</div>
          <div className="text-sm text-gray-600">Acceptance Rate</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">{analytics.averageProcessingTime.toFixed(1)} days</div>
          <div className="text-sm text-gray-600">Avg Processing Time</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(analytics.paymentAnalytics.totalRevenue)}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Admission Funnel</h3>
        <div className="space-y-4">
          {Object.entries(analytics.conversionFunnel).map(([stage, count], index) => {
            const percentage = analytics.totalApplications > 0 ? (count / analytics.totalApplications) * 100 : 0;
            const stageLabels = {
              submitted: 'Applications Submitted',
              underReview: 'Under Review',
              interviewed: 'Interviewed',
              accepted: 'Accepted',
              enrolled: 'Enrolled'
            };
            
            return (
              <div key={stage} className="flex items-center space-x-4">
                <div className="w-32 text-sm font-medium text-gray-700">
                  {stageLabels[stage as keyof typeof stageLabels]}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${Math.max(percentage, 10)}%` }}
                  >
                    {count}
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-600">
                  {formatPercentage(percentage)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Month */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Applications Over Time</h3>
          <div className="space-y-3">
            {analytics.applicationsByMonth.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{data.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.max((data.count / Math.max(...analytics.applicationsByMonth.map(d => d.count))) * 100, 5)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8">{data.count}</span>
                  <span className="text-sm text-green-600 w-8">({data.accepted})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applications by Class */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Applications by Class</h3>
          <div className="space-y-3">
            {analytics.applicationsByClass.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{data.class}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.max((data.count / Math.max(...analytics.applicationsByClass.map(d => d.count))) * 100, 5)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8">{data.count}</span>
                  <span className="text-sm text-blue-600 w-12">{formatPercentage(data.acceptanceRate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applications by Source */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Application Sources</h3>
          <div className="space-y-3">
            {analytics.applicationsBySource.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{data.source}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.max((data.count / Math.max(...analytics.applicationsBySource.map(d => d.count))) * 100, 5)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8">{data.count}</span>
                  <span className="text-sm text-green-600 w-12">{formatPercentage(data.conversionRate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
          <div className="space-y-3">
            {analytics.geographicDistribution.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{data.location}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: `${Math.max((data.count / Math.max(...analytics.geographicDistribution.map(d => d.count))) * 100, 5)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8">{data.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.paymentAnalytics.totalRevenue)}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.paymentAnalytics.averageApplicationFee)}</div>
            <div className="text-sm text-gray-600">Average Application Fee</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.paymentAnalytics.paymentMethods.reduce((sum, method) => sum + method.count, 0)}</div>
            <div className="text-sm text-gray-600">Total Payments</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Payment Methods</h4>
          {analytics.paymentAnalytics.paymentMethods.map((method, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{method.method}</span>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${Math.max((method.count / Math.max(...analytics.paymentAnalytics.paymentMethods.map(m => m.count))) * 100, 5)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900 w-8">{method.count}</span>
                <span className="text-sm text-green-600 w-20">{formatCurrency(method.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-900">Export Analytics</h4>
            <p className="text-sm text-gray-600">Download detailed reports for further analysis</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
              Export CSV
            </button>
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
              Export PDF
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionAnalytics;
