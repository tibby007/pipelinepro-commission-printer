import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ProspectInsert } from '@/types/database';

interface BulkImportPayload {
  prospects: ProspectInsert[];
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
  prospect: any;
}

export async function POST(request: NextRequest) {
  try {
    const data: BulkImportPayload = await request.json();
    console.log('Bulk import request:', { prospectCount: data.prospects?.length });
    
    // Validate payload structure
    if (!data.prospects || !Array.isArray(data.prospects)) {
      return NextResponse.json(
        { error: 'Invalid payload: prospects array is required' }, 
        { status: 400 }
      );
    }

    if (data.prospects.length === 0) {
      return NextResponse.json(
        { error: 'Empty prospects array provided' }, 
        { status: 400 }
      );
    }

    if (data.prospects.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 prospects allowed per bulk import' }, 
        { status: 400 }
      );
    }

    // Validate each prospect and collect errors
    const validationErrors: ValidationError[] = [];
    const validProspects: ProspectInsert[] = [];

    data.prospects.forEach((prospect, index) => {
      // Check required fields
      if (!prospect.business_name || typeof prospect.business_name !== 'string' || prospect.business_name.trim() === '') {
        validationErrors.push({
          index,
          field: 'business_name',
          message: 'Business name is required and must be a non-empty string',
          prospect
        });
      }

      if (!prospect.industry || typeof prospect.industry !== 'string' || prospect.industry.trim() === '') {
        validationErrors.push({
          index,
          field: 'industry',
          message: 'Industry is required and must be a non-empty string',
          prospect
        });
      }

      // Validate optional email format if provided
      if (prospect.email && typeof prospect.email === 'string' && prospect.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(prospect.email.trim())) {
          validationErrors.push({
            index,
            field: 'email',
            message: 'Invalid email format',
            prospect
          });
        }
      }

      // Validate estimated_revenue if provided
      if (prospect.estimated_revenue !== undefined && prospect.estimated_revenue !== null) {
        if (typeof prospect.estimated_revenue !== 'number' || prospect.estimated_revenue < 0) {
          validationErrors.push({
            index,
            field: 'estimated_revenue',
            message: 'Estimated revenue must be a non-negative number',
            prospect
          });
        }
      }

      // If no validation errors for this prospect, add to valid list
      const prospectErrors = validationErrors.filter(err => err.index === index);
      if (prospectErrors.length === 0) {
        const cleanProspect: ProspectInsert = {
          business_name: prospect.business_name.trim(),
          industry: prospect.industry.trim(),
          contact_name: prospect.contact_name?.trim() || null,
          email: prospect.email?.trim() || null,
          phone: prospect.phone?.trim() || null,
          estimated_revenue: prospect.estimated_revenue || null,
          status: 'new' // Set default status for all imported prospects
        };
        validProspects.push(cleanProspect);
      }
    });

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return NextResponse.json(
        { 
          error: 'Validation failed for some prospects',
          validation_errors: validationErrors,
          total_prospects: data.prospects.length,
          failed_prospects: validationErrors.length,
          valid_prospects: validProspects.length
        }, 
        { status: 400 }
      );
    }

    // Perform batch insert to Supabase
    console.log(`Inserting ${validProspects.length} valid prospects`);
    const { data: insertedProspects, error: insertError } = await supabase
      .from('prospects')
      .insert(validProspects)
      .select();

    if (insertError) {
      console.error('Supabase bulk insert error:', insertError);
      return NextResponse.json(
        { 
          error: 'Failed to insert prospects into database',
          supabase_error: insertError.message,
          attempted_count: validProspects.length
        }, 
        { status: 500 }
      );
    }

    // Log successful bulk import activity
    await supabase
      .from('activity_log')
      .insert([{
        entity_type: 'prospect',
        entity_id: '00000000-0000-0000-0000-000000000000', // Placeholder for bulk operations
        action: 'bulk_import',
        description: `Bulk imported ${insertedProspects?.length || 0} prospects via Make.com`,
        metadata: {
          imported_count: insertedProspects?.length || 0,
          source: 'make.com',
          timestamp: new Date().toISOString(),
          industries: [...new Set(validProspects.map(p => p.industry))], // Unique industries
          has_contact_info: validProspects.filter(p => p.email || p.phone).length,
          estimated_revenue_total: validProspects.reduce((sum, p) => sum + (p.estimated_revenue || 0), 0)
        }
      }]);

    console.log(`Successfully imported ${insertedProspects?.length} prospects`);
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully imported ${insertedProspects?.length} prospects`,
      imported_count: insertedProspects?.length || 0,
      total_submitted: data.prospects.length,
      validation_passed: validProspects.length,
      imported_prospects: insertedProspects?.map(p => ({
        id: p.id,
        business_name: p.business_name,
        industry: p.industry,
        status: p.status
      })) || []
    });

  } catch (error) {
    console.error('Bulk import API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process bulk import request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET method to provide endpoint information and usage
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/prospects/bulk-import',
    method: 'POST',
    description: 'Bulk import prospects from Make.com or other sources',
    max_prospects: 1000,
    required_fields: ['business_name', 'industry'],
    optional_fields: ['contact_name', 'email', 'phone', 'estimated_revenue'],
    payload_example: {
      prospects: [
        {
          business_name: 'Restaurant ABC',
          industry: 'Restaurants',
          contact_name: 'John Doe',
          email: 'john@restaurantabc.com',
          phone: '555-123-4567',
          estimated_revenue: 500000
        }
      ]
    },
    response_format: {
      success: true,
      message: 'Success message',
      imported_count: 'number',
      total_submitted: 'number',
      validation_passed: 'number',
      imported_prospects: 'array of imported prospect summaries'
    }
  });
}