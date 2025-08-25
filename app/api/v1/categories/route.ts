import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { contracts: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    const formattedCategories = categories.map(category => ({
      name: category.name,
      description: category.description,
      count: category._count.contracts
    }))

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
