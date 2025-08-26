import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test environment variables
    const envVars = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      databaseUrl: !!process.env.DATABASE_URL,
    };
    
    console.log('Environment variables check:', envVars);
    
    return NextResponse.json({
      status: 'ok',
      message: 'Test endpoint working',
      envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST method is working!',
    timestamp: new Date().toISOString()
  });
}

export async function PUT() {
  return NextResponse.json({ 
    message: 'PUT method is working!',
    timestamp: new Date().toISOString()
  });
}
