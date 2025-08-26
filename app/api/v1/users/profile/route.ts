import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering since we use request headers
export const dynamic = 'force-dynamic';

// Global Prisma client for serverless environment
declare global {
  var __prisma: any;
}

function getPrismaClient() {
  if (process.env.NODE_ENV === 'production') {
    // In production (Vercel), create a new client each time
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient();
  } else {
    // In development, use global singleton
    if (!global.__prisma) {
      const { PrismaClient } = require('@prisma/client');
      global.__prisma = new PrismaClient();
    }
    return global.__prisma;
  }
}

export async function GET(request: NextRequest) {
  const prisma = getPrismaClient();
  
  try {
    console.log('Profile GET request started');
    
    // Explicitly connect to ensure clean connection
    await prisma.$connect();
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment variables check:', { 
      supabaseUrl: !!supabaseUrl, 
      supabaseAnonKey: !!supabaseAnonKey 
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables:', { 
        supabaseUrl: !!supabaseUrl, 
        supabaseAnonKey: !!supabaseAnonKey 
      });
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }
    
    // Get the user from the request
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('Token extracted, length:', token.length);
    
    // Create a Supabase client with the user's access token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('Supabase client created, attempting to get user...');
    
    // Set the user's access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('User authenticated successfully, email:', user.email);
    
    // Ensure user has an email
    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get user profile from database
    console.log('Attempting to fetch profile for email:', user.email);
    
    const userProfile = await prisma.userProfile.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        displayName: true,
        region: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Database query result:', userProfile);

    if (!userProfile) {
      console.log('No profile found, returning default profile');
      // Return default profile if none exists
      return NextResponse.json({
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || null,
        region: null,
        profileImageUrl: user.user_metadata?.avatar_url || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log('Returning existing profile:', userProfile);
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Explicitly disconnect to ensure clean connection
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  const prisma = getPrismaClient();
  
  try {
    // Explicitly connect to ensure clean connection
    await prisma.$connect();
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables:', { 
        supabaseUrl: !!supabaseUrl, 
        supabaseAnonKey: !!supabaseAnonKey 
      });
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }
    
    // Create a Supabase client with the user's access token
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
    let profileImageUrl = null;
    if (profileImage) {
      try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const fileType = profileImage.type;
        
        if (!allowedTypes.includes(fileType)) {
          console.error('Invalid file type:', fileType);
          return NextResponse.json(
            { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
            { status: 400 }
          );
        }
        
        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (profileImage.size > maxSize) {
          console.error('File too large:', profileImage.size);
          return NextResponse.json(
            { error: 'File too large. Maximum size is 5MB.' },
            { status: 400 }
          );
        }
        
        // Validate file extension
        const fileName = profileImage.name.toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
          console.error('Invalid file extension:', fileExtension);
          return NextResponse.json(
            { error: 'Invalid file extension. Only .jpg, .jpeg, .png, and .webp files are allowed.' },
            { status: 400 }
          );
        }
        
        console.log('Image validation passed:', {
          type: fileType,
          size: profileImage.size,
          extension: fileExtension,
          name: profileImage.name
        });
        
        // Upload image to Supabase Storage
        const safeFileName = `profile-${user.id}-${Date.now()}${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(safeFileName, profileImage, {
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
          .getPublicUrl(safeFileName);
        
        profileImageUrl = urlData.publicUrl;
        console.log('Image upload successful:', profileImageUrl);
        
      } catch (uploadError) {
        console.error('Error handling image upload:', uploadError);
        return NextResponse.json(
          { error: 'Failed to process profile image' },
          { status: 500 }
        );
      }
    }

    // Update or create user profile in our simplified database
    console.log('Attempting to upsert profile with data:', {
      email: user.email,
      displayName: displayName || null,
      region: region,
      profileImageUrl: profileImageUrl || null
    });
    
    const userProfile = await prisma.userProfile.upsert({
      where: { email: user.email },
      update: {
        displayName: displayName || null,
        region: region,
        profileImageUrl: profileImageUrl || null,
        updatedAt: new Date()
      },
      create: {
        email: user.email,
        displayName: displayName || null,
        region: region,
        profileImageUrl: profileImageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Profile upsert result:', userProfile);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      region: region,
      displayName: displayName,
      profileImageUrl: profileImageUrl
    });

  } catch (error) {
    console.error('Error in profile update:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Explicitly disconnect to ensure clean connection
    await prisma.$disconnect();
  }
}
