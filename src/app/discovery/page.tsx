'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProspectInsert } from '@/types/database';

// Automated Discovery Component
function AutomatedDiscovery() {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>(['']);
  const [prospectsPerIndustry, setProspectsPerIndustry] = useState(25);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryHistory, setDiscoveryHistory] = useState<any[]>([]);

  const arfIndustries = [
    'Restaurants',
    'Auto Repair', 
    'Medical/Dental',
    'Retail',
    'Professional Services',
    'Manufacturing',
    'Computer Software/IT',
    'Wholesale'
  ];

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) 
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const selectAllIndustries = () => {
    setSelectedIndustries(arfIndustries);
  };

  const clearAllIndustries = () => {
    setSelectedIndustries([]);
  };

  const addLocation = () => {
    setLocations(prev => [...prev, '']);
  };

  const updateLocation = (index: number, value: string) => {
    setLocations(prev => prev.map((loc, i) => i === index ? value : loc));
  };

  const removeLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalProspects = () => {
    return selectedIndustries.length * prospectsPerIndustry;
  };

  const getEstimatedValue = () => {
    const avgLoanSize = 150000; // Average loan size
    const conversionRate = 0.15; // 15% conversion
    const avgCommission = 0.02; // 2% commission
    
    return getTotalProspects() * conversionRate * avgLoanSize * avgCommission;
  };

  const startAutomatedDiscovery = async () => {
    if (selectedIndustries.length === 0 || locations.filter(l => l.trim()).length === 0) {
      alert('Please select at least one industry and one location');
      return;
    }

    setIsDiscovering(true);
    
    try {
      const payload = {
        leadCount: prospectsPerIndustry || 25,
        industry: selectedIndustries[0] || 'Medical/Dental', 
        location: locations.filter(l => l.trim())[0] || 'Atlanta, GA',
        apolloSearchUrl: "https://app.apollo.io/#/people?page=1&personTitles[]=owner&personSeniorities[]=owner&personSeniorities[]=founder&personSeniorities[]=c_suite&personSeniorities[]=partner&personSeniorities[]=director&personLocations[]=United%20States"
      };

      const response = await fetch('/api/discovery/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Add to discovery history
        const newDiscovery = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          industries: selectedIndustries,
          locations: locations.filter(l => l.trim()),
          total_prospects: getTotalProspects(),
          status: 'running'
        };
        
        setDiscoveryHistory(prev => [newDiscovery, ...prev.slice(0, 9)]);
        alert(`Discovery started successfully! Searching for ${getTotalProspects()} prospects across ${selectedIndustries.length} industries.`);
      } else {
        alert('Failed to start discovery: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Discovery error:', error);
      alert('Failed to start discovery. Please try again.');
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">🚀 Automated Prospect Discovery</h3>
      
      {/* Industry Selection */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-900">ARF Target Industries</h4>
          <div className="space-x-2">
            <button
              onClick={selectAllIndustries}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
            >
              Select All
            </button>
            <button
              onClick={clearAllIndustries}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {arfIndustries.map(industry => (
            <label key={industry} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIndustries.includes(industry)}
                onChange={() => handleIndustryChange(industry)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{industry}</span>
            </label>
          ))}
        </div>
        
        {selectedIndustries.length > 0 && (
          <p className="text-xs text-green-600 mt-2">
            ✓ {selectedIndustries.length} industries selected
          </p>
        )}
      </div>

      {/* Location Search */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-900">Target Locations</h4>
          <button
            onClick={addLocation}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
          >
            + Add Location
          </button>
        </div>
        
        <div className="space-y-2">
          {locations.map((location, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={location}
                onChange={(e) => updateLocation(index, e.target.value)}
                placeholder="City, State (e.g., Atlanta, GA)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {locations.length > 1 && (
                <button
                  onClick={() => removeLocation(index)}
                  className="px-2 py-2 text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search Parameters */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Search Parameters</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prospects per Industry: {prospectsPerIndustry}
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={prospectsPerIndustry}
              onChange={(e) => setProspectsPerIndustry(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10</span>
              <span>50</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="font-medium text-blue-900">Total Prospects:</span>
              <div className="text-xl font-bold text-blue-600">{getTotalProspects()}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="font-medium text-green-900">Est. Pipeline Value:</span>
              <div className="text-xl font-bold text-green-600">
                ${getEstimatedValue().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={startAutomatedDiscovery}
        disabled={isDiscovering || selectedIndustries.length === 0}
        className={`w-full font-medium py-3 px-4 rounded-md transition-colors ${
          isDiscovering || selectedIndustries.length === 0
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isDiscovering ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Starting Discovery...</span>
          </div>
        ) : (
          `🚀 Start Automated Discovery (${getTotalProspects()} prospects)`
        )}
      </button>

      {/* Discovery History */}
      {discoveryHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Recent Discovery Runs</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {discoveryHistory.map(run => (
              <div key={run.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                <div>
                  <span className="font-medium">{run.total_prospects} prospects</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(run.timestamp).toLocaleString()}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full ${
                  run.status === 'running' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiscoveryPage() {
  const [formData, setFormData] = useState<ProspectInsert>({
    business_name: '',
    industry: '',
    contact_name: '',
    email: '',
    phone: '',
    estimated_revenue: 0,
    status: 'new',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const industries = [
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Food Service',
    'Construction',
    'Transportation',
    'Professional Services',
    'Real Estate',
    'Financial Services',
    'Education',
    'Entertainment',
    'Other',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_revenue' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('prospects')
        .insert([formData]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Prospect added successfully!' });
      setFormData({
        business_name: '',
        industry: '',
        contact_name: '',
        email: '',
        phone: '',
        estimated_revenue: 0,
        status: 'new',
      });
    } catch (error) {
      console.error('Error adding prospect:', error);
      setMessage({ type: 'error', text: 'Failed to add prospect. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prospect Discovery</h1>
          <p className="text-lg text-gray-600">
            Add new prospects to your commercial lending pipeline
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Prospect Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Prospect</h2>
            
            {message && (
              <div className={`mb-4 p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry *
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="contact_name"
                  name="contact_name"
                  value={formData.contact_name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="estimated_revenue" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Annual Revenue
                </label>
                <input
                  type="number"
                  id="estimated_revenue"
                  name="estimated_revenue"
                  value={formData.estimated_revenue || ''}
                  onChange={handleInputChange}
                  placeholder="500000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isSubmitting ? 'Adding Prospect...' : 'Add Prospect'}
              </button>
            </form>
          </div>

          {/* Automated Discovery Tools */}
          <div className="space-y-6">
            <AutomatedDiscovery />

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prospects Added Today</span>
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Week</span>
                  <span className="font-bold text-green-600">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-bold text-purple-600">23%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}