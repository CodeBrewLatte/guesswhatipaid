import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    console.log('Direct DB debug endpoint called');
    
    // Check environment variables
    const databaseUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL present:', !!databaseUrl);
    
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not found' }, { status: 500 });
    }
    
    // Create direct PostgreSQL client with SSL disabled
    // Modify connection string to disable SSL verification
    const modifiedUrl = databaseUrl.replace(
      /sslmode=require/,
      'sslmode=no-verify'
    );
    
    client = new Client({
      connectionString: modifiedUrl,
      // Add connection parameters to prevent prepared statement conflicts
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000
    });
    
    try {
      // Connect directly
      await client.connect();
      console.log('Direct PostgreSQL connection successful');
      
      // Check what tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      console.log('Available tables:', tables);
      
      // Try to check UserProfile table specifically
      let userProfileCount = null;
      let profiles = null;
      
      try {
        const countResult = await client.query('SELECT COUNT(*) as count FROM "UserProfile"');
        userProfileCount = countResult.rows[0].count;
        console.log('UserProfile table exists, count:', userProfileCount);
        
        // Try to get sample profiles
        const profilesResult = await client.query('SELECT * FROM "UserProfile" LIMIT 5');
        profiles = profilesResult.rows;
        console.log('Sample profiles:', profiles);
      } catch (tableError) {
        console.log('UserProfile table error:', tableError instanceof Error ? tableError.message : 'Unknown error');
      }
      
      await client.end();
      
      return NextResponse.json({
        success: true,
        connection: 'Direct PostgreSQL connection successful',
        tables: tables,
        userProfileCount: userProfileCount,
        sampleProfiles: profiles,
        message: 'Database connection successful via direct client'
      });
      
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      if (client) {
        await client.end();
      }
      
      return NextResponse.json({
        error: 'Database connection error',
        details: dbError instanceof Error ? dbError.message : 'Unknown error',
        name: dbError instanceof Error ? dbError.name : 'Unknown'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('General error:', error);
    if (client) {
      await client.end();
    }
    
    return NextResponse.json({
      error: 'General error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
