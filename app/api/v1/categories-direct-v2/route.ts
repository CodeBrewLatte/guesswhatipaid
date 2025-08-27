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
    console.log('Categories request started (direct DB)');
    
    // Connect to database
    await dbClient.connect();
    
    // Get categories from Contract table with counts
    const categoryStatsResult = await dbClient.query(`
      SELECT category, COUNT(*) as count 
      FROM "Contract" 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    const categories = categoryStatsResult.rows.map(row => ({
      name: row.category,
      count: parseInt(row.count)
    }));
    
    console.log('Categories query successful (direct DB)');
    
    return NextResponse.json({
      success: true,
      categories: categories,
      message: 'Categories retrieved successfully via direct client'
    });

  } catch (error) {
    console.error('Error in categories (direct DB):', error);
    
    // Fallback to hardcoded categories if database fails
    const fallbackCategories = [
      { name: 'Home Maintenance', count: 0 },
      { name: 'Plumbing', count: 0 },
      { name: 'Electrical', count: 0 },
      { name: 'HVAC', count: 0 },
      { name: 'Landscaping', count: 0 },
      { name: 'Roofing', count: 0 },
      { name: 'Painting', count: 0 },
      { name: 'Flooring', count: 0 },
      { name: 'Kitchen Remodel', count: 0 },
      { name: 'Bathroom Remodel', count: 0 },
      { name: 'General Contracting', count: 0 },
      { name: 'Other', count: 0 }
    ];
    
    return NextResponse.json({
      success: true,
      categories: fallbackCategories,
      message: 'Using fallback categories due to database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    // Always disconnect
    try {
      await dbClient.end();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
}
