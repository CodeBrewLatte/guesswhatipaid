import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Global Prisma client for serverless environment
declare global {
  var __prisma: any;
}

export async function GET(request: NextRequest) {
  const prisma = getPrismaClient();
  
  try {
    // Explicitly connect to ensure clean connection
    await prisma.$connect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const q = searchParams.get('q');
    const min = searchParams.get('min');
    const max = searchParams.get('max');
    const sort = searchParams.get('sort') || 'newest';
    
    // Build where clause for filtering
    const where: any = {
      status: 'APPROVED' // Only show approved contracts
    };
    
    if (category) where.category = category;
    if (region) where.region = region;
    if (q) {
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { vendorName: { contains: q, mode: 'insensitive' } }
      ];
    }
    if (min || max) {
      where.priceCents = {};
      if (min) where.priceCents.gte = parseInt(min) * 100;
      if (max) where.priceCents.lte = parseInt(max) * 100;
    }
    
    // Build order by clause
    let orderBy: any = {};
    if (sort === 'newest') orderBy.createdAt = 'desc';
    else if (sort === 'oldest') orderBy.createdAt = 'asc';
    else if (sort === 'price-low') orderBy.priceCents = 'asc';
    else if (sort === 'price-high') orderBy.priceCents = 'desc';
    
    // Get contracts with pagination
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: { reviews: true }
          }
        }
      }),
      prisma.contract.count({ where })
    ]);
    
    // Calculate stats
    const stats = await prisma.contract.aggregate({
      where: { status: 'APPROVED' },
      _avg: { priceCents: true },
      _min: { priceCents: true },
      _max: { priceCents: true }
    });
    
    // Format contracts for frontend
    const items = contracts.map((contract: any) => ({
      id: contract.id,
      category: contract.category,
      region: contract.region,
      priceCents: contract.priceCents,
      unit: contract.unit,
      quantity: contract.quantity,
      thumbKey: contract.thumbKey,
      description: contract.description,
      vendorName: contract.vendorName,
      takenOn: contract.takenOn,
      createdAt: contract.createdAt,
      priceDisplay: `$${(contract.priceCents / 100).toFixed(0)}`,
      pricePerUnit: contract.unit && contract.quantity 
        ? `$${(contract.priceCents / contract.quantity).toFixed(2)}/${contract.unit}`
        : undefined,
      _count: contract._count
    }));
    
    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total
      },
      stats: stats._avg.priceCents ? {
        avg: Math.round(stats._avg.priceCents / 100),
        min: Math.round(stats._min.priceCents / 100),
        max: Math.round(stats._max.priceCents / 100)
      } : null,
      locked: false // All approved contracts are visible
    });
    
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  } finally {
    // Explicitly disconnect to ensure clean connection
    await prisma.$disconnect();
  }
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

export async function POST(request: NextRequest) {
  const prisma = getPrismaClient();
  
  try {
    // Explicitly connect to ensure clean connection
    await prisma.$connect();
    
    console.log('Contract upload request started');
    
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

    // Create contract record in database
    const contract = await prisma.contract.create({
      data: {
        title: description || 'Contract Upload',
        description: description,
        priceCents: parseInt(priceCents),
        unit: unit || null,
        quantity: quantity ? parseFloat(quantity) : null,
        category: category,
        region: region,
        thumbKey: urlData.publicUrl,
        vendorName: vendorName || null,
        takenOn: takenOn ? new Date(takenOn) : null,
        uploaderEmail: user.email
      }
    });

    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (tag.trim()) {
          await prisma.contractTag.create({
            data: {
              contractId: contract.id,
              tag: tag.trim()
            }
          });
        }
      }
    }

    console.log('Contract created successfully:', contract.id);

    return NextResponse.json({
      success: true,
      message: 'Contract uploaded successfully',
      contractId: contract.id,
      fileUrl: urlData.publicUrl
    });

  } catch (error) {
    console.error('Error in contract upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Explicitly disconnect to ensure clean connection
    await prisma.$disconnect();
  }
}
