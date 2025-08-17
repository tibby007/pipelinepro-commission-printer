'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  totalProspects: number;
  totalApplications: number;
  totalSubmissions: number;
  totalCommissions: number;
  fundedCommissions: number;
  conversionRate: number;
  avgDealSize: number;
  avgCommission: number;
  monthlyStats: Array<{
    month: string;
    prospects: number;
    applications: number;
    submissions: number;
    commissions: number;
  }>;
  industryBreakdown: Array<{
    industry: string;
    count: number;
    commissions: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProspects: 0,
    totalApplications: 0,
    totalSubmissions: 0,
    totalCommissions: 0,
    fundedCommissions: 0,
    conversionRate: 0,
    avgDealSize: 0,
    avgCommission: 0,
    monthlyStats: [],
    industryBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('90d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date filter based on time range
      let dateFilter = '';
      const now = new Date();
      if (timeRange === '30d') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        dateFilter = thirtyDaysAgo.toISOString();
      } else if (timeRange === '90d') {
        const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
        dateFilter = ninetyDaysAgo.toISOString();
      } else if (timeRange === '1y') {
        const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        dateFilter = oneYearAgo.toISOString();
      }

      // Fetch prospects
      const prospectsQuery = supabase.from('prospects').select('*');
      if (dateFilter) prospectsQuery.gte('created_at', dateFilter);
      const { data: prospects } = await prospectsQuery;

      // Fetch applications
      const applicationsQuery = supabase.from('applications').select('*, prospect:prospects(*)');
      if (dateFilter) applicationsQuery.gte('created_at', dateFilter);
      const { data: applications } = await applicationsQuery;

      // Fetch submissions (applications submitted to ARF)
      const submissionsQuery = supabase.from('applications')
        .select('*, prospect:prospects(*)')
        .eq('submitted_to_arf', true);
      if (dateFilter) submissionsQuery.gte('arf_submission_date', dateFilter);
      const { data: submissions } = await submissionsQuery;

      // Calculate metrics
      const totalProspects = prospects?.length || 0;
      const totalApplications = applications?.length || 0;
      const totalSubmissions = submissions?.length || 0;
      
      const totalCommissions = (applications || []).reduce((sum, app) => sum + (app.commission_amount || 0), 0);
      const fundedCommissions = (applications || [])
        .filter(app => app.status === 'funded')
        .reduce((sum, app) => sum + (app.commission_amount || 0), 0);
      
      const conversionRate = totalProspects > 0 ? (totalSubmissions / totalProspects) * 100 : 0;
      const avgDealSize = totalApplications > 0 ? 
        (applications || []).reduce((sum, app) => sum + (app.loan_amount || 0), 0) / totalApplications : 0;
      const avgCommission = totalApplications > 0 ? totalCommissions / totalApplications : 0;

      // Calculate monthly stats
      const monthlyStats = calculateMonthlyStats(applications || []);

      // Calculate industry breakdown
      const industryBreakdown = calculateIndustryBreakdown(applications || []);

      setAnalytics({
        totalProspects,
        totalApplications,
        totalSubmissions,
        totalCommissions,
        fundedCommissions,
        conversionRate,
        avgDealSize,
        avgCommission,
        monthlyStats,
        industryBreakdown,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (applications: any[]) => {
    const monthlyData: { [key: string]: { prospects: number; applications: number; submissions: number; commissions: number } } = {};
    
    applications.forEach(app => {
      const month = new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { prospects: 0, applications: 0, submissions: 0, commissions: 0 };
      }
      monthlyData[month].applications += 1;
      if (app.submitted_to_arf) monthlyData[month].submissions += 1;
      monthlyData[month].commissions += app.commission_amount || 0;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  };

  const calculateIndustryBreakdown = (applications: any[]) => {
    const industryData: { [key: string]: { count: number; commissions: number } } = {};
    
    applications.forEach(app => {
      const industry = app.prospect?.industry || 'Unknown';
      if (!industryData[industry]) {
        industryData[industry] = { count: 0, commissions: 0 };
      }
      industryData[industry].count += 1;
      industryData[industry].commissions += app.commission_amount || 0;
    });

    return Object.entries(industryData)
      .map(([industry, data]) => ({ industry, ...data }))
      .sort((a, b) => b.commissions - a.commissions)
      .slice(0, 8); // Top 8 industries
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission Analytics</h1>
            <p className="text-lg text-gray-600">
              Track performance metrics and commission earnings
            </p>
          </div>
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Commission Earned</h3>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(analytics.fundedCommissions)}</div>
          <p className="text-sm text-gray-600">From funded deals</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Commission</h3>
          <div className="text-3xl font-bold text-orange-600">
            {formatCurrency(analytics.totalCommissions - analytics.fundedCommissions)}
          </div>
          <p className="text-sm text-gray-600">Awaiting funding</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion Rate</h3>
          <div className="text-3xl font-bold text-blue-600">{formatPercentage(analytics.conversionRate)}</div>
          <p className="text-sm text-gray-600">Prospects to submissions</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Commission</h3>
          <div className="text-3xl font-bold text-purple-600">{formatCurrency(analytics.avgCommission)}</div>
          <p className="text-sm text-gray-600">Per application</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Prospects</h3>
          <div className="text-3xl font-bold text-blue-600">{analytics.totalProspects}</div>
          <p className="text-sm text-gray-600">In pipeline</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Applications</h3>
          <div className="text-3xl font-bold text-green-600">{analytics.totalApplications}</div>
          <p className="text-sm text-gray-600">Submitted</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ARF Submissions</h3>
          <div className="text-3xl font-bold text-purple-600">{analytics.totalSubmissions}</div>
          <p className="text-sm text-gray-600">Sent to ARF</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Deal Size</h3>
          <div className="text-3xl font-bold text-orange-600">{formatCurrency(analytics.avgDealSize)}</div>
          <p className="text-sm text-gray-600">Loan amount</p>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Performance</h3>
          {analytics.monthlyStats.length > 0 ? (
            <div className="space-y-4">
              {analytics.monthlyStats.map((month, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{month.month}</span>
                    <span className="font-bold text-green-600">{formatCurrency(month.commissions)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Applications:</span>
                      <span className="font-medium text-gray-900 ml-1">{month.applications}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Submissions:</span>
                      <span className="font-medium text-gray-900 ml-1">{month.submissions}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate:</span>
                      <span className="font-medium text-gray-900 ml-1">
                        {month.applications > 0 ? formatPercentage((month.submissions / month.applications) * 100) : '0%'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No monthly data available</p>
          )}
        </div>

        {/* Industry Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Industries by Commission</h3>
          {analytics.industryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {analytics.industryBreakdown.map((industry, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{industry.industry}</span>
                      <span className="font-bold text-green-600">{formatCurrency(industry.commissions)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{industry.count} deals</span>
                      <span>Avg: {formatCurrency(industry.commissions / industry.count)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No industry data available</p>
          )}
        </div>
      </div>

      {/* Additional Insights */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🎯 Conversion Optimization</h4>
            <p className="text-sm text-blue-700">
              Your current conversion rate is {formatPercentage(analytics.conversionRate)}. 
              Focus on industries with higher conversion rates to maximize efficiency.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">💰 Commission Growth</h4>
            <p className="text-sm text-green-700">
              Total commission potential: {formatCurrency(analytics.totalCommissions)}. 
              Track funded vs pending to monitor cash flow.
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">📈 Deal Size Trends</h4>
            <p className="text-sm text-purple-700">
              Average deal size: {formatCurrency(analytics.avgDealSize)}. 
              Consider targeting larger deals for increased commission potential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}