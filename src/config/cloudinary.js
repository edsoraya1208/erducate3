// src/config/cloudinary.js - FIXED FOR YOUR TWO PRESETS

/**
 * 🔧 ENVIRONMENT VARIABLES NEEDED:
 * Add these to your .env file:
 * 
 * VITE_CLOUDINARY_CLOUD_NAME=dmc6csxg1
 * VITE_CLOUDINARY_LECTURER_PRESET=create_exercise_upload
 * VITE_CLOUDINARY_STUDENT_PRESET=student-submission
 * 
 * CLOUDINARY_CLOUD_NAME=dmc6csxg1
 * CLOUDINARY_API_KEY=886445683169239  
 * CLOUDINARY_API_SECRET=34OdWGWWn1pgLVxvQUDZk6NjAu4
 */

// 🎓 LECTURER UPLOAD - Uses create_exercise_upload preset
export const uploadToCloudinaryLecturer = async (file, folder = 'exercises', metadata = {}) => {
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
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedDocTypes = ['application/pdf'];
  const allAllowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    
  if (!allAllowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPG, PNG) and PDFs allowed');
  }

  // 🔧 Get environment variables
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_LECTURER_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Missing Cloudinary configuration for lecturer uploads');
  }

  try {
    console.log(`🎓 LECTURER: Uploading ${file.name} using preset: ${uploadPreset}`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    
    // Add metadata if provided
    if (metadata.filename) {
      formData.append('public_id', `${folder}/${metadata.filename}`);
    }

    console.log('🔍 DEBUG - Lecturer upload data:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder,
      preset: uploadPreset,
      filename: metadata.filename
    });

    // 🌐 DIRECT CLOUDINARY UPLOAD
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log('🔍 DEBUG - Cloudinary Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔍 DEBUG - Cloudinary Error:', errorData);
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
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
      bytesToMB: (file.size / (1024 * 1024)).toFixed(2),
    };

  } catch (error) {
    console.error('❌ Lecturer upload error:', error);
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message.includes('File too large')) {
      throw new Error('File size exceeds 2MB limit. Please compress your image.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};

// 🎓 STUDENT UPLOAD - Uses student-submission preset
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

  // 🔧 Get environment variables
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_STUDENT_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Missing Cloudinary configuration for student uploads');
  }

  try {
    console.log(`🎓 STUDENT: Uploading ${file.name} using preset: ${uploadPreset}`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    
    // Create predictable filename for students
    const predictableFileName = `${classId}-${exerciseId}-${studentId}`;
    formData.append('public_id', `${folder}/${predictableFileName}`);

    console.log('🔍 DEBUG - Student upload data:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder,
      preset: uploadPreset,
      studentId,
      exerciseId,
      classId,
      predictableFileName
    });

    // 🌐 DIRECT CLOUDINARY UPLOAD
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log('🔍 DEBUG - Cloudinary Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔍 DEBUG - Cloudinary Error:', errorData);
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    const result = await response.json();
    console.log('✅ Student upload successful:', result.secure_url);

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
      predictableFileName,
      isOverwrite: true, // Since we're using the same public_id
      cloudinaryFolder: folder,
      bytesToMB: (file.size / (1024 * 1024)).toFixed(2),
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
 * 🔄 MAIN UPLOAD FUNCTION - AUTO-ROUTES TO CORRECT PRESET
 * This is the function you call from your components
 */
export const uploadToCloudinary = async (file, folder = 'exercises', metadata = {}) => {
  // If metadata has student info, use student upload preset
  if (metadata.studentId && metadata.exerciseId && metadata.classId) {
    console.log('🎓 Routing to STUDENT upload (student-submission preset)');
    return uploadToCloudinaryStudent(file, folder, metadata);
  } else {
    console.log('🎓 Routing to LECTURER upload (create_exercise_upload preset)');
    return uploadToCloudinaryLecturer(file, folder, metadata);
  }
};