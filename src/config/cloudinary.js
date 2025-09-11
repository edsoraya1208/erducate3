// src/config/cloudinary.js

// 🌤️ CLOUDINARY CONFIGURATION - TWO UPLOAD METHODS
// 1. LECTURERS: Unsigned upload (your old preset) for schemes/rubrics
// 2. STUDENTS: Signed upload via Vercel API for submissions with overwrite

/**
 * 🔧 ENVIRONMENT VARIABLES NEEDED:
 * Add these to your .env file:
 * VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
 * VITE_CLOUDINARY_UPLOAD_PRESET=your_old_unsigned_preset (for lecturers)
 */

// 🎓 LECTURER UPLOAD - Uses your OLD unsigned preset (direct to Cloudinary)
export const uploadToCloudinaryLecturer = async (file, folder = 'schemes') => {
  // 🛡️ SECURITY VALIDATIONS
  if (!file) {
    throw new Error('No file provided');
  }

  // ⚠️ Environment check
  if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || !import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary not configured. Check your .env file.');
  }

  // 📏 File size validation (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size exceeds 2MB limit. Please compress your image.');
  }

  // 📝 FILE TYPE VALIDATION
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf'];
  const allAllowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    
  if (!allAllowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPG, PNG, GIF, WebP) and PDFs allowed');
  }

  // 🔒 Generate unique filename for lecturers
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${folder}_${timestamp}_${randomString}.${fileExtension}`;

  // 📤 UPLOAD TO CLOUDINARY DIRECTLY
  try {
    console.log(`🎓 LECTURER: Uploading ${file.name} to Cloudinary directly...`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); // Uses: create_exercise_upload
    formData.append('folder', folder);
    formData.append('public_id', uniqueFilename);
    formData.append('resource_type', 'auto');
    formData.append('context', `original_name=${file.name}`);
    formData.append('tags', `${folder},lecturer-content,auto-uploaded`);
        
    const uploadUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`;
    console.log('🔍 DEBUG - Lecturer upload URL:', uploadUrl);
        
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔍 DEBUG - Lecturer upload error:', errorData);
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ Lecturer upload successful:', result.secure_url);
        
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
      cloudinaryFolder: folder,
      uniqueFilename: uniqueFilename,
      bytesToMB: (file.size / 1024 / 1024).toFixed(2),
    };

  } catch (error) {
    console.error('❌ Lecturer upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// 🎓 STUDENT UPLOAD - Uses your NEW signed preset via Vercel API
export const uploadToCloudinaryStudent = async (file, folder = 'student-submissions', metadata = {}) => {
  // 🛡️ SECURITY VALIDATIONS
  if (!file) {
    throw new Error('No file provided');
  }

  // 📏 File size validation (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size exceeds 2MB limit. Please compress your image.');
  }

  // 📝 FILE TYPE VALIDATION
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf'];
  const allAllowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    
  if (!allAllowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPG, PNG, GIF, WebP) and PDFs allowed');
  }

  // ✅ Validate required metadata for predictable filenames
  const { studentId, exerciseId, classId } = metadata;
  if (!studentId || !exerciseId || !classId) {
    throw new Error('Missing required metadata: studentId, exerciseId, classId');
  }

  // 📤 UPLOAD VIA YOUR VERCEL API
  try {
    console.log(`🎓 STUDENT: Uploading ${file.name} via Vercel API...`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('studentId', studentId);
    formData.append('exerciseId', exerciseId);
    formData.append('classId', classId);

    console.log('🔍 DEBUG - Student upload data:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder,
      studentId,
      exerciseId,
      classId
    });

    // 🌐 CALL YOUR VERCEL API
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('🔍 DEBUG - Student API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔍 DEBUG - Student API Error:', errorData);
      throw new Error(errorData.error || 'API upload failed');
    }

    const result = await response.json();
    console.log('✅ Student upload successful via API:', result.url);

    return {
      url: result.url,
      publicId: result.publicId,
      originalName: result.originalName,
      fileType: result.fileType,
      fileSize: result.fileSize,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resourceType,
      createdAt: result.createdAt,
      predictableFileName: result.predictableFileName,
      isOverwrite: result.isOverwrite,
      cloudinaryFolder: result.cloudinaryFolder,
      bytesToMB: result.bytesToMB,
    };

  } catch (error) {
    console.error('❌ Student upload error:', error);
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message.includes('File too large')) {
      throw new Error('File size exceeds 2MB limit. Please compress your image.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};

/**
 * 🔄 MAIN UPLOAD FUNCTION - AUTO-ROUTES TO CORRECT METHOD
 * This is the function you call from your components
 */
export const uploadToCloudinary = async (file, folder = 'exercises', metadata = {}) => {
  // If metadata has student info, use student upload (with overwrite capability)
  if (metadata.studentId && metadata.exerciseId && metadata.classId) {
    console.log('🎓 Routing to STUDENT upload (via API with overwrite)');
    return uploadToCloudinaryStudent(file, folder, metadata);
  } else {
    // Otherwise, use lecturer upload (direct to Cloudinary)
    console.log('🎓 Routing to LECTURER upload (direct to Cloudinary)');
    return uploadToCloudinaryLecturer(file, folder);
  }
};