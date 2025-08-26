import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API routing is working!',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST method is working!',
    timestamp: new Date().toISOString()
  });
}

export async function PUT() {
  return NextResponse.json({ 
    message: 'PUT method is working!',
    timestamp: new Date().toISOString()
  });
}
