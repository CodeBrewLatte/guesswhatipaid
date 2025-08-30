# Supabase Image Display Guide

## Overview
This document outlines the complete solution for displaying images from Supabase storage in our Next.js application, based on lessons learned from implementing the admin contract review system.

## The Problem We Solved

### Initial Issues
1. **Images not loading** on admin review page
2. **URL construction failures** due to filename encoding issues
3. **Data flow confusion** between different filename fields
4. **Modal expansion not working** despite successful thumbnail display

### Root Causes Identified
1. **Invisible characters** in filenames (zero-width spaces, non-breaking spaces)
2. **Wrong data field usage** - using `redactedFileName` instead of actual storage filename
3. **URL construction mismatch** - building URLs from user filenames instead of storage filenames
4. **Missing debugging tools** to diagnose storage access issues

## The Complete Solution

### 1. Data Flow Understanding

#### Upload Process
```typescript
// 1. File uploaded to Supabase storage with generated name
const fileName = `contract-${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
// Example: "contract-4882d9c5-601c-43f0-98e3-a4d0232bdd98-1756426003741.jpg"

// 2. Full storage URL stored in thumbKey field
const { data: urlData } = supabase.storage
  .from('contracts')
  .getPublicUrl(fileName);
// Example: "https://project.supabase.co/storage/v1/object/public/contracts/contract-4882d9c5-601c-43f0-98e3-a4d0232bdd98-1756426003741.jpg"

// 3. Redaction metadata stores original user filename
"redactedFileName": file.name // "redacted_Image 4-3-25 at 1.01 PM.jpg"
```

#### Key Insight
- **`thumbKey`** = Full Supabase storage URL (what we need for display)
- **`redactedFileName`** = Original user filename (not useful for storage access)
- **`storageFileName`** = Extracted filename from thumbKey (what we use for URLs)

### 2. API Layer Fix

#### Extract Storage Filename
```typescript
const contracts = contractsResult.rows.map(row => {
  // Extract filename from thumbKey (which is the full Supabase storage URL)
  let storageFileName = null;
  if (row.thumbKey) {
    try {
      // thumbKey is the full URL, extract just the filename
      const url = new URL(row.thumbKey);
      storageFileName = url.pathname.split('/').pop();
    } catch (error) {
      console.error('Error parsing thumbKey URL:', row.thumbKey, error);
      storageFileName = null;
    }
  }
  
  return {
    // ... other fields
    storageFileName: storageFileName, // The actual filename in Supabase storage
    // ... other fields
  };
});
```

### 3. Frontend Display Fix

#### Use Correct Data Field
```typescript
// ❌ WRONG - Using user filename
{contract.redactedFileName && (
  <img src={getStorageUrl(contract.redactedFileName)} />
)}

// ✅ CORRECT - Using storage filename
{contract.storageFileName && (
  <img src={getStorageUrl(contract.storageFileName)} />
)}
```

#### URL Construction Function
```typescript
const getStorageUrl = (storageFileName: string) => {
  // Clean the filename by removing invisible characters and normalizing
  const cleanFilename = storageFileName
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and other invisible chars
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim() // Remove leading/trailing spaces
  
  // Properly encode the cleaned filename
  const encodedFilename = encodeURIComponent(cleanFilename)
  return `https://${SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/contracts/${encodedFilename}`
}
```

### 4. Modal Implementation

#### State Management
```typescript
const [imageModalOpen, setImageModalOpen] = useState(false)
const [selectedImage, setSelectedImage] = useState<string>('')

const openImageModal = (storageFileName: string) => {
  console.log('Opening modal with storage filename:', storageFileName)
  setSelectedImage(storageFileName)
  setImageModalOpen(true)
}

const closeImageModal = () => {
  setImageModalOpen(false)
  setSelectedImage('')
}
```

#### Modal Display
```typescript
{/* Image Modal */}
{imageModalOpen && selectedImage && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div className="relative max-w-4xl max-h-full">
      <button onClick={closeImageModal} className="close-button">
        <svg>...</svg>
      </button>
      
      {/* Debug info during development */}
      <div className="text-white text-center mb-4">
        <p>Debug: Modal open with filename: {selectedImage}</p>
        <p>Full URL: {getStorageUrl(selectedImage)}</p>
      </div>
      
      <img
        src={getStorageUrl(selectedImage)}
        alt="Contract full view"
        className="max-w-full max-h-full object-contain rounded-lg"
        onLoad={() => console.log('Modal image loaded successfully')}
        onError={(e) => console.error('Modal image failed to load:', e)}
      />
    </div>
  </div>
)}
```

## Best Practices

### 1. Always Use Storage Filenames
- **Never** use user-provided filenames for storage URLs
- **Always** extract the actual storage filename from the full storage URL
- **Validate** that the filename exists before attempting to display

### 2. Implement Comprehensive Error Handling
```typescript
<img
  src={getStorageUrl(storageFileName)}
  onError={(e) => {
    console.error('Image failed to load:', getStorageUrl(storageFileName))
    // Show fallback placeholder
    const target = e.target as HTMLImageElement
    target.style.display = 'none'
    // Create fallback element
  }}
  onLoad={() => console.log('Image loaded successfully')}
