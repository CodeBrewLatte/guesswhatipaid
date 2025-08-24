# You Paid What - Crowdsourced Pricing Transparency

A modern web application that provides crowdsourced pricing transparency for real-world projects. Users can upload contracts, quotes, and invoices to help others understand fair market prices for various services.

## 🚀 Features

- **Upload-to-Unlock Model**: Users must upload one approved contract to access full pricing data
- **File Upload & Redaction**: Support for PDF, JPG, and PNG files with built-in redaction tools
- **Browse & Search**: Filter contracts by category, location, and price range
- **Authentication**: Secure user accounts with email/password and Google OAuth
- **Admin Moderation**: Review and approve/reject submissions
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage / Cloudflare R2
- **Deployment**: Vercel (frontend) + Render/Fly.io (backend)

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Supabase account for authentication and storage

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd guesswhatipaid
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp env.example .env.local
```

### 4. Database setup
```bash
npm run db:generate
npm run db:push
```

### 5. Start development
```bash
npm run dev
```

Your app will be running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

## 🌐 Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Backend (Render/Fly.io)
1. Deploy the Express server as a web service
2. Update environment variables
3. Connect to your domain

## 📱 Screenshots

- Homepage with logo and hero section
- Browse contracts with filters
- Upload interface with redaction tools
- Admin review dashboard

## 🤝 Contributing

This is a personal project. For questions or issues, please contact the development team.

## 📄 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.
