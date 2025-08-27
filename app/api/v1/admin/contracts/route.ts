import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { adminAuthMiddleware } from '../middleware';

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
  console.log('=== ADMIN CONTRACTS API START ===');
  
  // Check admin access
  console.log('Checking admin access...');
  const authResult = await adminAuthMiddleware(request);
  if (authResult) {
    console.log('Admin auth failed:', authResult);
    return authResult;
  }
  console.log('Admin auth passed');
  
  const dbClient = getDirectDbClient();
  console.log('Database client created');
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    
    console.log('Admin contracts request started for status:', status);
    
    // Connect to database
    console.log('Connecting to database...');
    await dbClient.connect();
    console.log('Database connected successfully');
    
    // Build the WHERE clause based on status
    let whereClause = '';
    let queryParams: string[] = [];
    
    if (status === 'ALL') {
      whereClause = '';
      queryParams = [];
    } else {
      whereClause = 'WHERE c.status = $1';
      queryParams = [status];
    }
    
    console.log('About to execute query with whereClause:', whereClause, 'and params:', queryParams);
    
    // Get contracts with status filter - simplified query
    console.log('Executing SQL query...');
    const contractsResult = await dbClient.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c."priceCents",
        c.unit,
        c.quantity,
        c.category,
        c.region,
        c."thumbKey",
        c."vendorName",
        c."takenOn",
        c."uploaderEmail",
        c.status,
        c."createdAt",
        c."updatedAt",
        up."displayName",
        up.email as userEmail
      FROM "Contract" c
      LEFT JOIN "UserProfile" up ON c."uploaderEmail" = up.email
      ${whereClause}
      ORDER BY c."createdAt" DESC
    `, queryParams);
    console.log('SQL query executed successfully, rows returned:', contractsResult.rows.length);
    
    const contracts = contractsResult.rows.map(row => ({
      id: row.id,
      category: row.category,
      region: row.region,
      priceCents: row.priceCents,
      description: row.description,
      vendorName: row.vendorName,
      status: row.status,
      createdAt: row.createdAt,
      user: {
        email: row.userEmail || row.uploaderEmail,
        displayName: row.displayName
      },
      tags: [] // Simplified - no tags for now
    }));
    
    console.log(`Found ${contracts.length} contracts with status: ${status}`);
    
    return NextResponse.json(contracts);

  } catch (error) {
    console.error('=== ERROR IN ADMIN CONTRACTS ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts', details: error instanceof Error ? error.message : String(error) },
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
