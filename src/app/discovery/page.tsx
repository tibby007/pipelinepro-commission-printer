'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProspectInsert } from '@/types/database';

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

          {/* Discovery Tools */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Discovery Tools</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">🔍 Lead Research</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Search for potential prospects using industry databases
                  </p>
                  <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                    Launch Research Tool
                  </button>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">📊 Market Analysis</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Analyze market trends and identify high-potential sectors
                  </p>
                  <button className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors">
                    View Market Data
                  </button>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">🎯 AI Prospect Scoring</h4>
                  <p className="text-sm text-purple-700 mb-3">
                    Use AI to score and prioritize prospects automatically
                  </p>
                  <button className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                    Start AI Scoring
                  </button>
                </div>
              </div>
            </div>

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