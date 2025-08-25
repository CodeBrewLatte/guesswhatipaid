import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../../src/utils/supabase';

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
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

    // Update user data
    const updateData: any = { 
      region: region,
      displayName: displayName || null
    };

    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }

    const { error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

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
  }
}
