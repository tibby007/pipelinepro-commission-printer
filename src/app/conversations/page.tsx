'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Conversation, Prospect } from '@/types/database';

interface ConversationWithProspect extends Conversation {
  prospect: Prospect | null;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationWithProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithProspect | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          prospect:prospects(*)
        `)
        .order('last_contact', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQualificationStatus = async (conversationId: string, qualified: boolean) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ qualified })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, qualified } : c)
      );
    } catch (error) {
      console.error('Error updating qualification status:', error);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'linkedin': return '💼';
      case 'website': return '🌐';
      case 'referral': return '👥';
      default: return '💬';
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'phone': return 'bg-green-100 text-green-800';
      case 'linkedin': return 'bg-purple-100 text-purple-800';
      case 'website': return 'bg-orange-100 text-orange-800';
      case 'referral': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualificationColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderMessages = (messages: any) => {
    if (!messages || !Array.isArray(messages)) return [];
    return messages.slice(-5); // Show last 5 messages
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Conversations</h1>
        <p className="text-lg text-gray-600">
          Monitor and manage AI-driven prospect conversations and qualification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Active Conversations</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No conversations found. Start an outreach campaign to begin AI conversations.
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getChannelIcon(conversation.channel)}</span>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {conversation.prospect?.business_name || 'Unknown Business'}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChannelColor(conversation.channel)}`}>
                                {conversation.channel}
                              </span>
                              <span className={`text-sm font-medium ${getQualificationColor(conversation.qualification_score)}`}>
                                Score: {conversation.qualification_score || 0}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {conversation.prospect?.industry} • {conversation.prospect?.contact_name || 'No contact name'}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Last contact: {formatDate(conversation.last_contact)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQualificationStatus(conversation.id, !conversation.qualified);
                              }}
                              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                conversation.qualified
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {conversation.qualified ? 'Qualified ✓' : 'Mark Qualified'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Conversation Detail */}
        <div className="space-y-6">
          {selectedConversation ? (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Business:</span>
                    <p className="text-sm text-gray-900">{selectedConversation.prospect?.business_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Industry:</span>
                    <p className="text-sm text-gray-900">{selectedConversation.prospect?.industry}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Estimated Revenue:</span>
                    <p className="text-sm text-gray-900">
                      {selectedConversation.prospect?.estimated_revenue 
                        ? `$${selectedConversation.prospect.estimated_revenue.toLocaleString()}`
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Qualification Score:</span>
                    <p className={`text-sm font-medium ${getQualificationColor(selectedConversation.qualification_score)}`}>
                      {selectedConversation.qualification_score || 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {renderMessages(selectedConversation.messages).map((message: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.type === 'outbound' 
                          ? 'bg-blue-100 ml-4' 
                          : 'bg-gray-100 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {message.type === 'outbound' ? 'AI Assistant' : 'Prospect'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{message.content}</p>
                    </div>
                  ))}
                  {(!selectedConversation.messages || selectedConversation.messages.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No messages yet</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to view details and messages.</p>
            </div>
          )}

          {/* AI Performance Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Rate</span>
                <span className="font-bold text-green-600">73%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Qualification Score</span>
                <span className="font-bold text-blue-600">
                  {Math.round(conversations.reduce((sum, c) => sum + (c.qualification_score || 0), 0) / conversations.length || 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Qualified Prospects</span>
                <span className="font-bold text-purple-600">
                  {conversations.filter(c => c.qualified).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}