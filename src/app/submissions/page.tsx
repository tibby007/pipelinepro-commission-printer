'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Application, Prospect } from '@/types/database';

interface SubmissionWithProspect extends Application {
  prospect: Prospect | null;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithProspect | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'funded' | 'declined'>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          prospect:prospects(*)
        `)
        .eq('submitted_to_arf', true)
        .order('arf_submission_date', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      // If marking as funded, set funding_date
      if (newStatus === 'funded') {
        updateData.funding_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', submissionId);

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(sub => sub.id === submissionId ? { 
          ...sub, 
          status: newStatus as any,
          funding_date: newStatus === 'funded' ? new Date().toISOString() : sub.funding_date
        } : sub)
      );
    } catch (error) {
      console.error('Error updating submission status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'funded': return 'bg-emerald-100 text-emerald-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysInPipeline = (submissionDate: string | null) => {
    if (!submissionDate) return 0;
    const submitted = new Date(submissionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(sub => sub.status === filter);

  const totalCommissions = submissions.reduce((sum, sub) => sum + (sub.commission_amount || 0), 0);
  const fundedCommissions = submissions
    .filter(sub => sub.status === 'funded')
    .reduce((sum, sub) => sum + (sub.commission_amount || 0), 0);
  const pendingCommissions = submissions
    .filter(sub => sub.status !== 'funded' && sub.status !== 'declined')
    .reduce((sum, sub) => sum + (sub.commission_amount || 0), 0);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ARF Deal Pipeline</h1>
        <p className="text-lg text-gray-600">
          Track submissions to ARF and monitor commission earnings
        </p>
      </div>

      {/* Commission Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Submissions</h3>
          <div className="text-3xl font-bold text-blue-600">{submissions.length}</div>
          <p className="text-sm text-gray-600">Deals submitted to ARF</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Commission</h3>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(totalCommissions)}</div>
          <p className="text-sm text-gray-600">All submitted deals</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Funded Commission</h3>
          <div className="text-3xl font-bold text-emerald-600">{formatCurrency(fundedCommissions)}</div>
          <p className="text-sm text-gray-600">Commission earned</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Commission</h3>
          <div className="text-3xl font-bold text-orange-600">{formatCurrency(pendingCommissions)}</div>
          <p className="text-sm text-gray-600">Awaiting funding</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Submissions', count: submissions.length },
            { key: 'submitted', label: 'Submitted', count: submissions.filter(s => s.status === 'submitted').length },
            { key: 'under_review', label: 'Under Review', count: submissions.filter(s => s.status === 'under_review').length },
            { key: 'approved', label: 'Approved', count: submissions.filter(s => s.status === 'approved').length },
            { key: 'funded', label: 'Funded', count: submissions.filter(s => s.status === 'funded').length },
            { key: 'declined', label: 'Declined', count: submissions.filter(s => s.status === 'declined').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                ${filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days in Pipeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No submissions found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr 
                    key={submission.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedSubmission?.id === submission.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.prospect?.business_name || 'Unknown Business'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.prospect?.industry}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(submission.loan_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(submission.commission_amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.commission_rate ? `${(submission.commission_rate * 100).toFixed(2)}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(submission.arf_submission_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getDaysInPipeline(submission.arf_submission_date)} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={submission.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateSubmissionStatus(submission.id, e.target.value);
                        }}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="funded">Funded</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setSelectedSubmission(null)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Business:</span>
                    <p className="text-sm text-gray-900">{selectedSubmission.prospect?.business_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Industry:</span>
                    <p className="text-sm text-gray-900">{selectedSubmission.prospect?.industry}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Loan Amount:</span>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(selectedSubmission.loan_amount)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Commission:</span>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(selectedSubmission.commission_amount)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Submitted to ARF:</span>
                    <p className="text-sm text-gray-900">{formatDate(selectedSubmission.arf_submission_date)}</p>
                  </div>
                  {selectedSubmission.funding_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Funding Date:</span>
                      <p className="text-sm text-gray-900">{formatDate(selectedSubmission.funding_date)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Application Data:</span>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
                      {JSON.stringify(selectedSubmission.application_data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}