/>
```

### 3. Add Debugging Tools
```typescript
// Debug button for testing URLs
<button
  onClick={() => {
    const url = getStorageUrl(storageFileName)
    console.log('Testing image URL:', url)
    fetch(url)
      .then(response => {
        console.log('Image fetch response:', response.status, response.statusText)
        if (response.ok) {
          console.log('✅ Image exists and is accessible')
        } else {
          console.log('❌ Image fetch failed:', response.status)
        }
      })
      .catch(error => {
        console.error('❌ Image fetch error:', error)
      })
  }}
>
  Test Image URL
</button>
```

### 4. Filename Sanitization
```typescript
const sanitizeFilename = (filename: string) => {
  return filename
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim() // Remove leading/trailing whitespace
}
```

## Common Pitfalls

### 1. Using Wrong Filename Field
- **Problem**: Using `redactedFileName` (user filename) instead of storage filename
- **Solution**: Always extract filename from `thumbKey` (storage URL)

### 2. Invisible Characters
- **Problem**: Zero-width spaces and other invisible Unicode characters
- **Solution**: Implement filename sanitization before URL construction

### 3. Missing Error Handling
- **Problem**: No fallback when images fail to load
- **Solution**: Implement comprehensive error handling with fallback placeholders

### 4. Insufficient Debugging
- **Problem**: Hard to diagnose storage access issues
- **Solution**: Add debugging tools and detailed console logging

## Testing Checklist

- [ ] Thumbnail displays correctly
- [ ] Modal opens when thumbnail is clicked
- [ ] Full-size image loads in modal
- [ ] Console shows successful image loading
- [ ] Error handling works for missing images
- [ ] Debug tools provide useful information
- [ ] URLs are properly constructed and encoded

## Future Considerations

### 1. Image Optimization
- Implement responsive images with different sizes
- Add lazy loading for better performance
- Consider using Supabase's image transformation features

### 2. Caching Strategy
- Implement client-side caching for frequently accessed images
- Add cache headers for better performance
- Consider CDN integration for global image delivery

### 3. Security
- Validate file types and sizes
- Implement proper access controls
- Consider signed URLs for sensitive images

## Conclusion

The key to successful Supabase image display is understanding the data flow:
1. **Upload** → Generate storage filename and store full URL
2. **Retrieve** → Extract storage filename from full URL
3. **Display** → Construct proper storage URLs using extracted filename
4. **Handle Errors** → Implement fallbacks and debugging tools

By following this pattern and implementing the solutions outlined above, you can reliably display images from Supabase storage in any part of your application.
