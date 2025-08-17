import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prospect_id,
      application_data,
      loan_amount,
      commission_rate = 0.02, // Default 2% commission
      documents_uploaded = false,
      voice_data
    } = body;

    console.log('Application completed webhook triggered:', { prospect_id, loan_amount });

    if (!prospect_id) {
      return NextResponse.json(
        { error: 'prospect_id is required' },
        { status: 400 }
      );
    }

    // Check if application already exists for this prospect
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('prospect_id', prospect_id)
      .single();

    if (existingApp) {
      // Update existing application
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          application_data: application_data || {},
          loan_amount: loan_amount || null,
          commission_rate,
          documents_uploaded,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingApp.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        message: 'Application updated successfully',
        application_id: existingApp.id,
        loan_amount,
        commission_amount: loan_amount ? loan_amount * commission_rate : null
      });
    }

    // Create new application
    const { data: newApplication, error: createError } = await supabase
      .from('applications')
      .insert({
        prospect_id,
        application_data: application_data || {},
        loan_amount: loan_amount || null,
        commission_rate,
        documents_uploaded,
        submitted_to_arf: false,
        status: 'draft'
      })
      .select('*')
      .single();

    if (createError) throw createError;

    // Update prospect status to 'application'
    await supabase
      .from('prospects')
      .update({ status: 'application' })
      .eq('id', prospect_id);

    // Log application completion activity
    await supabase.from('activity_log').insert({
      entity_type: 'application',
      entity_id: newApplication.id,
      action: 'application_completed',
      description: `Voice application completed${loan_amount ? ` for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(loan_amount)}` : ''}`,
      metadata: { 
        loan_amount,
        commission_amount: newApplication.commission_amount,
        commission_rate,
        has_voice_data: !!voice_data,
        completed_at: new Date().toISOString()
      }
    });

    return NextResponse.json({
      message: 'Application completed successfully',
      application_id: newApplication.id,
      loan_amount: newApplication.loan_amount,
      commission_amount: newApplication.commission_amount,
      commission_rate: newApplication.commission_rate
    });

  } catch (error) {
    console.error('Error in application-completed webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process application completion' },
      { status: 500 }
    );
  }
}