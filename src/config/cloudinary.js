// src/config/cloudinary.js

// 🌤️ CLOUDINARY CONFIGURATION
// This replaces Firebase Storage for file uploads only
// Auth, users, and exercise data still use Firebase

/**
 * 🔧 ENVIRONMENT VARIABLES NEEDED:
 * Add these to your .env file:
 * VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
 * VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
 */

// ✅ SECURE UPLOAD FUNCTION - Uses unsigned upload preset
// This prevents API secret exposure in frontend code
export const uploadToCloudinary = async (file, folder = 'exercises') => {
  // 🛡️ SECURITY VALIDATIONS
  if (!file) {
    throw new Error('No file provided');
  }

  // ⚠️ Environment check
  if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || !import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary not configured. Check your .env file.');
  }

  // 📏 File size validation (2MB limit to stay within free tier)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size exceeds 2MB limit. Please compress your image.');
  }

  // 📝 FILE TYPE VALIDATION - More secure than just accept attribute
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf'];
  const allAllowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    
  if (!allAllowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPG, PNG, GIF, WebP) and PDFs allowed');
  }

  // 🔒 PREVENT DUPLICATES - Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${folder}_${timestamp}_${randomString}.${fileExtension}`;

  // 📤 UPLOAD TO CLOUDINARY
  try {
    console.log(`🌤️ Uploading ${file.name} to Cloudinary...`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder); // Organize files in folders
    formData.append('public_id', uniqueFilename); // Unique filename
    formData.append('resource_type', 'auto'); // Auto-detect file type
    
    // 🏷️ Add metadata for better organization
    formData.append('context', `original_name=${file.name}`);
    formData.append('tags', `${folder},student-work,auto-uploaded`);
        
    // 🌤️ UPLOAD REQUEST
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ Cloudinary upload successful:', result.secure_url);
        
    // 📊 RETURN USEFUL DATA FOR AI INTEGRATION
    return {
      url: result.secure_url,           // HTTPS URL for file access
      publicId: result.public_id,       // For future deletions/transformations
      originalName: file.name,          // Original filename
      fileType: file.type,              // MIME type
      fileSize: file.size,              // File size in bytes
      width: result.width,              // Image dimensions (null for PDFs)
      height: result.height,            // Image dimensions (null for PDFs)
      format: result.format,            // File format
      resourceType: result.resource_type, // 'image' or 'raw'
      createdAt: result.created_at,     // Upload timestamp
      
      // 🆕 ADDITIONAL USEFUL DATA
      cloudinaryFolder: folder,         // Which folder it's stored in
      uniqueFilename: uniqueFilename,   // Our generated unique name
      bytesToMB: (file.size / 1024 / 1024).toFixed(2), // Human readable size
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// 🗑️ DELETE FILE FUNCTION (for future use)
export const deleteFromCloudinary = async (publicId) => {
  // This requires server-side implementation for security
  // Frontend cannot delete files directly
  console.log('Delete request for:', publicId);
  // You'll implement this server-side later
  return false;
};

// 🔄 GET OPTIMIZED IMAGE URL (for displaying thumbnails)
export const getOptimizedImageUrl = (publicId, width = 300, height = 200) => {
  if (!publicId || !import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
    return null;
  }
  
  // Generate optimized URL for thumbnails/previews
  return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,f_auto,q_auto/${publicId}`;
};

// 🔧 DEBUG FUNCTION - Check if Cloudinary is properly configured
export const checkCloudinaryConfig = () => {
  const config = {
    hasCloudName: !!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    hasUploadPreset: !!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  };
  
  console.log('🌤️ Cloudinary Configuration Check:', config);
  return config.hasCloudName && config.hasUploadPreset;
};