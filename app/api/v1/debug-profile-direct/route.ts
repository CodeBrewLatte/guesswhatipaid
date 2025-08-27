import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

function getDirectDbClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not found');
  }
  
  // Fix SSL certificate issue for Supabase
  const fixedConnectionString = connectionString.replace('sslmode=require', 'sslmode=no-verify');
  
  return new Client({
    connectionString: fixedConnectionString,
  });
}

export async function GET(request: NextRequest) {
  const dbClient = getDirectDbClient();
  
  try {
    console.log('Debug profile request started (direct DB)');
    
    // Connect to database
    await dbClient.connect();
    
    // Get user profile count
    const userCountResult = await dbClient.query('SELECT COUNT(*) FROM "UserProfile"');
    const userCount = userCountResult.rows[0].count;
    
    // Get sample user profile
    const sampleUserResult = await dbClient.query('SELECT * FROM "UserProfile" LIMIT 1');
    const sampleUser = sampleUserResult.rows[0] || null;
    
    console.log('Debug profile query successful (direct DB)');
    
    return NextResponse.json({
      success: true,
      connection: 'Direct PostgreSQL connection successful',
      userProfileCount: userCount,
      sampleUser: sampleUser,
      message: 'Database connection successful via direct client'
    });

  } catch (error) {
    console.error('Error in debug profile (direct DB):', error);
    return NextResponse.json(
      { 
        error: 'Database connection error',
        details: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Error'
      },
      { status: 500 }
    );
  } finally {
    // Always disconnect
    try {
      await dbClient.end();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
}
