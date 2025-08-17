'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Application, Prospect } from '@/types/database';

interface ApplicationWithProspect extends Application {
  prospect: Prospect | null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithProspect | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          prospect:prospects(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app => app.id === applicationId ? { ...app, status: newStatus as any } : app)
      );
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const toggleDocumentStatus = async (applicationId: string, uploaded: boolean) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ documents_uploaded: uploaded })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app => app.id === applicationId ? { ...app, documents_uploaded: uploaded } : app)
      );
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProgressPercentage = (application: ApplicationWithProspect) => {
    let progress = 0;
    if (application.application_data && Object.keys(application.application_data).length > 0) progress += 25;
    if (application.documents_uploaded) progress += 25;
    if (application.submitted_to_arf) progress += 25;
    if (application.status === 'funded') progress += 25;
    return progress;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Applications</h1>
        <p className="text-lg text-gray-600">
          Track voice application submissions and document collection progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Applications</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {applications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No applications found. Applications are created when prospects submit voice forms.
                </div>
              ) : (
                applications.map((application) => (
                  <div
                    key={application.id}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedApplication?.id === application.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedApplication(application)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {application.prospect?.business_name || 'Unknown Business'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {application.prospect?.industry} • {application.prospect?.contact_name || 'No contact name'}
                        </p>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                            {application.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-600">
                            Loan: {formatCurrency(application.loan_amount)}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            Commission: {formatCurrency(application.commission_amount)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">Progress</span>
                            <span className="text-xs text-gray-600">{getProgressPercentage(application)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getProgressPercentage(application)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDocumentStatus(application.id, !application.documents_uploaded);
                              }}
                              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                application.documents_uploaded
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {application.documents_uploaded ? '📄 Docs Uploaded' : '📄 Upload Docs'}
                            </button>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              application.submitted_to_arf
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {application.submitted_to_arf ? '✓ Submitted to ARF' : '⏳ Pending Submission'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(application.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={application.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateApplicationStatus(application.id, e.target.value);
                        }}
                        className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="funded">Funded</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Application Detail */}
        <div className="space-y-6">
          {selectedApplication ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Business:</span>
                    <p className="text-sm text-gray-900">{selectedApplication.prospect?.business_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Contact:</span>
                    <p className="text-sm text-gray-900">
                      {selectedApplication.prospect?.contact_name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedApplication.prospect?.email || selectedApplication.prospect?.phone || 'No contact info'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Loan Amount:</span>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(selectedApplication.loan_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Commission:</span>
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(selectedApplication.commission_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Commission Rate:</span>
                    <p className="text-sm text-gray-900">
                      {selectedApplication.commission_rate ? `${(selectedApplication.commission_rate * 100).toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Data</h3>
                <div className="text-sm text-gray-600">
                  {selectedApplication.application_data && Object.keys(selectedApplication.application_data).length > 0 ? (
                    <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md overflow-auto max-h-64">
                      {JSON.stringify(selectedApplication.application_data, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-center py-4">No application data available</p>
                  )}
                </div>
              </div>

              {selectedApplication.arf_submission_date && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ARF Submission</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Submitted:</span>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedApplication.arf_submission_date)}
                      </p>
                    </div>
                    {selectedApplication.funding_date && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Funded:</span>
                        <p className="text-sm text-gray-900">
                          {formatDate(selectedApplication.funding_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select an Application</h3>
              <p className="text-gray-600">Choose an application from the list to view details and manage its progress.</p>
            </div>
          )}

          {/* Application Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Applications</span>
                <span className="font-bold text-blue-600">{applications.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Docs Uploaded</span>
                <span className="font-bold text-green-600">
                  {applications.filter(app => app.documents_uploaded).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Submitted to ARF</span>
                <span className="font-bold text-purple-600">
                  {applications.filter(app => app.submitted_to_arf).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Commission</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(
                    applications.reduce((sum, app) => sum + (app.commission_amount || 0), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}