import sharp from 'sharp';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configure storage clients
let s3Client: S3Client | null = null;
let supabaseClient: any = null;

// Initialize S3 client for Cloudflare R2
if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Initialize Supabase client for storage
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const BUCKET_NAME = process.env.R2_BUCKET || process.env.S3_BUCKET || '';

interface RedactionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const uploadToStorage = async (file: Buffer, key: string, contentType: string): Promise<string> => {
  if (s3Client) {
    // Upload to Cloudflare R2 or AWS S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });
    
    await s3Client.send(command);
    return key;
  } else if (supabaseClient) {
    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from('contracts')
      .upload(key, file, {
        contentType,
        cacheControl: '3600',
      });
    
    if (error) throw error;
    return key;
  } else {
    throw new Error('No storage client configured');
  }
};

export const generateThumbnail = async (file: Buffer, mimeType: string): Promise<Buffer> => {
  if (mimeType === 'application/pdf') {
    // For PDFs, we'll create a simple placeholder thumbnail
    // In production, you might want to use pdf2pic or similar
    const canvas = sharp({
      create: {
        width: 300,
        height: 400,
        channels: 4,
        background: { r: 240, g: 240, b: 240, alpha: 1 }
      }
    });
    
    return canvas
      .composite([{
        input: Buffer.from(`
          <svg width="300" height="400">
            <rect width="300" height="400" fill="#f0f0f0"/>
            <text x="150" y="200" text-anchor="middle" fill="#666" font-size="24">PDF</text>
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();
  } else {
    // For images, create a thumbnail
    return sharp(file)
      .resize(300, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
};

export const applyRedaction = async (
  file: any, 
  redactions: RedactionBox[]
): Promise<{ redactedFileKey: string; thumbnailKey: string }> => {
  const fileId = uuidv4();
  const mimeType = file.mimetype;
  
  let processedBuffer: Buffer;
  
  if (mimeType === 'application/pdf') {
    processedBuffer = await applyPdfRedaction(file.data, redactions);
  } else {
    processedBuffer = await applyImageRedaction(file.data, redactions);
  }

  // Generate thumbnail
  const thumbnailBuffer = await generateThumbnail(processedBuffer, mimeType);
  
  // Upload files to S3
  const redactedKey = `contracts/${fileId}/redacted.${mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`;
  const thumbnailKey = `contracts/${fileId}/thumbnail.jpg`;
  
  await Promise.all([
    uploadToStorage(processedBuffer, redactedKey, mimeType),
    uploadToStorage(thumbnailBuffer, thumbnailKey, 'image/jpeg')
  ]);

  return {
    redactedFileKey: redactedKey,
    thumbnailKey: thumbnailKey
  };
};

const applyImageRedaction = async (imageBuffer: Buffer, redactions: RedactionBox[]): Promise<Buffer> => {
  let image = sharp(imageBuffer);
  
  // Apply each redaction as a black rectangle
  for (const redaction of redactions) {
    const { x, y, width, height } = redaction;
    
    // Create a black rectangle for the redaction
    const redactionRect = sharp({
      create: {
        width: Math.round(width),
        height: Math.round(height),
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    }).png();
    
    // Composite the redaction rectangle onto the image
    image = image.composite([{
      input: await redactionRect.toBuffer(),
      top: Math.round(y),
      left: Math.round(x)
    }]);
  }
  
  return image.jpeg({ quality: 90 }).toBuffer();
};

const applyPdfRedaction = async (pdfBuffer: Buffer, redactions: RedactionBox[]): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  
  for (const page of pages) {
    for (const redaction of redactions) {
      const { x, y, width, height } = redaction;
      
      // Draw a black rectangle for the redaction
      page.drawRectangle({
        x: x,
        y: page.getHeight() - y - height, // PDF coordinates are bottom-up
        width: width,
        height: height,
        color: rgb(0, 0, 0)
      });
    }
  }
  
  return Buffer.from(await pdfDoc.save());
};

export const getSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  if (s3Client) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };
    
    return s3Client.getSignedUrl('getObject', params);
  } else if (supabaseClient) {
    const { data, error } = await supabaseClient.storage
      .from('contracts')
      .createSignedUrl(key, expiresIn);
    
    if (error) throw error;
    return data.signedUrl;
  } else {
    throw new Error('No storage client configured');
  }
};
