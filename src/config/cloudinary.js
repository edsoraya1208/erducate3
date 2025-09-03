// src/config/cloudinary.js - SECURE VERSION (REMOVED DANGEROUS LOGS)
export const uploadToCloudinary = async (file, folder = 'exercises') => {
  if (!file) {
    throw new Error('No file provided');
  }

  // 🔧 REQUIRED ENVIRONMENT VARIABLES
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

  // ❌ This is what's causing your 401 error
  if (!cloudName || !uploadPreset || !apiKey) {
    throw new Error('Cloudinary not configured. Missing cloud name, upload preset, or API key.');
  }

  // File validations
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 2MB limit');
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  try {
    console.log(`🌤️ Uploading ${file.name} to Cloudinary...`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('api_key', apiKey);
    formData.append('folder', folder);
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Upload failed:', errorData.error?.message || 'Unknown error');
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ File uploaded successfully');
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      createdAt: result.created_at,
      cloudinaryFolder: folder
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }
};