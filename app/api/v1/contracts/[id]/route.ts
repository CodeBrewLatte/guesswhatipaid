import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const contractId = params.id;
  
  // Use direct database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      { error: 'Database configuration error' },
      { status: 500 }
    );
  }
  
  // Fix SSL certificate issue for Supabase
  const fixedConnectionString = connectionString.replace('sslmode=require', 'sslmode=no-verify');
  
  const dbClient = new Client({ connectionString: fixedConnectionString });
  
  try {
    await dbClient.connect();
    
    // Get contract details
    const contractQuery = `
      SELECT 
        c.id, c.title, c.description, c."priceCents", c.unit, c.quantity,
        c.category, c.region, c."thumbKey", c."vendorName", c."takenOn",
        c."createdAt", c."updatedAt", c."uploaderEmail", c.status
      FROM "Contract" c
      WHERE c.id = $1
    `;
    
    const contractResult = await dbClient.query(contractQuery, [contractId]);
    
    if (contractResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }
    
    const contract = contractResult.rows[0];
    
    // Get user profile for the uploader
    const userQuery = `
      SELECT "displayName", email
      FROM "UserProfile"
      WHERE email = $1
    `;
    
    const userResult = await dbClient.query(userQuery, [contract.uploaderEmail]);
    const userProfile = userResult.rows[0] || {};
    
    // Get contract tags
    const tagsQuery = `
      SELECT tag
      FROM "ContractTag"
      WHERE "contractId" = $1
      ORDER BY "createdAt"
    `;
    
    const tagsResult = await dbClient.query(tagsQuery, [contractId]);
    const tags = tagsResult.rows.map(row => ({ label: row.tag }));
    
    // Get reviews (simplified for now)
    const reviewsQuery = `
      SELECT id, rating, comment, "createdAt"
      FROM "Review"
      WHERE "contractId" = $1
      ORDER BY "createdAt" DESC
    `;
    
    const reviewsResult = await dbClient.query(reviewsQuery, [contractId]);
    const reviews = reviewsResult.rows.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      user: {
        displayName: 'Anonymous', // Simplified for now
        email: 'anonymous@example.com'
      },
      createdAt: review.createdAt
    }));
    
    // Format contract for frontend
    const formattedContract = {
      id: contract.id,
      title: contract.title,
      category: contract.category,
      region: contract.region,
      priceCents: contract.priceCents,
      unit: contract.unit,
      quantity: contract.quantity,
      description: contract.description,
      vendorName: contract.vendorName,
      takenOn: contract.takenOn,
      createdAt: contract.createdAt,
      fileKey: contract.thumbKey, // Using thumbKey as fileKey for now
      thumbKey: contract.thumbKey,
      priceDisplay: `$${(contract.priceCents / 100).toFixed(0)}`,
      pricePerUnit: contract.unit && contract.quantity 
        ? `$${(contract.priceCents / contract.quantity).toFixed(2)}/${contract.unit}`
        : undefined,
      user: {
        displayName: userProfile.displayName,
        email: userProfile.email || contract.uploaderEmail
      },
      tags,
      reviews
    };
    
    return NextResponse.json(formattedContract);
    
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  } finally {
    try {
      await dbClient.end();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
}
