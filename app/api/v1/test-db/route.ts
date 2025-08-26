import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Use a simple findMany query instead of raw SQL
    const userCount = await prisma.userProfile.count();
    console.log('Database query successful, user count:', userCount);
    
    return NextResponse.json({
      status: 'ok',
      message: 'Database connection working',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
