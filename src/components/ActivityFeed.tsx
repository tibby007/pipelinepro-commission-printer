'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActivityLog } from '@/types/database';

interface ActivityWithEntity extends ActivityLog {
  entity_name?: string;
  commission_amount?: number;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityWithEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        // Get recent activity
        const { data: activityData, error } = await supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Enrich activity data with entity information
        const enrichedActivities = await Promise.all(
          (activityData || []).map(async (activity) => {
            let entity_name = '';
            let commission_amount = 0;

            if (activity.entity_type === 'prospect') {
              const { data: prospect } = await supabase
                .from('prospects')
                .select('business_name')
                .eq('id', activity.entity_id)
                .single();
              entity_name = prospect?.business_name || 'Unknown Business';
            } else if (activity.entity_type === 'application') {
              const { data: application } = await supabase
                .from('applications')
                .select('commission_amount, prospect_id')
                .eq('id', activity.entity_id)
                .single();
              
              if (application) {
                commission_amount = application.commission_amount || 0;
                const { data: prospect } = await supabase
                  .from('prospects')
                  .select('business_name')
                  .eq('id', application.prospect_id)
                  .single();
                entity_name = prospect?.business_name || 'Unknown Business';
              }
            } else if (activity.entity_type === 'conversation') {
              const { data: conversation } = await supabase
                .from('conversations')
                .select('prospect_id')
                .eq('id', activity.entity_id)
                .single();
              
              if (conversation?.prospect_id) {
                const { data: prospect } = await supabase
                  .from('prospects')
                  .select('business_name')
                  .eq('id', conversation.prospect_id)
                  .single();
                entity_name = prospect?.business_name || 'Unknown Business';
              }
            }

            return {
              ...activity,
              entity_name,
              commission_amount,
            };
          })
        );

        setActivities(enrichedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (entityType: string) => {
    if (entityType === 'prospect') return '👤';
    if (entityType === 'conversation') return '💬';
    if (entityType === 'application') return '📄';
    return '🔔';
  };

  const getActivityColor = (entityType: string) => {
    switch (entityType) {
      case 'prospect': return 'text-blue-600';
      case 'conversation': return 'text-green-600';
      case 'application': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm">
                  {getActivityIcon(activity.entity_type)}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-900">
                    <span className={`font-medium ${getActivityColor(activity.entity_type)}`}>
                      {activity.entity_name}
                    </span>
                    {' '}
                    <span className="text-gray-600">
                      {activity.description || `${activity.entity_type} ${activity.action}`}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
                
                {activity.commission_amount && activity.commission_amount > 0 && (
                  <p className="text-sm font-bold text-green-600 mt-1">
                    Commission: ${activity.commission_amount.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
}