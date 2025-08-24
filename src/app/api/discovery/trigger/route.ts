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

    // Trigger discovery workflow via webhook
    const webhookUrl = process.env.DISCOVERY_WEBHOOK_URL;
    let n8nResponse = null;
    let webhookTriggered = false;

    if (webhookUrl) {
      try {
        console.log('Triggering discovery webhook:', webhookUrl);
        
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'PipelinePro-Discovery/1.0'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!webhookResponse.ok) {
          throw new Error(`Discovery webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
        }

        // Try to parse webhook response, but don't fail if it's not JSON
        try {
          n8nResponse = await webhookResponse.json();
        } catch {
          n8nResponse = { status: 'accepted', text: await webhookResponse.text() };
        }

        webhookTriggered = true;
        console.log('Discovery webhook triggered successfully:', n8nResponse);
        
        // Log successful webhook trigger
        await supabase
          .from('activity_log')
          .insert([{
            entity_type: 'prospect',
            entity_id: '00000000-0000-0000-0000-000000000000',
            action: 'discovery_webhook_triggered',
            description: `Discovery webhook triggered successfully`,
            metadata: {
              webhook_url: webhookUrl,
              webhook_response: n8nResponse,
              payload
            }
          }]);

      } catch (webhookError) {
        console.error('Discovery webhook error:', webhookError);
        
        const errorMessage = webhookError instanceof Error ? webhookError.message : 'Unknown error';
        
        // Log webhook failure but don't fail the entire request
        await supabase
          .from('activity_log')
          .insert([{
            entity_type: 'prospect',
            entity_id: '00000000-0000-0000-0000-000000000000',
            action: 'discovery_webhook_failed',
            description: `Discovery webhook failed: ${errorMessage}`,
            metadata: {
              webhook_url: webhookUrl,
              error: errorMessage,
              payload
            }
          }]);
      }
    } else {
      console.log('No DISCOVERY_WEBHOOK_URL configured, skipping webhook trigger');
    }

    const webhookResponse = {
      success: true,
      workflow_id: `discovery_${Date.now()}`,
      message: webhookTriggered 
        ? 'Discovery workflow triggered successfully' 
        : 'Discovery logged successfully (webhook not configured)',
      parameters: {
        leadCount,
        industry,
        location,
        apolloSearchUrl
      },
      webhook_url: webhookUrl || null,
      webhook_triggered: webhookTriggered,
      webhook_response: n8nResponse,
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