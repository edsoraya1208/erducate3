// api/delete-exercise.js - Cloudinary Delete API
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  // 🔧 CORS HEADERS - Allow localhost requests (matching your cloudinary config)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://erducate.vercel.app', // Your actual Vercel URL
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🗑️ API: Starting file deletion...');
    const { publicId } = req.body;

    // Validate input
    if (!publicId) {
      console.log('❌ Missing publicId');
      return res.status(400).json({ 
        success: false,
        error: 'Missing publicId',
        message: 'publicId is required to delete file' 
      });
    }

    console.log('🎯 Deleting from Cloudinary:', publicId);
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('📊 Cloudinary delete result:', result);

    // Check deletion result
    if (result.result === 'ok') {
      console.log('✅ File deleted successfully:', publicId);
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        publicId: publicId,
        cloudinaryResult: result
      });
    } 
    else if (result.result === 'not found') {
      // File doesn't exist - that's okay for our purposes
      console.log('⚠️ File not found in Cloudinary (already deleted?):', publicId);
      return res.status(200).json({
        success: true,
        message: 'File not found (may already be deleted)',
        publicId: publicId,
        cloudinaryResult: result,
        wasNotFound: true
      });
    } 
    else {
      // Unknown result from Cloudinary
      console.error('❓ Unexpected Cloudinary result:', result);
      return res.status(500).json({
        success: false,
        error: 'Unexpected response from Cloudinary',
        cloudinaryResult: result,
        publicId: publicId
      });
    }

  } catch (error) {
    console.error('❌ Delete API Error:', error);
    
    let errorMessage = 'Failed to delete file';
    
    if (error.http_code === 401) {
      errorMessage = 'Cloudinary authentication failed';
    } else if (error.http_code === 404) {
      errorMessage = 'File not found';
    } else if (error.message?.includes('Invalid')) {
      errorMessage = 'Invalid publicId format';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      publicId: req.body.publicId,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}