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
    
    await client.end();
    
    // Return hardcoded US states since this is a predefined list
    const regions = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
    
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
