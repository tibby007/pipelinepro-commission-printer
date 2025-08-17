'use client';

import { useState, useEffect } from 'react';

interface Prospect {
  id: string;
  business_name: string;
  industry: string;
  status: string;
  created_at: string;
}

export default function ManagePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [testProspects, setTestProspects] = useState<Prospect[]>([]);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      const response = await fetch('/api/prospects/bulk-delete');
      const data = await response.json();
      
      if (data.success) {
        setProspects(data.all_prospects || []);
        setTestProspects(data.test_prospects || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch prospects' });
      }
    } catch (error) {
      console.error('Error fetching prospects:', error);
      setMessage({ type: 'error', text: 'Failed to fetch prospects' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProspectSelect = (prospectId: string) => {
    setSelectedProspects(prev => 
      prev.includes(prospectId) 
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const selectAllTest = () => {
    setSelectedProspects(testProspects.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProspects([]);
  };

  const bulkDeleteSelected = async () => {
    if (selectedProspects.length === 0) {
      setMessage({ type: 'error', text: 'Please select prospects to delete' });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProspects.length} selected prospects? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/prospects/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_ids: selectedProspects })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setSelectedProspects([]);
        await fetchProspects(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete prospects' });
      }
    } catch (error) {
      console.error('Error deleting prospects:', error);
      setMessage({ type: 'error', text: 'Failed to delete prospects' });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAllTestData = async () => {
    if (testProspects.length === 0) {
      setMessage({ type: 'error', text: 'No test data found to delete' });
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL test data (${testProspects.length} prospects)? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/prospects/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_all_test_data: true })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setSelectedProspects([]);
        await fetchProspects(); // Refresh the list
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete test data' });
      }
    } catch (error) {
      console.error('Error deleting test data:', error);
      setMessage({ type: 'error', text: 'Failed to delete test data' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading prospects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prospect Management</h1>
          <p className="text-lg text-gray-600">
            Manage and clean up your prospect database
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">🗑️ Delete Test Data</h3>
              <p className="text-sm text-red-700 mb-3">
                Remove all sample/test prospects ({testProspects.length} found)
              </p>
              <button
                onClick={deleteAllTestData}
                disabled={isDeleting || testProspects.length === 0}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isDeleting ? 'Deleting...' : `Delete ${testProspects.length} Test Prospects`}
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">✅ Select Test Data</h3>
              <p className="text-sm text-blue-700 mb-3">
                Select all test prospects for review
              </p>
              <button
                onClick={selectAllTest}
                disabled={testProspects.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Select All Test Data
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">🔄 Refresh Data</h3>
              <p className="text-sm text-gray-700 mb-3">
                Reload the prospect list
              </p>
              <button
                onClick={fetchProspects}
                disabled={isLoading}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Refresh List
              </button>
            </div>
          </div>

          {selectedProspects.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-yellow-800">
                {selectedProspects.length} prospects selected
              </span>
              <div className="space-x-2">
                <button
                  onClick={clearSelection}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm"
                >
                  Clear Selection
                </button>
                <button
                  onClick={bulkDeleteSelected}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Prospects Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              All Prospects ({prospects.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedProspects.length === prospects.length && prospects.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProspects(prospects.map(p => p.id));
                        } else {
                          setSelectedProspects([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prospects.map((prospect) => {
                  const isTestData = testProspects.some(tp => tp.id === prospect.id);
                  return (
                    <tr key={prospect.id} className={isTestData ? 'bg-red-25' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProspects.includes(prospect.id)}
                          onChange={() => handleProspectSelect(prospect.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{prospect.business_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{prospect.industry}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prospect.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          prospect.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          prospect.status === 'qualified' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prospect.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(prospect.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isTestData ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Test Data
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Production
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {prospects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No prospects found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}