import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get categories from contracts table (simplified approach)
    const categoryStats = await prisma.contract.groupBy({
      by: ['category'],
      where: { status: 'APPROVED' },
      _count: { category: true }
    })

    // Create predefined categories with counts
    const predefinedCategories = [
      { name: 'Home Renovation', description: 'Home improvement and renovation projects' },
      { name: 'Legal Services', description: 'Legal advice and representation' },
      { name: 'Web Development', description: 'Website and web application development' },
      { name: 'Marketing', description: 'Digital marketing and advertising services' },
      { name: 'Consulting', description: 'Business and professional consulting' },
      { name: 'Design', description: 'Graphic design and creative services' },
      { name: 'Maintenance', description: 'Property and equipment maintenance' },
      { name: 'Transportation', description: 'Moving and transportation services' }
    ]

    // Merge predefined categories with actual contract counts
    const categories = predefinedCategories.map(cat => {
      const stats = categoryStats.find(stat => stat.category === cat.name)
      return {
        name: cat.name,
        description: cat.description,
        count: stats ? stats._count.category : 0
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
