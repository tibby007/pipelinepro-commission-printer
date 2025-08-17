import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('Discovery trigger payload:', payload);
    
    // Validate required fields
    const { industries, locations, prospects_per_industry, total_prospects, estimated_value } = payload;
    
    if (!industries || !Array.isArray(industries) || industries.length === 0) {
      return NextResponse.json(
        { error: 'Industries are required and must be a non-empty array' }, 
        { status: 400 }
      );
    }

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Locations are required and must be a non-empty array' }, 
        { status: 400 }
      );
    }

    if (!prospects_per_industry || prospects_per_industry < 1) {
      return NextResponse.json(
        { error: 'Prospects per industry must be at least 1' }, 
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
        description: `Automated discovery started: ${total_prospects} prospects across ${industries.length} industries`,
        metadata: {
          industries,
          locations,
          prospects_per_industry,
          total_prospects,
          estimated_value,
          trigger_source: payload.trigger_source || 'api',
          timestamp: payload.timestamp || new Date().toISOString()
        }
      }]);

    if (logError) {
      console.error('Failed to log discovery activity:', logError);
    }

    // In a real implementation, this would trigger your n8n workflow
    // For now, we'll simulate the webhook trigger response
    const webhookResponse = {
      success: true,
      workflow_id: `discovery_${Date.now()}`,
      message: 'Discovery workflow triggered successfully',
      parameters: {
        industries,
        locations,
        prospects_per_industry,
        total_prospects,
        estimated_value
      },
      n8n_webhook_url: process.env.N8N_DISCOVERY_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/discovery',
      status: 'queued'
    };

    // If you have an actual n8n webhook URL, you would make the request here:
    // const n8nWebhookUrl = process.env.N8N_DISCOVERY_WEBHOOK_URL;
    // if (n8nWebhookUrl) {
    //   const n8nResponse = await fetch(n8nWebhookUrl, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload)
    //   });
    //   
    //   if (!n8nResponse.ok) {
    //     throw new Error(`n8n webhook failed: ${n8nResponse.statusText}`);
    //   }
    // }

    return NextResponse.json(webhookResponse);

  } catch (error) {
    console.error('Discovery trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger discovery workflow' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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