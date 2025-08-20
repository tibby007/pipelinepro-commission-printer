import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('Discovery trigger payload:', payload);
    
    // Validate required fields
    const { leadCount, industry, location, apolloSearchUrl } = payload;
    
    if (!industry || typeof industry !== 'string') {
      return NextResponse.json(
        { error: 'Industry is required and must be a string' }, 
        { status: 400 }
      );
    }

    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: 'Location is required and must be a string' }, 
        { status: 400 }
      );
    }

    if (!leadCount || leadCount < 1) {
      return NextResponse.json(
        { error: 'Lead count must be at least 1' }, 
        { status: 400 }
      );
    }

    // Log the discovery request to activity_log
    const { error: logError } = await supabase
      .from('activity_log')
      .insert([{
        entity_type: 'prospect',
        entity_id: '00000000-0000-0000-0000-000000000000', // Placeholder for discovery actions
        action: 'discovery_triggered',
        description: `Automated discovery started: ${leadCount} prospects for ${industry} in ${location}`,
        metadata: {
          leadCount,
          industry,
          location,
          apolloSearchUrl,
          trigger_source: payload.trigger_source || 'api',
          timestamp: payload.timestamp || new Date().toISOString()
        }
      }]);

    if (logError) {
      console.error('Failed to log discovery activity:', logError);
    }

    // Trigger n8n workflow via webhook
    const n8nWebhookUrl = process.env.N8N_DISCOVERY_WEBHOOK_URL;
    let n8nResponse = null;
    let webhookTriggered = false;

    if (n8nWebhookUrl) {
      try {
        console.log('Triggering n8n webhook:', n8nWebhookUrl);
        
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const n8nFetchResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'PipelinePro-Discovery/1.0'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!n8nFetchResponse.ok) {
          throw new Error(`n8n webhook failed: ${n8nFetchResponse.status} ${n8nFetchResponse.statusText}`);
        }

        // Try to parse n8n response, but don't fail if it's not JSON
        try {
          n8nResponse = await n8nFetchResponse.json();
        } catch {
          n8nResponse = { status: 'accepted', text: await n8nFetchResponse.text() };
        }

        webhookTriggered = true;
        console.log('n8n webhook triggered successfully:', n8nResponse);
        
        // Log successful webhook trigger
        await supabase
          .from('activity_log')
          .insert([{
            entity_type: 'prospect',
            entity_id: '00000000-0000-0000-0000-000000000000',
            action: 'n8n_webhook_triggered',
            description: `n8n discovery webhook triggered successfully`,
            metadata: {
              webhook_url: n8nWebhookUrl,
              n8n_response: n8nResponse,
              payload
            }
          }]);

      } catch (webhookError) {
        console.error('n8n webhook error:', webhookError);
        
        const errorMessage = webhookError instanceof Error ? webhookError.message : 'Unknown error';
        
        // Log webhook failure but don't fail the entire request
        await supabase
          .from('activity_log')
          .insert([{
            entity_type: 'prospect',
            entity_id: '00000000-0000-0000-0000-000000000000',
            action: 'n8n_webhook_failed',
            description: `n8n discovery webhook failed: ${errorMessage}`,
            metadata: {
              webhook_url: n8nWebhookUrl,
              error: errorMessage,
              payload
            }
          }]);
      }
    } else {
      console.log('No N8N_DISCOVERY_WEBHOOK_URL configured, skipping webhook trigger');
    }

    const webhookResponse = {
      success: true,
      workflow_id: `discovery_${Date.now()}`,
      message: webhookTriggered 
        ? 'Discovery workflow triggered successfully in n8n' 
        : 'Discovery logged successfully (n8n webhook not configured)',
      parameters: {
        leadCount,
        industry,
        location,
        apolloSearchUrl
      },
      n8n_webhook_url: n8nWebhookUrl || null,
      webhook_triggered: webhookTriggered,
      n8n_response: n8nResponse,
      status: webhookTriggered ? 'triggered' : 'queued'
    };

    return NextResponse.json(webhookResponse);

  } catch (error) {
    console.error('Discovery trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger discovery workflow' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get recent discovery activities from the activity log
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('action', 'discovery_triggered')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch discovery history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discovery history' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: activities.map(activity => ({
        id: activity.id,
        timestamp: activity.created_at,
        description: activity.description,
        metadata: activity.metadata
      }))
    });

  } catch (error) {
    console.error('Discovery history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovery history' }, 
      { status: 500 }
    );
  }
}