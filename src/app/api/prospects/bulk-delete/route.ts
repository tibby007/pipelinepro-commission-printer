import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { prospect_ids, delete_all_test_data } = await request.json();
    
    if (!prospect_ids && !delete_all_test_data) {
      return NextResponse.json(
        { error: 'Either prospect_ids array or delete_all_test_data flag is required' }, 
        { status: 400 }
      );
    }

    let deletedCount = 0;
    let deletedProspects: any[] = [];

    if (delete_all_test_data) {
      // Delete all test/sample data (prospects with common test business names)
      const testBusinessPatterns = [
        'TechStart Solutions',
        'Metro Restaurant Group', 
        'BuildRight Construction',
        'QuickShip Logistics',
        'GreenEnergy Corp',
        'RetailMax Stores',
        'MedEquip Supply',
        'AutoParts Plus',
        'Test',
        'Sample',
        'Demo',
        'Example'
      ];

      // Build the query to find test prospects
      let query = supabase
        .from('prospects')
        .select('id, business_name');

      // Add OR conditions for each test pattern
      for (let i = 0; i < testBusinessPatterns.length; i++) {
        if (i === 0) {
          query = query.ilike('business_name', `%${testBusinessPatterns[i]}%`);
        } else {
          query = query.or(`business_name.ilike.%${testBusinessPatterns[i]}%`);
        }
      }

      const { data: testProspects, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching test prospects:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch test prospects' }, 
          { status: 500 }
        );
      }

      if (testProspects && testProspects.length > 0) {
        const testIds = testProspects.map(p => p.id);
        
        // Delete the test prospects
        const { error: deleteError } = await supabase
          .from('prospects')
          .delete()
          .in('id', testIds);

        if (deleteError) {
          console.error('Error deleting test prospects:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete test prospects' }, 
            { status: 500 }
          );
        }

        deletedCount = testProspects.length;
        deletedProspects = testProspects;
      }

    } else if (prospect_ids && Array.isArray(prospect_ids) && prospect_ids.length > 0) {
      // Delete specific prospects by ID
      
      // First, get the prospect details for logging
      const { data: prospectsToDelete, error: fetchError } = await supabase
        .from('prospects')
        .select('id, business_name')
        .in('id', prospect_ids);

      if (fetchError) {
        console.error('Error fetching prospects to delete:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch prospects to delete' }, 
          { status: 500 }
        );
      }

      // Delete the prospects
      const { error: deleteError } = await supabase
        .from('prospects')
        .delete()
        .in('id', prospect_ids);

      if (deleteError) {
        console.error('Error deleting prospects:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete prospects' }, 
          { status: 500 }
        );
      }

      deletedCount = prospectsToDelete?.length || 0;
      deletedProspects = prospectsToDelete || [];
    }

    // Log the bulk delete activity
    if (deletedCount > 0) {
      await supabase
        .from('activity_log')
        .insert([{
          entity_type: 'prospect',
          entity_id: '00000000-0000-0000-0000-000000000000',
          action: 'bulk_delete',
          description: `Bulk deleted ${deletedCount} prospects`,
          metadata: {
            deleted_count: deletedCount,
            deleted_prospects: deletedProspects,
            delete_type: delete_all_test_data ? 'test_data_cleanup' : 'selective_delete',
            timestamp: new Date().toISOString()
          }
        }]);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} prospects`,
      deleted_count: deletedCount,
      deleted_prospects: deletedProspects
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete prospects' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get prospects that match test data patterns for preview
    const testBusinessPatterns = [
      'TechStart Solutions',
      'Metro Restaurant Group', 
      'BuildRight Construction',
      'QuickShip Logistics',
      'GreenEnergy Corp',
      'RetailMax Stores',
      'MedEquip Supply',
      'AutoParts Plus',
      'Test',
      'Sample',
      'Demo',
      'Example'
    ];

    const { data: prospects, error } = await supabase
      .from('prospects')
      .select('id, business_name, industry, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prospects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prospects' }, 
        { status: 500 }
      );
    }

    // Filter prospects that match test patterns
    const testProspects = prospects?.filter(prospect => 
      testBusinessPatterns.some(pattern => 
        prospect.business_name.toLowerCase().includes(pattern.toLowerCase())
      )
    ) || [];

    return NextResponse.json({ 
      success: true, 
      all_prospects: prospects,
      test_prospects: testProspects,
      test_patterns: testBusinessPatterns
    });

  } catch (error) {
    console.error('Error fetching prospects for bulk delete preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prospects' }, 
      { status: 500 }
    );
  }
}