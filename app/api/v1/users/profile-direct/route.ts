import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    console.log('Profile GET request started (direct DB)');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!supabaseUrl || !supabaseAnonKey || !databaseUrl) {
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
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
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

    console.log('User authenticated successfully, email:', user.email);
    
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
    
    // Fetch user profile using direct SQL
    const profileResult = await client.query(
      'SELECT * FROM "UserProfile" WHERE email = $1',
      [user.email]
    );
    
    await client.end();
    
    if (profileResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Profile not found',
        region: null,
        displayName: null,
        profileImageUrl: null
      });
    }
    
    const profile = profileResult.rows[0];
    console.log('Profile fetched successfully:', profile);
    
    return NextResponse.json({
      success: true,
      message: 'Profile fetched successfully',
      region: profile.region,
      displayName: profile.displayName,
      profileImageUrl: profile.profileImageUrl
    });

  } catch (error) {
    console.error('Error in profile fetch (direct DB):', error);
    if (client) {
      await client.end();
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    console.log('Profile PUT request started (direct DB)');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!supabaseUrl || !supabaseAnonKey || !databaseUrl) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Get the user from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
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

    // Parse request data
    let displayName: string | null = null;
    let region: string | null = null;
    let profileImage: File | null = null;

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      displayName = formData.get('displayName') as string;
      region = formData.get('region') as string;
      profileImage = formData.get('profileImage') as File | null;
    } else {
      const jsonData = await request.json();
      displayName = jsonData.displayName || null;
      region = jsonData.region || null;
      profileImage = null;
    }
    
    if (!region) {
      return NextResponse.json(
        { error: 'Region is required' },
        { status: 400 }
      );
    }

    // Handle profile image upload if provided
    let profileImageUrl = null;
    if (profileImage) {
      try {
        const fileName = `avatar-${user.id}-${Date.now()}.${profileImage.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profileImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload profile image' },
            { status: 500 }
          );
        }

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        profileImageUrl = urlData.publicUrl;
      } catch (uploadError) {
        console.error('Error handling image upload:', uploadError);
        return NextResponse.json(
          { error: 'Failed to process profile image' },
          { status: 500 }
        );
      }
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
    
    // Update or create user profile using direct SQL
    let userProfile;
    
    // Check if profile exists
    const existingResult = await client.query(
      'SELECT * FROM "UserProfile" WHERE email = $1',
      [user.email]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing profile
      const updateResult = await client.query(
        `UPDATE "UserProfile" 
         SET "displayName" = $1, region = $2, "profileImageUrl" = $3, "updatedAt" = $4
         WHERE email = $5
         RETURNING *`,
        [displayName || null, region, profileImageUrl || null, new Date(), user.email]
      );
      userProfile = updateResult.rows[0];
    } else {
      // Create new profile
      const createResult = await client.query(
        `INSERT INTO "UserProfile" (id, email, "displayName", region, "profileImageUrl", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user.email, displayName || null, region, profileImageUrl || null, new Date(), new Date()]
      );
      userProfile = createResult.rows[0];
    }
    
    await client.end();
    
    console.log('Profile updated successfully:', userProfile);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      region: region,
      displayName: displayName,
      profileImageUrl: profileImageUrl
    });

  } catch (error) {
    console.error('Error in profile update (direct DB):', error);
    if (client) {
      await client.end();
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
