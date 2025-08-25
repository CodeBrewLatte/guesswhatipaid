import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create US states/regions
  const regions = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ]

  console.log('📍 Creating regions...')
  for (const region of regions) {
    await prisma.region.upsert({
      where: { code: region.code },
      update: {},
      create: region
    })
  }

  // Create categories
  const categories = [
    // Home & Garden
    { name: 'Home & Garden', description: 'Home improvement and garden services' },
    { name: 'Kitchen & Bath', description: 'Kitchen and bathroom renovations' },
    { name: 'Flooring', description: 'Flooring installation and repair' },
    { name: 'Roofing', description: 'Roof installation, repair, and maintenance' },
    { name: 'Plumbing', description: 'Plumbing services and repairs' },
    { name: 'Electrical', description: 'Electrical work and repairs' },
    { name: 'HVAC', description: 'Heating, ventilation, and air conditioning' },
    { name: 'Painting', description: 'Interior and exterior painting' },
    { name: 'Landscaping', description: 'Landscape design and maintenance' },
    { name: 'Fencing', description: 'Fence installation and repair' },
    { name: 'Windows & Doors', description: 'Window and door installation' },
    { name: 'Siding', description: 'Exterior siding installation' },
    { name: 'Deck & Patio', description: 'Deck and patio construction' },
    { name: 'Garage & Shed', description: 'Garage and shed construction' },
    
    // Auto & Transport
    { name: 'Auto & Transport', description: 'Automotive and transportation services' },
    { name: 'Car Repair', description: 'General car repair and maintenance' },
    { name: 'Auto Body', description: 'Auto body repair and paint' },
    { name: 'Towing', description: 'Vehicle towing services' },
    { name: 'Car Wash', description: 'Car washing and detailing' },
    { name: 'Tire Service', description: 'Tire sales and service' },
    
    // Professional Services
    { name: 'Professional Services', description: 'Business and professional services' },
    { name: 'Legal', description: 'Legal services and consultation' },
    { name: 'Accounting', description: 'Accounting and bookkeeping services' },
    { name: 'Marketing', description: 'Marketing and advertising services' },
    { name: 'Web Design', description: 'Website design and development' },
    { name: 'Graphic Design', description: 'Graphic design services' },
    { name: 'Photography', description: 'Photography services' },
    { name: 'Video Production', description: 'Video production and editing' },
    
    // Health & Wellness
    { name: 'Health & Wellness', description: 'Health and wellness services' },
    { name: 'Personal Training', description: 'Personal fitness training' },
    { name: 'Massage Therapy', description: 'Massage therapy services' },
    { name: 'Dental', description: 'Dental services' },
    { name: 'Vision', description: 'Vision and eye care services' },
    
    // Events & Entertainment
    { name: 'Events & Entertainment', description: 'Event planning and entertainment' },
    { name: 'Event Planning', description: 'Event planning and coordination' },
    { name: 'Catering', description: 'Catering services' },
    { name: 'DJ Services', description: 'DJ and music services' },
    { name: 'Photography', description: 'Event photography' },
    
    // Technology
    { name: 'Technology', description: 'Technology and IT services' },
    { name: 'Computer Repair', description: 'Computer and laptop repair' },
    { name: 'IT Support', description: 'IT support and consulting' },
    { name: 'Software Development', description: 'Custom software development' },
    { name: 'Data Recovery', description: 'Data recovery services' },
    
    // Education & Training
    { name: 'Education & Training', description: 'Educational and training services' },
    { name: 'Tutoring', description: 'Academic tutoring services' },
    { name: 'Language Lessons', description: 'Language learning services' },
    { name: 'Music Lessons', description: 'Music instruction' },
    { name: 'Driving Lessons', description: 'Driving instruction' },
    
    // Other
    { name: 'Other', description: 'Other services not listed above' }
  ]

  console.log('🏷️ Creating categories...')
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
