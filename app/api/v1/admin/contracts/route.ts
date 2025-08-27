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
  // Check admin access
  const authResult = await adminAuthMiddleware(request);
  if (authResult) return authResult;
  
  const dbClient = getDirectDbClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    
    console.log('Admin contracts request started for status:', status);
    
    // Connect to database
    await dbClient.connect();
    
    // Get contracts with status filter
    const contractsResult = await dbClient.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.priceCents,
        c.unit,
        c.quantity,
        c.category,
        c.region,
        c.thumbKey,
        c.vendorName,
        c.takenOn,
        c.uploaderEmail,
        c.status,
        c."createdAt",
        c."updatedAt",
        up."displayName",
        up.email as userEmail,
        ARRAY_AGG(ct.tag) FILTER (WHERE ct.tag IS NOT NULL) as tags
      FROM "Contract" c
      LEFT JOIN "UserProfile" up ON c.uploaderEmail = up.email
      LEFT JOIN "ContractTag" ct ON c.id = ct."contractId"
      WHERE c.status = $1
      GROUP BY c.id, up."displayName", up.email
      ORDER BY c."createdAt" DESC
    `, [status]);
    
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
      tags: row.tags.map((tag: string) => ({ label: tag }))
    }));
    
    console.log(`Found ${contracts.length} contracts with status: ${status}`);
    
    return NextResponse.json(contracts);

  } catch (error) {
    console.error('Error in admin contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
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
