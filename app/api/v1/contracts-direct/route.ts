import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

export async function POST(request: NextRequest) {
  const dbClient = getDirectDbClient();
  
  try {
    console.log('Contract upload request started (direct DB)');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }
    
    // Get the user from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Create a Supabase client with the user's JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Ensure user has an email
    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const redactions = JSON.parse(formData.get('redactions') as string);
    const category = formData.get('category') as string;
    const priceCents = formData.get('priceCents') as string;
    const unit = formData.get('unit') as string;
    const quantity = formData.get('quantity') as string;
    const description = formData.get('description') as string;
    const vendorName = formData.get('vendorName') as string;
    const takenOn = formData.get('takenOn') as string;
    const region = formData.get('region') as string;
    const tags = formData.getAll('tags[]') as string[];

    // Validate required fields
    if (!file || !category || !priceCents || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: file, category, price, and region are required' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileName = `contract-${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(fileName);

    // Connect to database
    await dbClient.connect();

    // Create contract record in database using direct SQL
    const contractResult = await dbClient.query(
      `INSERT INTO "Contract" (
        "id", "title", "description", "priceCents", "unit", "quantity", 
        "category", "region", "thumbKey", "vendorName", "takenOn", 
        "uploaderEmail", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      ) RETURNING id`,
      [
        description || 'Contract Upload',
        description,
        parseInt(priceCents),
        unit || null,
        quantity ? parseFloat(quantity) : null,
        category,
        region,
        urlData.publicUrl,
        vendorName || null,
        takenOn ? new Date(takenOn) : null,
        user.email
      ]
    );

    const contractId = contractResult.rows[0].id;

    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (tag.trim()) {
          await dbClient.query(
            `INSERT INTO "ContractTag" ("id", "contractId", "tag", "createdAt", "updatedAt") 
             VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())`,
            [contractId, tag.trim()]
          );
        }
      }
    }

    console.log('Contract created successfully:', contractId);

    return NextResponse.json({
      success: true,
      message: 'Contract uploaded successfully',
      contractId: contractId,
      fileUrl: urlData.publicUrl
    });

  } catch (error) {
    console.error('Error in contract upload (direct DB):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
