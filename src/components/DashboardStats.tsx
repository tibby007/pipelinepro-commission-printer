'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  prospectsReady: number;
  activeConversations: number;
  applicationsInProgress: number;
  dealsSubmitted: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    prospectsReady: 0,
    activeConversations: 0,
    applicationsInProgress: 0,
    dealsSubmitted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get prospects ready (status = 'new')
        const { count: prospectsReady } = await supabase
          .from('prospects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new');

        // Get active conversations (qualified = false)
        const { count: activeConversations } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('qualified', false);

        // Get applications in progress (submitted_to_arf = false)
        const { count: applicationsInProgress } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('submitted_to_arf', false);

        // Get deals submitted to ARF (submitted_to_arf = true)
        const { count: dealsSubmitted } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('submitted_to_arf', true);

        setStats({
          prospectsReady: prospectsReady || 0,
          activeConversations: activeConversations || 0,
          applicationsInProgress: applicationsInProgress || 0,
          dealsSubmitted: dealsSubmitted || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      name: 'Prospects Ready',
      value: stats.prospectsReady,
      description: 'New prospects to contact',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'AI Conversations Active',
      value: stats.activeConversations,
      description: 'Ongoing qualification conversations',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Applications In Progress',
      value: stats.applicationsInProgress,
      description: 'Applications being prepared',
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'Deals Submitted to ARF',
      value: stats.dealsSubmitted,
      description: 'Applications with ARF',
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className={`${stat.bgColor} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${stat.textColor}`}>
                {stat.name}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stat.description}
              </p>
            </div>
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}