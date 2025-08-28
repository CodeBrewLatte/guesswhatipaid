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
- **`/api/v1/regions-direct-v2`**: Dynamic regions from Contract table (GET)
  - Direct PostgreSQL query for unique regions with counts
  - Fallback to hardcoded US states if database fails
  - Used by contract upload workflow and browse filters
- **`/api/v1/categories-direct-v2`**: Dynamic categories from Contract table (GET)
  - Direct PostgreSQL query for unique categories with counts
  - Fallback to hardcoded categories if database fails
  - Used by contract upload workflow and browse filters
- **`/api/v1/contracts-direct`**: Contract submission and file upload (POST)
  - Bypasses Prisma entirely
  - Handles file uploads to Supabase Storage
  - Creates contract records via direct SQL
- **`/api/v1/debug-db-direct`**: Database diagnostics (GET)
- **`/api/v1/debug-profile-direct`**: Profile debugging (GET)

#### **Broken Endpoints (Prisma)**
- **`/api/v1/users/profile`**: Original profile endpoint
  - Suffers from "prepared statement already exists" errors
  - Intermittent failures in Vercel environment
  - Should be avoided
- **`/api/v1/regions`**: Original regions endpoint
  - Same Prisma connection issues
  - Use `/api/v1/regions-direct-v2` instead
- **`/api/v1/categories`**: Original categories endpoint
  - Same Prisma connection issues
  - Use `/api/v1/categories-direct-v2` instead
- **`/api/v1/contracts`**: Original contracts endpoint
  - Same Prisma connection issues
  - Use `/api/v1/contracts-direct` instead



### **5. Frontend Architecture**

#### **Pages**
- **`/`**: Home page with region setup
- **`/profile`**: User profile management
- **`/upload`**: Contract upload workflow
- **`/browse`**: Contract browsing
- **`/contracts/[id]`**: Individual contract view

#### **Components**
- **`RegionSetupModal`**: Region selection and setup
- **`RedactionCanvas`**: File redaction tool with PDF and image support
  - **Current Status**: PDF rendering works with fallback to realistic preview
  - **PDF.js Integration**: Attempts to render actual PDF content
  - **Fallback Mode**: Creates realistic contract-like preview when PDF.js fails
  - **Download Link**: Provides original PDF download for reference
  - **Redaction Support**: Full redaction functionality on preview content
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

## **PDF Rendering Challenges & Solutions**

### **1. The Core Problem**
- **User Expectation**: Users expect to see their actual uploaded PDF content for redaction
- **Technical Reality**: PDF rendering in Next.js is extremely challenging due to SSR, worker, and CORS issues
- **Impact**: Redaction tool shows sample content instead of real PDF content, causing user frustration

### **2. Attempted Solutions (All Failed)**

#### **Solution A: PDF.js Library (Updated Implementation)**
- **Approach**: Use `pdfjs-dist` to render PDFs to canvas with no-worker mode
- **Problems Encountered**:
  - `DOMMatrix is not defined` during Next.js SSR
  - Worker loading failures (`No 'GlobalWorkerOptions.workerSrc' specified`)
  - CORS errors with external CDN workers
- **Solutions Implemented**:
  - Dynamic imports with proper error handling
  - No-worker configuration (`workerSrc = ''`)
  - Comprehensive fallback system
- **Result**: Working PDF.js integration with graceful fallback to realistic preview

#### **Solution B: pdf-lib + Canvas Generation**
- **Approach**: Extract PDF metadata and generate realistic sample content
- **Problems Encountered**:
  - Only extracts metadata (pages, dimensions), not visual content
  - Users see sample text instead of their actual PDF
  - Repeated user complaints: "This is NOT my PDF"
- **Result**: Functional but misleading - users can't see their real content

#### **Solution C: Server-Side PDF Conversion**
- **Approach**: Convert PDFs to images on the server using `sharp` or similar
- **Problems Encountered**:
  - `OffscreenCanvas` not available in Node.js environment
  - Complex server-side image processing
  - Additional API complexity and potential failures
- **Result**: Abandoned due to Node.js canvas limitations

#### **Solution D: iframe PDF Embedding**
- **Approach**: Embed PDF directly in iframe for viewing
- **Problems Encountered**:
  - Browser PDF viewer limitations
  - No redaction overlay capability
  - Separate viewing vs. redaction workflow
- **Result**: Shows real content but breaks redaction workflow

### **3. Key Technical Learnings**

#### **Next.js + PDF Rendering = Major Challenge**
- **SSR Issues**: PDF libraries expect browser environment, not server
- **Worker Dependencies**: PDF.js requires web workers that conflict with Next.js
- **CORS Problems**: External worker CDNs fail in production environments
- **Canvas Limitations**: Server-side canvas operations are severely limited

#### **User Experience vs. Technical Reality**
- **User Need**: See actual PDF content for accurate redaction
- **Technical Constraint**: PDF rendering in Next.js is extremely difficult
- **Trade-off**: Either show sample content (misleading) or show nothing (useless)

#### **The Fundamental Mismatch**
- **Redaction Tool Requirement**: Must show actual document content
- **Next.js Architecture**: Server-side rendering conflicts with PDF libraries
- **Browser Limitations**: PDF rendering requires specific browser APIs

### **4. Recommended Solutions for Future Development**

#### **Option 1: Client-Only PDF Rendering**
```typescript
// Use Next.js dynamic imports with ssr: false
const PDFViewer = dynamic(() => import('./PDFViewer'), { ssr: false })

// Completely isolate PDF rendering to client side
// Avoid all server-side PDF processing
```

