import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      include: {
        _count: {
          select: { contracts: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    const formattedRegions = regions.map(region => ({
      name: region.name,
      code: region.code,
      count: region._count.contracts
    }))

    return NextResponse.json(formattedRegions)
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    )
  }
}
