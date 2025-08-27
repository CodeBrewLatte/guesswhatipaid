# Technical Documentation - GuessWhatIPaid App

## **Overview**
This document explains the complete technical architecture of the GuessWhatIPaid application, including database setup, API endpoints, authentication, and how all components interact.

## **Architecture Components**

### **1. Database Layer**
- **Primary Database**: PostgreSQL hosted on Supabase
- **ORM**: Prisma (with known issues in Vercel serverless)
- **Direct Access**: PostgreSQL client (`pg`) for critical operations

#### **Database Tables**
- **UserProfile**: User account information (email, displayName, region, profileImageUrl)
- **Contract**: Uploaded contracts with metadata (price, category, region, vendor, etc.)
- **ContractTag**: Tags associated with contracts
- **Review**: Contract reviews and ratings

#### **Known Database Issues**
- **Prisma + Vercel**: "prepared statement already exists" errors in serverless environment
- **Solution**: Bypass Prisma for critical operations using direct PostgreSQL connections
- **SSL Issues**: Supabase requires `sslmode=no-verify` for direct connections

### **2. Authentication System**
- **Provider**: Supabase Auth
- **Token Management**: JWT tokens with Bearer authentication
- **Session Handling**: Client-side session management with auto-refresh

#### **Authentication Flow**
1. User signs in via Supabase Auth
2. Access token stored in client session
3. All API calls include `Authorization: Bearer {token}` header
4. API validates token with Supabase before processing requests

### **3. Storage System**
- **Provider**: Supabase Storage
- **Buckets**:
  - `avatars`: Profile images (public read, authenticated upload)
  - `contracts`: Contract PDFs (public read, authenticated upload)
- **Policies**: Row-level security (RLS) for access control

#### **Storage Policies**
```sql
-- Example for avatars bucket
SELECT: bucket_id = 'avatars' (public read)
INSERT: bucket_id = 'avatars' AND auth.role() = 'authenticated'
UPDATE: bucket_id = 'avatars' AND auth.role() = 'authenticated'
DELETE: bucket_id = 'avatars' AND auth.role() = 'authenticated'
```

### **4. API Endpoints**

#### **Working Endpoints (Direct PostgreSQL)**
- **`/api/v1/users/profile-direct`**: User profile operations (GET/PUT)
  - Bypasses Prisma entirely
  - Uses direct PostgreSQL connections
  - Handles profile updates and image uploads
- **`/api/v1/regions-direct`**: Available regions (GET)
  - Direct PostgreSQL query for unique regions
  - Used by contract upload workflow and browse filters
- **`/api/v1/categories-direct`**: Contract categories (GET)
  - Direct PostgreSQL query for unique categories
  - Used by contract upload workflow and browse filters

#### **Broken Endpoints (Prisma)**
- **`/api/v1/users/profile`**: Original profile endpoint
  - Suffers from "prepared statement already exists" errors
  - Intermittent failures in Vercel environment
  - Should be avoided
- **`/api/v1/regions`**: Original regions endpoint
  - Same Prisma connection issues
  - Use `/api/v1/regions-direct` instead
- **`/api/v1/categories`**: Original categories endpoint
  - Same Prisma connection issues
  - Use `/api/v1/categories-direct` instead

#### **Other Endpoints**
- **`/api/v1/contracts`**: Contract upload and management
- **`/api/v1/debug-db-direct`**: Database diagnostics

### **5. Frontend Architecture**

#### **Pages**
- **`/`**: Home page with region setup
- **`/profile`**: User profile management
- **`/upload`**: Contract upload workflow
- **`/browse`**: Contract browsing
- **`/contracts/[id]`**: Individual contract view

#### **Components**
- **`RegionSetupModal`**: Region selection and setup
- **`UploadDropzone`**: File upload interface
- **`RedactionCanvas`**: PDF redaction tool
- **`MetadataForm`**: Contract metadata input
- **`ContractCard`**: Contract display component

#### **State Management**
- **React Hooks**: useState, useEffect for local state
- **Context**: AuthContext for user authentication state
- **Local Storage**: Minimal, mostly session-based

### **6. Deployment & Environment**

#### **Platform**: Vercel
- **Framework**: Next.js 14.2.32
- **Runtime**: Serverless functions
- **Build Process**: `prisma generate && next build`

