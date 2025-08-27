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
    console.log('Regions request started (direct DB)');
    
    // Start with hardcoded US states as baseline
    const hardcodedRegions = [
      { name: 'AL', count: 0 }, { name: 'AK', count: 0 }, { name: 'AZ', count: 0 },
      { name: 'AR', count: 0 }, { name: 'CA', count: 0 }, { name: 'CO', count: 0 },
      { name: 'CT', count: 0 }, { name: 'DE', count: 0 }, { name: 'FL', count: 0 },
      { name: 'GA', count: 0 }, { name: 'HI', count: 0 }, { name: 'ID', count: 0 },
      { name: 'IL', count: 0 }, { name: 'IN', count: 0 }, { name: 'IA', count: 0 },
      { name: 'KS', count: 0 }, { name: 'KY', count: 0 }, { name: 'LA', count: 0 },
      { name: 'ME', count: 0 }, { name: 'MD', count: 0 }, { name: 'MA', count: 0 },
      { name: 'MI', count: 0 }, { name: 'MN', count: 0 }, { name: 'MS', count: 0 },
      { name: 'MO', count: 0 }, { name: 'MT', count: 0 }, { name: 'NE', count: 0 },
      { name: 'NV', count: 0 }, { name: 'NH', count: 0 }, { name: 'NJ', count: 0 },
      { name: 'NM', count: 0 }, { name: 'NY', count: 0 }, { name: 'NC', count: 0 },
      { name: 'ND', count: 0 }, { name: 'OH', count: 0 }, { name: 'OK', count: 0 },
      { name: 'OR', count: 0 }, { name: 'PA', count: 0 }, { name: 'RI', count: 0 },
      { name: 'SC', count: 0 }, { name: 'SD', count: 0 }, { name: 'TN', count: 0 },
      { name: 'TX', count: 0 }, { name: 'UT', count: 0 }, { name: 'VT', count: 0 },
      { name: 'VA', count: 0 }, { name: 'WA', count: 0 }, { name: 'WV', count: 0 },
      { name: 'WI', count: 0 }, { name: 'WY', count: 0 }
    ];
    
    try {
      // Connect to database
      await dbClient.connect();
      
      // Get regions from Contract table with counts
      const regionStatsResult = await dbClient.query(`
        SELECT region, COUNT(*) as count 
        FROM "Contract" 
        WHERE region IS NOT NULL 
        GROUP BY region 
        ORDER BY count DESC
      `);
      
      // Merge hardcoded with dynamic regions
      const dynamicRegions = regionStatsResult.rows.map(row => ({
        name: row.region,
        count: parseInt(row.count)
      }));
      
      // Combine hardcoded with dynamic, updating counts for existing ones
      const allRegions = hardcodedRegions.map(hardcoded => {
        const dynamic = dynamicRegions.find(d => d.name === hardcoded.name);
        return dynamic ? { ...hardcoded, count: dynamic.count } : hardcoded;
      });
      
      // Add any new dynamic regions that aren't in hardcoded list
      const newRegions = dynamicRegions.filter(dynamic => 
        !hardcodedRegions.some(hardcoded => hardcoded.name === dynamic.name)
      );
      
      const finalRegions = [...allRegions, ...newRegions];
      
      console.log('Regions query successful (direct DB)');
      
      return NextResponse.json({
        success: true,
        regions: finalRegions,
        message: 'Regions retrieved successfully via direct client'
      });
      
    } catch (dbError) {
      console.error('Database query failed, using hardcoded regions:', dbError);
      
      // If database fails, return hardcoded regions
      return NextResponse.json({
        success: true,
        regions: hardcodedRegions,
        message: 'Using hardcoded regions due to database error',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error in regions (direct DB):', error);
    
    // Final fallback to hardcoded regions
    const fallbackRegions = [
      { name: 'AL', count: 0 }, { name: 'AK', count: 0 }, { name: 'AZ', count: 0 },
      { name: 'AR', count: 0 }, { name: 'CA', count: 0 }, { name: 'CO', count: 0 },
      { name: 'CT', count: 0 }, { name: 'DE', count: 0 }, { name: 'FL', count: 0 },
      { name: 'GA', count: 0 }, { name: 'HI', count: 0 }, { name: 'ID', count: 0 },
      { name: 'IL', count: 0 }, { name: 'IN', count: 0 }, { name: 'IA', count: 0 },
      { name: 'KS', count: 0 }, { name: 'KY', count: 0 }, { name: 'LA', count: 0 },
      { name: 'ME', count: 0 }, { name: 'MD', count: 0 }, { name: 'MA', count: 0 },
      { name: 'MI', count: 0 }, { name: 'MN', count: 0 }, { name: 'MS', count: 0 },
      { name: 'MO', count: 0 }, { name: 'MT', count: 0 }, { name: 'NE', count: 0 },
      { name: 'NV', count: 0 }, { name: 'NH', count: 0 }, { name: 'NJ', count: 0 },
      { name: 'NM', count: 0 }, { name: 'NY', count: 0 }, { name: 'NC', count: 0 },
      { name: 'ND', count: 0 }, { name: 'OH', count: 0 }, { name: 'OK', count: 0 },
      { name: 'OR', count: 0 }, { name: 'PA', count: 0 }, { name: 'RI', count: 0 },
      { name: 'SC', count: 0 }, { name: 'SD', count: 0 }, { name: 'TN', count: 0 },
      { name: 'TX', count: 0 }, { name: 'UT', count: 0 }, { name: 'VT', count: 0 },
      { name: 'VA', count: 0 }, { name: 'WA', count: 0 }, { name: 'WV', count: 0 },
      { name: 'WI', count: 0 }, { name: 'WY', count: 0 }
    ];
    
    return NextResponse.json({
      success: true,
      regions: fallbackRegions,
      message: 'Using fallback regions due to critical error',
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
