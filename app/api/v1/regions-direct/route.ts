import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    console.log('Regions GET request started (direct DB)');
    
    // Check environment variables
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('DATABASE_URL not found');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }
    
    // Connect directly to PostgreSQL
    const modifiedUrl = databaseUrl.replace(
      /sslmode=require/,
      'sslmode=no-verify'
    );
    
    client = new Client({
      connectionString: modifiedUrl,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000
    });
    
    await client.connect();
    console.log('Direct PostgreSQL connection successful');
    
    // Fetch unique regions using direct SQL
    const regionsResult = await client.query(`
      SELECT DISTINCT region 
      FROM "Contract" 
      WHERE region IS NOT NULL AND region != ''
      ORDER BY region
    `);
    
    await client.end();
    
    const regions = regionsResult.rows.map(row => row.region);
    console.log('Regions fetched successfully:', regions);
    
    return NextResponse.json({
      success: true,
      regions: regions
    });

  } catch (error) {
    console.error('Error in regions fetch (direct DB):', error);
    if (client) {
      await client.end();
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
