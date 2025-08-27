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
    
    // Start with hardcoded categories as baseline
    const hardcodedCategories = [
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
    
    try {
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
      
      // Merge hardcoded with dynamic categories
      const dynamicCategories = categoryStatsResult.rows.map(row => ({
        name: row.category,
        count: parseInt(row.count)
      }));
      
      // Combine hardcoded with dynamic, updating counts for existing ones
      const allCategories = hardcodedCategories.map(hardcoded => {
        const dynamic = dynamicCategories.find(d => d.name === hardcoded.name);
        return dynamic ? { ...hardcoded, count: dynamic.count } : hardcoded;
      });
      
      // Add any new dynamic categories that aren't in hardcoded list
      const newCategories = dynamicCategories.filter(dynamic => 
        !hardcodedCategories.some(hardcoded => hardcoded.name === dynamic.name)
      );
      
      const finalCategories = [...allCategories, ...newCategories];
      
      console.log('Categories query successful (direct DB)');
      
      return NextResponse.json({
        success: true,
        categories: finalCategories,
        message: 'Categories retrieved successfully via direct client'
      });
      
    } catch (dbError) {
      console.error('Database query failed, using hardcoded categories:', dbError);
      
      // If database fails, return hardcoded categories
      return NextResponse.json({
        success: true,
        categories: hardcodedCategories,
        message: 'Using hardcoded categories due to database error',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error in categories (direct DB):', error);
    
    // Final fallback to hardcoded categories
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
      message: 'Using fallback categories due to critical error',
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
