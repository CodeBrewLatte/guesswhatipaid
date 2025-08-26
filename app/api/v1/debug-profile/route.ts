import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Create a singleton Prisma client to prevent connection issues
let prisma: any = null;

function getPrismaClient() {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function GET(request: NextRequest) {
  const prisma = getPrismaClient();
  
  try {
    console.log('Debug profile endpoint - testing database connection...');
    
    // Test 1: Check environment variables
    const envVars = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      databaseUrl: !!process.env.DATABASE_URL,
    };
    
    console.log('Environment variables:', envVars);
    
    // Test 2: Test basic database query
    try {
      const userCount = await prisma.userProfile.count();
      console.log('User count query successful:', userCount);
      
      // Test 3: Test schema fields
      const sampleUser = await prisma.userProfile.findFirst({
        select: {
          id: true,
          email: true,
          displayName: true,
          region: true,
          profileImageUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      console.log('Sample user query successful:', sampleUser);
      
      return NextResponse.json({
        status: 'success',
        message: 'All tests passed',
        envVars,
        databaseConnected: true,
        userCount,
        sampleUser,
        timestamp: new Date().toISOString()
      });
      
    } catch (queryError) {
      console.error('Database query failed:', queryError);
      return NextResponse.json({
        error: 'Database query failed',
        details: queryError instanceof Error ? queryError.message : 'Unknown error',
        envVars,
        databaseConnected: true
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Unexpected error in debug endpoint:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
