import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient();
  
  try {
    // Get the user from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Create a Supabase client with the user's access token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Set the user's access token
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

    // Get user profile from database
    const userProfile = await prisma.userProfile.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        displayName: true,
        region: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!userProfile) {
      // Return default profile if none exists
      return NextResponse.json({
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || null,
        region: null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  const prisma = new PrismaClient();
  
  try {
    // Create a Supabase client with the user's access token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

    // Parse request data - handle both JSON and multipart form data
    let displayName: string | null = null;
    let region: string | null = null;
    let profileImage: File | null = null;

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle multipart form data (for profile updates with images)
      const formData = await request.formData();
      displayName = formData.get('displayName') as string;
      region = formData.get('region') as string;
      profileImage = formData.get('profileImage') as File | null;
    } else {
      // Handle JSON data (for simple region updates)
      const jsonData = await request.json();
      displayName = jsonData.displayName || null;
      region = jsonData.region || null;
      profileImage = null; // No image in JSON requests
    }
    
    if (!region) {
      return NextResponse.json(
        { error: 'Region is required' },
        { status: 400 }
      );
    }

    // Handle profile image upload if provided
    let avatarUrl = null;
    if (profileImage) {
      try {
        // Upload image to Supabase Storage
        const fileName = `profile-${user.id}-${Date.now()}.${profileImage.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profileImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload profile image' },
            { status: 500 }
          );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        avatarUrl = urlData.publicUrl;
      } catch (uploadError) {
        console.error('Error handling image upload:', uploadError);
        return NextResponse.json(
          { error: 'Failed to process profile image' },
          { status: 500 }
        );
      }
    }

    // Update or create user profile in our simplified database
    const userProfile = await prisma.userProfile.upsert({
      where: { email: user.email },
      update: {
        displayName: displayName || null,
        region: region,
        avatarUrl: avatarUrl || null
      },
      create: {
        email: user.email,
        displayName: displayName || null,
        region: region,
        avatarUrl: avatarUrl || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      region: region,
      displayName: displayName,
      avatarUrl: avatarUrl
    });

  } catch (error) {
    console.error('Error in profile update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
