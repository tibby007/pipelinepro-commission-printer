import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      application_id,
      prospect_id,
      submission_status = 'submitted',
      arf_reference_number,
      submission_notes,
      expected_funding_date
    } = body;

    console.log('ARF submission webhook triggered:', { application_id, prospect_id, submission_status });

    let applicationId = application_id;

    // If no application_id provided, find application by prospect_id
    if (!applicationId && prospect_id) {
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('prospect_id', prospect_id)
        .eq('submitted_to_arf', false)
        .single();

      if (application) {
        applicationId = application.id;
      }
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: 'No application found for submission' },
        { status: 400 }
      );
    }

    // Update application with ARF submission details
    const updateData: any = {
      submitted_to_arf: true,
      arf_submission_date: new Date().toISOString(),
      status: submission_status,
      updated_at: new Date().toISOString()
    };

    // Add metadata to application_data
    const { data: currentApp } = await supabase
      .from('applications')
      .select('application_data, prospect_id')
      .eq('id', applicationId)
      .single();

    if (currentApp) {
      const updatedAppData = {
        ...currentApp.application_data,
        arf_submission: {
          arf_reference_number,
          submission_notes,
          expected_funding_date,
          submitted_at: new Date().toISOString()
        }
      };
      updateData.application_data = updatedAppData;

      // Update prospect status to 'submitted'
      if (currentApp.prospect_id) {
        await supabase
          .from('prospects')
          .update({ status: 'submitted' })
          .eq('id', currentApp.prospect_id);
      }
    }

    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select('*, prospect:prospects(*)')
      .single();

    if (updateError) throw updateError;

    // Log ARF submission activity
    await supabase.from('activity_log').insert({
      entity_type: 'application',
      entity_id: applicationId,
      action: 'arf_submission',
      description: `Application submitted to ARF${arf_reference_number ? ` (Ref: ${arf_reference_number})` : ''}`,
      metadata: { 
        arf_reference_number,
        submission_status,
        submission_notes,
        expected_funding_date,
        commission_amount: updatedApp.commission_amount,
        loan_amount: updatedApp.loan_amount,
        submitted_at: new Date().toISOString()
      }
    });

    return NextResponse.json({
      message: 'Application submitted to ARF successfully',
      application_id: applicationId,
      arf_reference_number,
      submission_status,
      commission_amount: updatedApp.commission_amount,
      loan_amount: updatedApp.loan_amount,
      business_name: updatedApp.prospect?.business_name
    });

  } catch (error) {
    console.error('Error in arf-submission webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process ARF submission' },
      { status: 500 }
    );
  }
}

// Handle status updates from ARF (funding, approval, decline)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      arf_reference_number,
      application_id,
      status,
      funding_amount,
      funding_date,
      decline_reason
    } = body;

    console.log('ARF status update webhook triggered:', { arf_reference_number, status });

    let applicationId = application_id;

    // Find application by ARF reference number if application_id not provided
    if (!applicationId && arf_reference_number) {
      const { data: applications } = await supabase
        .from('applications')
        .select('id')
        .ilike('application_data->arf_submission->>arf_reference_number', arf_reference_number);

      if (applications && applications.length > 0) {
        applicationId = applications[0].id;
      }
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'funded') {
      updateData.funding_date = funding_date || new Date().toISOString();
      
      // Update prospect status to 'funded'
      const { data: app } = await supabase
        .from('applications')
        .select('prospect_id')
        .eq('id', applicationId)
        .single();

      if (app?.prospect_id) {
        await supabase
          .from('prospects')
          .update({ status: 'funded' })
          .eq('id', app.prospect_id);
      }
    } else if (status === 'declined') {
      // Update prospect status to 'declined'
      const { data: app } = await supabase
        .from('applications')
        .select('prospect_id')
        .eq('id', applicationId)
        .single();

      if (app?.prospect_id) {
        await supabase
          .from('prospects')
          .update({ status: 'declined' })
          .eq('id', app.prospect_id);
      }
    }

    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select('*, prospect:prospects(*)')
      .single();

    if (updateError) throw updateError;

    // Log status update activity
    await supabase.from('activity_log').insert({
      entity_type: 'application',
      entity_id: applicationId,
      action: `arf_${status}`,
      description: `ARF updated status to ${status}${funding_amount ? ` for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(funding_amount)}` : ''}`,
      metadata: { 
        arf_reference_number,
        status,
        funding_amount,
        funding_date,
        decline_reason,
        commission_amount: updatedApp.commission_amount,
        updated_at: new Date().toISOString()
      }
    });

    return NextResponse.json({
      message: `Application status updated to ${status}`,
      application_id: applicationId,
      status,
      commission_amount: updatedApp.commission_amount,
      business_name: updatedApp.prospect?.business_name
    });

  } catch (error) {
    console.error('Error in ARF status update webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update ARF status' },
      { status: 500 }
    );
  }
}