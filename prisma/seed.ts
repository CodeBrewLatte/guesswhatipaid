import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      displayName: 'John Smith',
      hasUnlocked: true
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      displayName: 'Sarah Johnson',
      hasUnlocked: true
    }
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      email: 'mike@example.com',
      displayName: 'Mike Wilson',
      hasUnlocked: false
    }
  })

  console.log('✅ Users created')

  // Sample categories and regions
  const categories = [
    'Home>Flooring',
    'Home>Kitchen',
    'Home>Bathroom',
    'Home>Roofing',
    'Auto>Brakes',
    'Auto>Oil Change',
    'Auto>Tires',
    'Legal>Contract Review',
    'Legal>Estate Planning',
    'Professional>Web Design',
    'Professional>Consulting'
  ]

  const regions = ['NJ', 'NY', 'CA', 'TX', 'FL', 'IL']

  // Create sample contracts
  const contracts = [
    // Home & Garden
    {
      userId: user1.id,
      category: 'Home>Flooring',
      region: 'NJ',
      priceCents: 12000,
      unit: 'sqft',
      quantity: 800,
      description: 'Hardwood floor installation - 800 sqft of oak flooring',
      vendorName: 'Premium Floors Inc',
      takenOn: new Date('2024-01-15'),
      status: 'APPROVED' as const,
      tags: ['hardwood', 'oak', 'installation']
    },
    {
      userId: user1.id,
      category: 'Home>Kitchen',
      region: 'NJ',
      priceCents: 25000,
      unit: 'flat',
      description: 'Complete kitchen remodel including cabinets, countertops, and appliances',
      vendorName: 'Kitchen Masters',
      takenOn: new Date('2024-02-20'),
      status: 'APPROVED' as const,
      tags: ['remodel', 'cabinets', 'countertops']
    },
    {
      userId: user2.id,
      category: 'Home>Bathroom',
      region: 'NY',
      priceCents: 8500,
      unit: 'flat',
      description: 'Bathroom renovation with new tile, fixtures, and vanity',
      vendorName: 'Bathroom Pros',
      takenOn: new Date('2024-01-30'),
      status: 'APPROVED' as const,
      tags: ['renovation', 'tile', 'fixtures']
    },
    {
      userId: user2.id,
      category: 'Home>Roofing',
      region: 'NY',
      priceCents: 18000,
      unit: 'sqft',
      quantity: 1200,
      description: 'Asphalt shingle roof replacement for 1200 sqft home',
      vendorName: 'Roof Right',
      takenOn: new Date('2024-03-10'),
      status: 'APPROVED' as const,
      tags: ['asphalt', 'shingles', 'replacement']
    },

    // Auto & Transport
    {
      userId: user1.id,
      category: 'Auto>Brakes',
      region: 'CA',
      priceCents: 450,
      unit: 'flat',
      description: 'Front brake pad replacement and rotor resurfacing',
      vendorName: 'Quick Fix Auto',
      takenOn: new Date('2024-02-15'),
      status: 'APPROVED' as const,
      tags: ['brakes', 'pads', 'rotors']
    },
    {
      userId: user2.id,
      category: 'Auto>Oil Change',
      region: 'CA',
      priceCents: 65,
      unit: 'flat',
      description: 'Full synthetic oil change with filter replacement',
      vendorName: 'Jiffy Lube',
      takenOn: new Date('2024-03-05'),
      status: 'APPROVED' as const,
      tags: ['oil', 'synthetic', 'filter']
    },
    {
      userId: user1.id,
      category: 'Auto>Tires',
      region: 'TX',
      priceCents: 800,
      unit: 'flat',
      description: 'Four new all-season tires with mounting and balancing',
      vendorName: 'Tire World',
      takenOn: new Date('2024-01-25'),
      status: 'APPROVED' as const,
      tags: ['tires', 'all-season', 'mounting']
    },

    // Legal Services
    {
      userId: user2.id,
      category: 'Legal>Contract Review',
      region: 'TX',
      priceCents: 500,
      unit: 'hour',
      quantity: 2,
      description: 'Contract review and negotiation for business agreement',
      vendorName: 'Smith & Associates Law',
      takenOn: new Date('2024-02-28'),
      status: 'APPROVED' as const,
      tags: ['contract', 'review', 'business']
    },
    {
      userId: user1.id,
      category: 'Legal>Estate Planning',
      region: 'FL',
      priceCents: 1500,
      unit: 'flat',
      description: 'Complete estate planning including will and trust documents',
      vendorName: 'Estate Law Partners',
      takenOn: new Date('2024-03-01'),
      status: 'APPROVED' as const,
      tags: ['estate', 'planning', 'will', 'trust']
    },

    // Professional Services
    {
      userId: user2.id,
      category: 'Professional>Web Design',
      region: 'FL',
      priceCents: 3000,
      unit: 'flat',
      description: 'Professional website design for small business',
      vendorName: 'Digital Creations',
      takenOn: new Date('2024-02-10'),
      status: 'APPROVED' as const,
      tags: ['website', 'design', 'business']
    },
    {
      userId: user1.id,
      category: 'Professional>Consulting',
      region: 'IL',
      priceCents: 150,
      unit: 'hour',
      quantity: 20,
      description: 'Business strategy consulting for startup company',
      vendorName: 'Strategic Solutions',
      takenOn: new Date('2024-01-20'),
      status: 'APPROVED' as const,
      tags: ['consulting', 'strategy', 'startup']
    },

    // Some pending contracts
    {
      userId: user3.id,
      category: 'Home>Flooring',
      region: 'IL',
      priceCents: 9500,
      unit: 'sqft',
      quantity: 600,
      description: 'Laminate flooring installation for basement',
      vendorName: 'Basement Floors',
      takenOn: new Date('2024-03-15'),
      status: 'PENDING' as const,
      tags: ['laminate', 'basement', 'installation']
    }
  ]

  for (const contractData of contracts) {
    const { tags, ...contractFields } = contractData
    
    const contract = await prisma.contract.create({
      data: {
        ...contractFields,
        fileKey: `sample/contract-${Math.random().toString(36).substr(2, 9)}.pdf`,
        thumbKey: `sample/thumb-${Math.random().toString(36).substr(2, 9)}.jpg`,
        tags: {
          create: tags.map(label => ({ label }))
        }
      }
    })

    // Add some reviews for approved contracts
    if (contract.status === 'APPROVED') {
      const numReviews = Math.floor(Math.random() * 3) + 1
      const users = [user1, user2]
      
      for (let i = 0; i < numReviews; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        if (user.id !== contract.userId) {
          await prisma.review.create({
            data: {
              contractId: contract.id,
              userId: user.id,
              rating: Math.random() > 0.3 ? 1 : -1,
              comment: Math.random() > 0.5 ? 'Great service and fair pricing!' : null
            }
          })
        }
      }
    }
  }

  console.log('✅ Contracts and reviews created')

  // Create some sample events
  const events = [
    { eventType: 'upload_started', userId: user1.id },
    { eventType: 'upload_submitted', userId: user1.id },
    { eventType: 'search_performed', userId: user2.id },
    { eventType: 'result_clicked', userId: user2.id }
  ]

  for (const eventData of events) {
    await prisma.event.create({
      data: eventData
    })
  }

  console.log('✅ Events created')

  console.log('🎉 Database seeding completed!')
  console.log(`Created ${contracts.length} contracts with sample data`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
