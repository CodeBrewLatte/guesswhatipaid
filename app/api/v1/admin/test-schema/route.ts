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
  console.log('=== TEST SCHEMA API START ===');
  
  const dbClient = getDirectDbClient();
  
  try {
    console.log('Connecting to database...');
    await dbClient.connect();
    console.log('Database connected successfully');
    
    // Check what columns exist in Contract table
    console.log('Checking Contract table schema...');
    const schemaResult = await dbClient.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Contract'
      ORDER BY ordinal_position
    `);
    
    console.log('Contract table columns:', schemaResult.rows);
    
    // Try to get a sample contract
    console.log('Trying to get sample contract...');
    const sampleResult = await dbClient.query(`
      SELECT * FROM "Contract" LIMIT 1
    `);
    
    console.log('Sample contract result:', sampleResult.rows);
    
    // Check if status column exists and has data
    if (schemaResult.rows.some(row => row.column_name === 'status')) {
      console.log('Status column exists, checking values...');
      const statusResult = await dbClient.query(`
        SELECT DISTINCT status FROM "Contract" WHERE status IS NOT NULL
      `);
      console.log('Status values found:', statusResult.rows);
    } else {
      console.log('Status column does NOT exist in Contract table');
    }
    
    return NextResponse.json({
      success: true,
      schema: schemaResult.rows,
      sampleContract: sampleResult.rows[0] || null,
      hasStatusColumn: schemaResult.rows.some(row => row.column_name === 'status')
    });

  } catch (error) {
    console.error('=== ERROR IN TEST SCHEMA ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    return NextResponse.json(
      { error: 'Failed to test schema', details: error instanceof Error ? error.message : String(error) },
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
