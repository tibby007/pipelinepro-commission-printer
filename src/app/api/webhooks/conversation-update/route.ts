import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      conversation_id, 
      prospect_id, 
      message, 
      qualification_score, 
      qualified,
      channel = 'email'
    } = body;

    console.log('Conversation update webhook triggered:', { conversation_id, prospect_id, qualified });

    let conversationId = conversation_id;

    // If no conversation_id provided, find or create conversation for prospect
    if (!conversationId && prospect_id) {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('prospect_id', prospect_id)
        .single();

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            prospect_id,
            channel,
            messages: [],
            qualification_score: qualification_score || 0,
            qualified: qualified || false,
            last_contact: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      }
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'No conversation_id provided and could not create conversation' },
        { status: 400 }
      );
    }

    // Get current conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('messages, prospect_id')
      .eq('id', conversationId)
      .single();

    if (fetchError) throw fetchError;

    // Prepare update data
    const updateData: any = {
      last_contact: new Date().toISOString()
    };

    // Add new message if provided
    if (message) {
      const currentMessages = conversation.messages || [];
      const newMessage = {
        timestamp: new Date().toISOString(),
        type: message.type || 'inbound',
        content: message.content || message
      };
      updateData.messages = [...currentMessages, newMessage];
    }

    // Update qualification data if provided
    if (qualification_score !== undefined) {
      updateData.qualification_score = qualification_score;
    }

    if (qualified !== undefined) {
      updateData.qualified = qualified;
    }

    // Update conversation
    const { error: updateError } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    if (updateError) throw updateError;

    // If prospect is qualified, update prospect status
    if (qualified && conversation.prospect_id) {
      await supabase
        .from('prospects')
        .update({ status: 'qualified' })
        .eq('id', conversation.prospect_id);

      // Log qualification activity
      await supabase.from('activity_log').insert({
        entity_type: 'conversation',
        entity_id: conversationId,
        action: 'prospect_qualified',
        description: `Prospect qualified through AI conversation`,
        metadata: { 
          qualification_score,
          channel,
          qualified_at: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      message: 'Conversation updated successfully',
      conversation_id: conversationId,
      qualified,
      qualification_score
    });

  } catch (error) {
    console.error('Error in conversation-update webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}