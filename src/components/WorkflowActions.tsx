'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function WorkflowActions() {
  const [isStartingOutreach, setIsStartingOutreach] = useState(false);

  const handleStartOutreach = async () => {
    setIsStartingOutreach(true);
    try {
      // Trigger n8n webhook for outreach campaign
      const response = await fetch('/api/webhooks/start-outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_type: 'automated_outreach',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        alert('AI Outreach Campaign Started Successfully!');
      } else {
        alert('Failed to start outreach campaign');
      }
    } catch (error) {
      console.error('Error starting outreach:', error);
      alert('Error starting outreach campaign');
    } finally {
      setIsStartingOutreach(false);
    }
  };

  const actions = [
    {
      title: 'Discover New Prospects',
      description: 'Find and add new potential clients to your pipeline',
      color: 'bg-blue-600 hover:bg-blue-700',
      href: '/discovery',
      icon: '🔍',
    },
    {
      title: 'Start AI Outreach Campaign',
      description: 'Launch automated outreach to qualified prospects',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: handleStartOutreach,
      icon: '🤖',
      loading: isStartingOutreach,
    },
    {
      title: 'View Active Conversations',
      description: 'Monitor ongoing AI conversations and qualification',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      href: '/conversations',
      icon: '💬',
    },
    {
      title: 'Review Landing Page Activity',
      description: 'Check voice applications and form submissions',
      color: 'bg-orange-600 hover:bg-orange-700',
      href: '/applications',
      icon: '📋',
    },
    {
      title: 'ARF Deal Pipeline',
      description: 'Track submissions and commissions with ARF',
      color: 'bg-purple-600 hover:bg-purple-700',
      href: '/submissions',
      icon: '💰',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {actions.map((action, index) => {
        if (action.href) {
          return (
            <Link
              key={index}
              href={action.href}
              className={`
                ${action.color} text-white rounded-lg p-6 text-center
                transform transition-all duration-200 hover:scale-105 hover:shadow-lg
                cursor-pointer block
              `}
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </Link>
          );
        } else {
          return (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.loading}
              className={`
                ${action.color} text-white rounded-lg p-6 text-center
                transform transition-all duration-200 hover:scale-105 hover:shadow-lg
                ${action.loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                border-0 w-full
              `}
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
              <p className="text-sm opacity-90">
                {action.loading ? 'Starting campaign...' : action.description}
              </p>
              {action.loading && (
                <div className="mt-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                </div>
              )}
            </button>
          );
        }
      })}
    </div>
  );
}