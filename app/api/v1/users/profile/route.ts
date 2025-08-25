import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../../src/utils/supabase';

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the user from the request (you'll need to implement auth middleware)
    // For now, let's get the user from the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { region } = await request.json();
    
    if (!region) {
      return NextResponse.json(
        { error: 'Region is required' },
        { status: 400 }
      );
    }

    // Update the user's region in the database
    const { error: updateError } = await supabase
      .from('User')
      .update({ region: region })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user region:', updateError);
      return NextResponse.json(
        { error: 'Failed to update region' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Region updated successfully',
      region: region
    });

  } catch (error) {
    console.error('Error in profile update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
