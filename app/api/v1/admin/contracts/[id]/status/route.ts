import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { adminAuthMiddleware } from '../../../middleware';

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin access
  const authResult = await adminAuthMiddleware(request);
  if (authResult) return authResult;
  
  const dbClient = getDirectDbClient();
  
  try {
    const contractId = params.id;
    const { status } = await request.json();
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }
    
    console.log(`Admin updating contract ${contractId} status to: ${status}`);
    
    // Connect to database
    await dbClient.connect();
    
    // Update contract status
    const updateResult = await dbClient.query(`
      UPDATE "Contract" 
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id, status
    `, [status, contractId]);
    
    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    // If approved, check if this is the user's first approved contract
    if (status === 'APPROVED') {
      const contractResult = await dbClient.query(`
        SELECT "uploaderEmail" FROM "Contract" WHERE id = $1
      `, [contractId]);
      
      if (contractResult.rows.length > 0) {
        const uploaderEmail = contractResult.rows[0].uploaderEmail;
        
        // Check if this is their first approved contract
        const approvedCountResult = await dbClient.query(`
          SELECT COUNT(*) FROM "Contract" 
          WHERE "uploaderEmail" = $1 AND status = 'APPROVED'
        `, [uploaderEmail]);
        
        const approvedCount = parseInt(approvedCountResult.rows[0].count);
        
        if (approvedCount === 1) {
          console.log(`First approved contract for user ${uploaderEmail} - unlocking full access`);
          // You could add logic here to unlock user features
        }
      }
    }
    
    console.log(`Successfully updated contract ${contractId} status to: ${status}`);
    
    return NextResponse.json({
      success: true,
      message: `Contract ${status.toLowerCase()} successfully`,
      contractId,
      status
    });

  } catch (error) {
    console.error('Error updating contract status:', error);
    return NextResponse.json(
      { error: 'Failed to update contract status' },
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
