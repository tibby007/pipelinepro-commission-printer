import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ProspectInsert } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const data: ProspectInsert = await request.json();
    console.log('New prospect:', data);
    
    // Validate required fields
    if (!data.business_name || !data.industry) {
      return NextResponse.json(
        { error: 'Business name and industry are required' }, 
        { status: 400 }
      );
    }

    // Insert prospect into Supabase
    const { data: prospect, error } = await supabase
      .from('prospects')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to add prospect to database' }, 
        { status: 500 }
      );
    }

    console.log('Prospect added successfully:', prospect);
    
    return NextResponse.json({ 
      success: true, 
      data: prospect,
      message: 'Prospect added successfully' 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to add prospect' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query = supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: prospects, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prospects' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: prospects 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prospects' }, 
      { status: 500 }
    );
  }
}