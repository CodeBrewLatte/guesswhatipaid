import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    console.log('Categories GET request started (direct DB)');
    
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
    
    // Fetch unique categories using direct SQL
    const categoriesResult = await client.query(`
      SELECT DISTINCT category 
      FROM "Contract" 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `);
    
    await client.end();
    
    const categories = categoriesResult.rows.map(row => row.category);
    console.log('Categories fetched successfully:', categories);
    
    return NextResponse.json({
      success: true,
      categories: categories
    });

  } catch (error) {
    console.error('Error in categories fetch (direct DB):', error);
    if (client) {
      await client.end();
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