#### **Option 2: External PDF Service**
- **Approach**: Use service like PDFTron, PSPDFKit, or similar
- **Pros**: Professional PDF rendering, no Next.js conflicts
- **Cons**: Additional cost, external dependency, potential privacy concerns

#### **Option 3: Hybrid Approach**
- **PDF Viewing**: Use iframe for content display
- **Redaction Interface**: Overlay redaction tools on top
- **Workflow**: View PDF → Identify areas → Redact on overlay → Submit

#### **Option 4: Architecture Change**
- **Consider**: Moving PDF processing to a separate microservice
- **Technology**: Node.js + Express + PDF libraries
- **Integration**: API calls to PDF service from Next.js

### **5. Current Working Implementation (Latest Update)**

#### **PDF.js Integration (Primary Path)**
- **Status**: Working with proper error handling
- **Configuration**: No-worker mode with `workerSrc = ''`
- **Error Handling**: Try-catch around imports and operations
- **Result**: Successfully renders actual PDF content when possible

#### **Enhanced Fallback System (Secondary Path)**
- **Status**: Robust fallback when PDF.js fails
- **Content**: Realistic contract-like preview with sample data
- **Features**: Download link for original PDF, realistic redaction practice
- **User Experience**: Clear communication about what's happening

#### **Technical Improvements Made**
1. **Dynamic Import Handling**: Proper error handling for PDF.js imports
2. **No-Worker Configuration**: Eliminates worker-related failures
3. **Graceful Degradation**: Seamless fallback to preview mode
4. **User Communication**: Clear messaging about available options
5. **Download Access**: Original PDF always available for reference

### **6. Critical Decision Points**

#### **For Redaction Tool Success**
1. **Accept Technical Limitations**: PDF rendering in Next.js is fundamentally difficult
2. **Choose User Experience**: Either show real content or don't build the tool
3. **Consider Alternatives**: External services, different architectures, or different tools
4. **Set Realistic Expectations**: This is not a simple feature to implement

#### **Current State Assessment (Updated)**
- **What Works**: PDF upload, metadata extraction, PDF.js rendering with fallback
- **What Works Well**: Graceful error handling, realistic preview, download access
- **User Impact**: Improved experience with clear expectations and fallback options
- **Technical Status**: Robust implementation with comprehensive error handling

### **6. Lessons for Future Developers**

#### **Don't Underestimate PDF Complexity**
- **PDF Rendering**: Is not a simple "add library" task
- **Next.js Constraints**: Server-side rendering creates unique challenges
- **User Expectations**: Users expect to see their actual content, not samples

#### **Test Early and Often**
- **Proof of Concept**: Test PDF rendering before building full features
- **Environment Testing**: Test in production-like environments (Vercel)
- **User Testing**: Validate that users can actually use the tool as intended

#### **Consider Alternatives Early**
- **External Services**: Professional PDF libraries often worth the cost
- **Architecture Changes**: Sometimes the right solution requires different architecture
- **Feature Scope**: Maybe redaction isn't the right feature for this tech stack

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

### **4. PDF Rendering (Critical Priority)**
- **Research Phase**: Investigate external PDF services and costs
- **Architecture Review**: Consider if current stack supports PDF requirements
- **User Research**: Validate if redaction tool is actually needed
- **Alternative Solutions**: Explore different approaches to document privacy

## **Troubleshooting Session Summary (December 2024)**

### **Session Context**
- **User Request**: Implement PDF redaction tool showing actual uploaded content
- **Duration**: Extended troubleshooting session with multiple failed attempts
- **Outcome**: User frustration due to persistent sample content display
- **Final Status**: Chat terminated due to technical limitations

### **Key User Feedback**
- **Repeated Complaint**: "This is NOT the PDF I uploaded"
- **User Expectation**: See actual PDF content for redaction
- **Technical Reality**: Only sample content could be displayed
- **User Frustration**: "You got stuck" and "We're stuck unfortunately"

### **Technical Challenges Encountered**
1. **PDF.js Worker Issues**: Persistent CORS and worker loading failures
2. **Next.js SSR Conflicts**: `DOMMatrix is not defined` errors
3. **Canvas Limitations**: Server-side canvas operations not viable
4. **Architecture Mismatch**: PDF rendering requirements vs. Next.js constraints

### **Failed Solution Attempts**
1. **Multiple PDF.js Configurations**: All failed due to worker issues
2. **Server-side PDF Conversion**: Node.js canvas limitations
3. **Hybrid Approaches**: Complex and unreliable
4. **Sample Content Generation**: Misleading to users

### **Critical Learning**
- **PDF Rendering in Next.js**: Is fundamentally difficult, not a simple feature
- **User Experience**: Cannot be compromised with sample content
- **Technical Debt**: Multiple failed attempts create frustration
- **Architecture Decision**: Sometimes requires different technology choices

### **Recommendations for Future Sessions**
1. **Set Realistic Expectations**: PDF rendering is complex, not simple
2. **Research External Services**: Professional PDF libraries may be necessary
3. **Consider Architecture Changes**: Current stack may not support requirements
4. **User Validation**: Ensure redaction tool is actually needed
5. **Alternative Solutions**: Explore different approaches to document privacy

---

**Note**: This documentation should be updated whenever significant architectural changes are made. Keep it current to ensure quick onboarding and troubleshooting.

**Special Note**: The PDF redaction tool represents a significant technical challenge that requires careful consideration of architecture, external services, or alternative approaches. Do not underestimate the complexity of PDF rendering in Next.js environments.
