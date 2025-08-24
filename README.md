# You Paid What - MVP

Crowdsourced pricing transparency for real-world projects (home, auto, legal, services). Users upload a redacted contract to unlock unlimited browsing of others' uploads.

## 🚀 Features

- **Upload-to-Unlock**: Users must upload one approved contract to see full pricing data
- **File Upload**: Support for PDF, JPG, and PNG files up to 10MB
- **Manual Redaction**: Simple tools to blur personal information before posting
- **Browse & Search**: Filter by category, location, and keywords
- **Pricing Statistics**: See average, min, and max prices when unlocked
- **Community Voting**: Thumbs up/down for contract usefulness
- **Admin Moderation**: Review and approve/reject submissions

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (email/password + Google)
- **File Storage**: AWS S3 for contracts and thumbnails
- **File Processing**: Sharp for images, PDF-lib for PDFs

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- AWS S3 bucket (or Cloudflare R2)
- Clerk account for authentication

## 🛠️ Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd youpaidwhat
npm install
```

### 2. Environment Configuration

Copy the environment example file and fill in your values:

```bash
cp env.example .env.local
```

Required environment variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/youpaidwhat"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# AWS S3 Configuration
S3_BUCKET="your-s3-bucket-name"
S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"

# Clerk Authentication
CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-publishable-key"
CLERK_SECRET_KEY="sk_test_your-clerk-secret-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PORT="8080"

# Admin Configuration
ADMIN_EMAILS="admin@example.com,another-admin@example.com"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:frontend  # Next.js on :3000
npm run dev:backend   # Express on :8080
```

## 🗄️ Database Schema

The application uses the following main models:

- **User**: Authentication and unlock status
- **Contract**: Main contract data with pricing and metadata
- **Review**: User votes and comments
- **ContractTag**: Searchable tags
- **Event**: Analytics and tracking

## 🔐 Authentication

The app uses Clerk for authentication. Users can:
- Sign up with email/password
- Sign in with Google
- Access is required for browsing and uploading

## 📁 File Upload Flow

1. **Upload**: User selects PDF/JPG/PNG file
2. **Redaction**: Draw boxes over personal information
3. **Metadata**: Fill in contract details
4. **Review**: Preview submission before sending
5. **Moderation**: Admin reviews and approves/rejects
6. **Unlock**: First approval unlocks full access for user

## 🎯 API Endpoints

### Public Endpoints
- `GET /api/v1/contracts` - Browse contracts (limited for locked users)
- `GET /api/v1/contracts/:id` - View single contract
- `GET /api/v1/categories` - List categories
- `GET /api/v1/regions` - List regions
- `GET /api/v1/tags` - Search tags

### Authenticated Endpoints
- `POST /api/v1/contracts` - Upload new contract
- `PATCH /api/v1/contracts/:id/review` - Vote on contract

### Admin Endpoints
- `GET /api/v1/admin/contracts` - View pending contracts
- `POST /api/v1/admin/contracts/:id/status` - Approve/reject contract

## 🎨 Frontend Components

- **UploadDropzone**: File upload with drag & drop
- **RedactionCanvas**: Interactive redaction tool
- **MetadataForm**: Contract details form
- **FiltersBar**: Search and filter controls
- **ContractCard**: Display contract information
- **StatsBar**: Pricing statistics
- **LockNotice**: Upload-to-unlock messaging

## 🔒 Security Features

- Input sanitization to prevent XSS
- File type and size validation
- Rate limiting on API endpoints
- Secure file storage with S3
- Original files discarded after redaction
- Admin-only moderation

## 📊 Analytics

The app tracks key events:
- Upload funnel steps
- Search and filter usage
- Contract approvals and unlocks
- User engagement metrics

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel
```

### Backend (Render/Fly.io/EC2)
```bash
npm run build
# Deploy Express server
```

### Database
- Use managed PostgreSQL (Neon, Supabase, RDS)
- Run migrations with `prisma db push`

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📝 Development Notes

- The app uses a "upload-to-unlock" model where users must contribute before accessing full data
- File redaction is done client-side with coordinates sent to server
- Server applies redactions and stores only the redacted version
- Admin approval unlocks browsing for users
- MVP focuses on core functionality with room for future enhancements

## 🔮 Future Enhancements

- AI-powered redaction
- Advanced analytics and reporting
- Mobile app
- API for third-party integrations
- Premium features and monetization
- Regional pricing insights
- Contractor marketplace

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is an MVP implementation. For questions or issues, please contact the development team.
