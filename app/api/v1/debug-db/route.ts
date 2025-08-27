import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug DB endpoint called');
    
    // Check environment variables
    const databaseUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL present:', !!databaseUrl);
    
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not found' }, { status: 500 });
    }
    
    // Try to create a simple Prisma client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Test basic connection
      await prisma.$connect();
      console.log('Prisma connected successfully');
      
      // Check what tables exist
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log('Available tables:', tables);
      
      // Try to check UserProfile table specifically
      try {
        const userProfileCount = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM "UserProfile"
        `;
        console.log('UserProfile table exists, count:', userProfileCount);
      } catch (tableError) {
        console.log('UserProfile table error:', tableError instanceof Error ? tableError.message : 'Unknown error');
      }
      
      // Try to check if there are any user profiles
      try {
        const profiles = await prisma.$queryRaw`
          SELECT * FROM "UserProfile" LIMIT 5
        `;
        console.log('Sample profiles:', profiles);
      } catch (profilesError) {
        console.log('Profiles query error:', profilesError instanceof Error ? profilesError.message : 'Unknown error');
      }
      
      await prisma.$disconnect();
      
      return NextResponse.json({
        success: true,
        tables: tables,
        message: 'Database connection successful'
      });
      
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      await prisma.$disconnect();
      
      return NextResponse.json({
        error: 'Prisma error',
        details: prismaError.message,
        name: prismaError.name
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('General error:', error);
    return NextResponse.json({
      error: 'General error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
