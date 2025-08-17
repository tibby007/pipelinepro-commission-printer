'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Prospect } from '@/types/database';

export default function PipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'All Prospects', count: prospects.length },
    { value: 'new', label: 'New', count: prospects.filter(p => p.status === 'new').length },
    { value: 'contacted', label: 'Contacted', count: prospects.filter(p => p.status === 'contacted').length },
    { value: 'qualified', label: 'Qualified', count: prospects.filter(p => p.status === 'qualified').length },
    { value: 'application', label: 'Application', count: prospects.filter(p => p.status === 'application').length },
    { value: 'submitted', label: 'Submitted', count: prospects.filter(p => p.status === 'submitted').length },
    { value: 'funded', label: 'Funded', count: prospects.filter(p => p.status === 'funded').length },
    { value: 'declined', label: 'Declined', count: prospects.filter(p => p.status === 'declined').length },
  ];

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error) {
      console.error('Error fetching prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProspectStatus = async (prospectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('prospects')
        .update({ status: newStatus })
        .eq('id', prospectId);

      if (error) throw error;

      // Update local state
      setProspects(prev => 
        prev.map(p => p.id === prospectId ? { ...p, status: newStatus as any } : p)
      );
    } catch (error) {
      console.error('Error updating prospect status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'application': return 'bg-purple-100 text-purple-800';
      case 'submitted': return 'bg-indigo-100 text-indigo-800';
      case 'funded': return 'bg-emerald-100 text-emerald-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProspects = selectedStatus === 'all' 
    ? prospects 
    : prospects.filter(p => p.status === selectedStatus);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline Management</h1>
        <p className="text-lg text-gray-600">
          Track and manage prospects through the commercial lending pipeline
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                ${selectedStatus === option.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Prospects Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProspects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No prospects found for the selected status.
                  </td>
                </tr>
              ) : (
                filteredProspects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prospect.business_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{prospect.industry}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {prospect.contact_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prospect.email || prospect.phone || 'No contact info'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(prospect.estimated_revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prospect.status)}`}>
                        {prospect.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(prospect.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={prospect.status}
                        onChange={(e) => updateProspectStatus(prospect.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="application">Application</option>
                        <option value="submitted">Submitted</option>
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

      {/* Pipeline Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pipeline Health</h3>
          <div className="text-3xl font-bold text-green-600">87%</div>
          <p className="text-sm text-gray-600">Active prospects moving forward</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg. Deal Size</h3>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(prospects.reduce((sum, p) => sum + (p.estimated_revenue || 0), 0) / prospects.length || 0)}
          </div>
          <p className="text-sm text-gray-600">Based on estimated revenue</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Time to Close</h3>
          <div className="text-3xl font-bold text-orange-600">28 days</div>
          <p className="text-sm text-gray-600">Average pipeline duration</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion Rate</h3>
          <div className="text-3xl font-bold text-purple-600">23%</div>
          <p className="text-sm text-gray-600">New to funded prospects</p>
        </div>
      </div>
    </div>
  );
}