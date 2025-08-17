import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign_type, timestamp } = body;

    // Log the webhook trigger
    console.log('Start outreach webhook triggered:', { campaign_type, timestamp });

    // Get prospects ready for outreach (status = 'new')
    const { data: prospects, error: prospectsError } = await supabase
      .from('prospects')
      .select('*')
      .eq('status', 'new');

    if (prospectsError) {
      throw prospectsError;
    }

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({ 
        message: 'No prospects available for outreach',
        count: 0 
      });
    }

    // Create conversation records for each prospect
    const conversationPromises = prospects.map(prospect => 
      supabase.from('conversations').insert({
        prospect_id: prospect.id,
        channel: 'email', // Default to email for automated outreach
        messages: [{
          timestamp: new Date().toISOString(),
          type: 'outbound',
          content: `AI-generated outreach message for ${prospect.business_name}`
        }],
        qualification_score: Math.floor(Math.random() * 40) + 30, // Random score 30-70
        qualified: false,
        last_contact: new Date().toISOString()
      })
    );

    await Promise.all(conversationPromises);

    // Update prospect statuses to 'contacted'
    const { error: updateError } = await supabase
      .from('prospects')
      .update({ status: 'contacted' })
      .in('id', prospects.map(p => p.id));

    if (updateError) {
      throw updateError;
    }

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'prospect',
      entity_id: prospects[0].id, // Use first prospect as reference
      action: 'outreach_campaign_started',
      description: `AI outreach campaign started for ${prospects.length} prospects`,
      metadata: { 
        campaign_type, 
        prospect_count: prospects.length,
        triggered_at: timestamp 
      }
    });

    return NextResponse.json({
      message: 'Outreach campaign started successfully',
      prospects_contacted: prospects.length,
      campaign_type,
      timestamp
    });

  } catch (error) {
    console.error('Error in start-outreach webhook:', error);
    return NextResponse.json(
      { error: 'Failed to start outreach campaign' },
      { status: 500 }
    );
  }
}