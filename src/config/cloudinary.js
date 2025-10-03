// src/config/cloudinary.js - FIXED CORS + URL ISSUE

// 🔧 Development mode detection
const isDevelopment = import.meta.env.DEV;

// 🌐 API Base URL - FIXED: Remove trailing slash to avoid double slash
const API_BASE_URL = isDevelopment 
  ? 'https://erducate.vercel.app'  // NO trailing slash!
  : '';

/**
 * 🎓 LECTURER UPLOAD - Uses your /api/upload-lecturer endpoint
 */
export const uploadToCloudinaryLecturer = async (file, folder = 'lecturer_exercise', metadata = {}) => {
  // 🛡️ SECURITY VALIDATIONS
  if (!file) {
    throw new Error('No file provided');
  }

  // 📏 File size validation (2MB limit)
  const maxSize = 1 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size exceeds 1MB limit. Please compress your image.');
  }

  // 📝 FILE TYPE VALIDATION
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedDocTypes = ['application/pdf'];
  const allAllowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    
  if (!allAllowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPG, PNG) and PDFs allowed');
  }

  try {
    console.log(`🎓 LECTURER: Uploading ${file.name} via backend API`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('filename', metadata.filename || 'exercise-file');
    formData.append('uploadType', 'lecturer');

    console.log('🔍 DEBUG - Lecturer upload data:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder,
      filename: metadata.filename
    });

    // 🌐 FIXED URL - No double slash
    const uploadUrl = `${API_BASE_URL}/api/upload-lecturer`;
    console.log('🔍 DEBUG - Upload URL:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // 🔧 ADD CORS HEADERS FOR CROSS-ORIGIN REQUESTS
      mode: 'cors',
      credentials: 'omit', // Don't send cookies for CORS
    });

    console.log('🔍 DEBUG - Backend Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 DEBUG - Backend Error:', errorText);
      throw new Error(errorText || 'Backend upload failed');
    }

    const result = await response.json();
    console.log('✅ Lecturer upload successful:', result.url);

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
      cloudinaryFolder: result.cloudinaryFolder,
      bytesToMB: result.bytesToMB,
    };

  } catch (error) {
    console.error('❌ Lecturer upload error:', error);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      throw new Error('CORS error: Your deployed API needs to allow localhost requests. Check your API CORS settings.');
    } else if (error.message.includes('File too large')) {
      throw new Error('File size exceeds 1MB limit. Please compress your image.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};

/**
 * 🎓 STUDENT UPLOAD - Uses your /api/upload endpoint
 */
export const uploadToCloudinaryStudent = async (file, folder = 'student-submissions', metadata = {}) => {
  // 🛡️ SECURITY VALIDATIONS
  if (!file) {
    throw new Error('No file provided');
  }

  // 📏 File size validation (2MB limit)
  const maxSize = 1 * 1024 * 1024; // 1MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size exceeds 1MB limit. Please compress your image.');
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

  try {
    console.log(`🎓 STUDENT: Uploading ${file.name} via backend API`);
    
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

    // 🌐 FIXED URL - No double slash
    const uploadUrl = `${API_BASE_URL}/api/upload`;
    console.log('🔍 DEBUG - Upload URL:', uploadUrl);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // 🔧 ADD CORS HEADERS FOR CROSS-ORIGIN REQUESTS
      mode: 'cors',
      credentials: 'omit',
    });

    console.log('🔍 DEBUG - Backend Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 DEBUG - Backend Error:', errorText);
      throw new Error(errorText || 'Backend upload failed');
    }

    const result = await response.json();
    console.log('✅ Student upload successful:', result.url);

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
    
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      throw new Error('CORS error: Your deployed API needs to allow localhost requests. Check your API CORS settings.');
    } else if (error.message.includes('File too large')) {
      throw new Error('File size exceeds 1MB limit. Please compress your image.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};

/**
 * 🔄 MAIN UPLOAD FUNCTION - AUTO-ROUTES TO CORRECT API
 */
export const uploadToCloudinary = async (file, folder = 'lecturer_exercise', metadata = {}) => {
  // If metadata has student info, use student upload API
  if (metadata.studentId && metadata.exerciseId && metadata.classId) {
    console.log('🎓 Routing to STUDENT upload via /api/upload');
    return uploadToCloudinaryStudent(file, folder, metadata);
  } else {
    console.log('🎓 Routing to LECTURER upload via /api/upload-lecturer');
    return uploadToCloudinaryLecturer(file, folder, metadata);
  }
};