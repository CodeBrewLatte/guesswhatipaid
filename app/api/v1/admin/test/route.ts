import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'No token provided',
        authHeader: authHeader || 'missing',
        step: 'token_check'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Configuration error',
        step: 'config_check'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Invalid token',
        authError: authError?.message || 'No user found',
        step: 'user_verification'
      }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const userEmail = user.email || '';
    
    const isAdmin = adminEmails.includes(userEmail);
    
    return NextResponse.json({
      success: true,
      user: {
        email: userEmail,
        id: user.id
      },
      adminEmails: adminEmails,
      isAdmin: isAdmin,
      step: 'admin_check',
      message: isAdmin ? 'User is admin' : 'User is not admin'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      step: 'exception'
    }, { status: 500 });
  }
}