#### **Environment Variables**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_postgres_connection_string
```

#### **Build Issues & Solutions**
- **Prisma Client**: Generated during build process
- **TypeScript**: Strict mode enabled
- **Dependencies**: pg, @prisma/client, @supabase/supabase-js

## **Critical Technical Decisions**

### **1. Why Direct PostgreSQL Instead of Prisma**
- **Problem**: Prisma fails in Vercel serverless with "prepared statement already exists"
- **Solution**: Direct PostgreSQL connections for critical operations
- **Trade-off**: More manual SQL but 100% reliable

### **2. Systematic Prisma Bypass Pattern**
- **Discovery**: All Prisma endpoints suffer from the same connection issues
- **Pattern**: Create `-direct` versions of all critical endpoints
- **Implementation**: Use direct PostgreSQL client with SSL bypass
- **Naming Convention**: `{endpoint-name}-direct` for working versions

### **3. SSL Configuration for Supabase**
- **Issue**: Self-signed certificates cause connection failures
- **Solution**: Modify connection string to use `sslmode=no-verify`
- **Implementation**: String replacement in connection setup

### **4. Authentication Strategy**
- **Approach**: Supabase Auth with JWT tokens
- **Security**: Bearer token authentication on all protected endpoints
- **Session**: Client-side session management

## **Common Issues & Solutions**

### **1. "Prepared Statement Already Exists" Error**
- **Cause**: Prisma connection pooling conflicts in Vercel
- **Solution**: Use direct PostgreSQL endpoints (`/profile-direct`)
- **Prevention**: Avoid Prisma for critical operations

### **2. SSL Certificate Errors**
- **Cause**: Supabase's self-signed certificates
- **Solution**: Use `sslmode=no-verify` in connection string
- **Implementation**: Modify DATABASE_URL before connection

### **3. Profile Data Not Persisting**
- **Cause**: Broken Prisma endpoints
- **Solution**: Use `/api/v1/users/profile-direct` endpoint
- **Verification**: Check Vercel logs for specific error messages

### **4. Regions and Categories Not Loading**
- **Cause**: Same Prisma connection issues affecting multiple endpoints
- **Solution**: Use `/api/v1/regions-direct` and `/api/v1/categories-direct`
- **Impact**: Contract upload workflow and browse filters affected

## **Development Workflow**

### **1. Adding New Features**
- **Database**: Use direct PostgreSQL for reliability
- **API**: Follow existing pattern with proper error handling
- **Frontend**: Update all relevant components consistently

### **2. Fixing Prisma Issues**
- **Pattern**: Create `-direct` version of broken endpoint
- **Implementation**: Use direct PostgreSQL client with SSL bypass
- **Frontend**: Update all components to use new working endpoint
- **Testing**: Verify endpoint works before updating frontend

### **3. Debugging Database Issues**
- **Use**: `/api/v1/debug-db-direct` endpoint
- **Check**: Vercel function logs for specific errors
- **Verify**: Database schema matches Prisma expectations

### **4. Testing Changes**
- **Local**: npm run dev for development
- **Deploy**: git push origin main for Vercel deployment
- **Monitor**: Vercel logs for runtime errors

## **Performance Considerations**

### **1. Database Connections**
- **Strategy**: Fresh connections per request (serverless requirement)
- **Timeout**: 10-30 second timeouts for long operations
- **Cleanup**: Always call `client.end()` in finally blocks

### **2. File Uploads**
- **Validation**: Client and server-side file validation
- **Size Limits**: Configured in Supabase storage policies
- **Processing**: Redaction and metadata extraction workflows

### **3. Caching Strategy**
- **Static**: Next.js static generation where possible
- **Dynamic**: Force dynamic rendering for API routes
- **Session**: Minimal client-side caching

## **Security Considerations**

### **1. Authentication**
- **Token Validation**: Every API call validates Supabase JWT
- **Role-Based Access**: Supabase RLS policies enforce permissions
- **Session Security**: No sensitive data in client storage

### **2. Data Validation**
- **Input Sanitization**: Server-side validation of all inputs
- **File Uploads**: Type, size, and content validation
- **SQL Injection**: Parameterized queries for all database operations

### **3. Storage Security**
- **Bucket Policies**: RLS policies control file access
- **Public vs Private**: Appropriate access levels for different content types
- **Upload Restrictions**: Authenticated users only for sensitive operations

## **Monitoring & Maintenance**

### **1. Logging Strategy**
- **API Calls**: Comprehensive logging of all operations
- **Error Tracking**: Detailed error logging with stack traces
- **Performance**: Connection timing and query performance

### **2. Health Checks**
- **Database**: `/api/v1/debug-db-direct` for connection testing
- **Authentication**: Token validation endpoint testing
- **Storage**: Bucket access verification

### **3. Error Handling**
- **Graceful Degradation**: Fallback mechanisms for failed operations
- **User Feedback**: Clear error messages for common issues
- **Recovery**: Automatic retry mechanisms where appropriate

## **Current Working State**

### **1. Fully Functional Endpoints**
- **Profile Management**: `/api/v1/users/profile-direct` (GET/PUT)
- **Regions**: `/api/v1/regions-direct` (GET)
- **Categories**: `/api/v1/categories-direct` (GET)
- **Contract Upload**: `/api/v1/contracts` (POST)
- **Database Diagnostics**: `/api/v1/debug-db-direct` (GET)

### **2. Working Frontend Components**
- **Profile Page**: Full CRUD operations with image uploads
- **Contract Upload**: Complete workflow with metadata
- **Browse Page**: Filters and search functionality
- **Region Setup**: User region configuration

## **Future Improvements**

### **1. Database Layer**
- **Connection Pooling**: Implement proper connection management
- **Query Optimization**: Add database indexes for performance
- **Migration Strategy**: Automated schema updates

### **2. Caching Layer**
- **Redis Integration**: Session and data caching
- **CDN**: Static asset delivery optimization
- **API Caching**: Response caching for read operations

### **3. Monitoring**
- **APM Integration**: Application performance monitoring
- **Error Tracking**: Centralized error reporting
- **Metrics**: Business and technical metrics collection

---

**Note**: This documentation should be updated whenever significant architectural changes are made. Keep it current to ensure quick onboarding and troubleshooting.
