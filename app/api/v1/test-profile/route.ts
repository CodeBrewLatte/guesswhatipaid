import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Test profile endpoint - checking environment and database...');
    
    // Test 1: Check environment variables
    const envVars = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      databaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('Environment variables:', envVars);
    
    // Test 2: Check if Prisma can be imported
    let prismaStatus = 'unknown';
    try {
      const { PrismaClient } = require('@prisma/client');
      prismaStatus = 'PrismaClient imported successfully';
      console.log('PrismaClient import successful');
    } catch (prismaError) {
      prismaStatus = `PrismaClient import failed: ${prismaError.message}`;
      console.error('PrismaClient import failed:', prismaError);
    }
    
    // Test 3: Try to create Prisma client
    let clientStatus = 'unknown';
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      clientStatus = 'PrismaClient created successfully';
      
      // Test 4: Try to connect
      try {
        await prisma.$connect();
        clientStatus += ' and connected to database';
        await prisma.$disconnect();
        clientStatus += ' and disconnected';
      } catch (connectError) {
        clientStatus += ` but connection failed: ${connectError.message}`;
      }
      
    } catch (clientError) {
      clientStatus = `PrismaClient creation failed: ${clientError.message}`;
      console.error('PrismaClient creation failed:', clientError);
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Test profile endpoint working',
      envVars,
      prismaStatus,
      clientStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Unexpected error in test endpoint:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
