// api/upload.js
// 🚀 VERCEL API ROUTE - Handles secure file uploads to Cloudinary

import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';

// Configure Cloudinary (server-side, secure)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 API: Starting file upload...');

    // Parse the form data (file + metadata)
    const form = formidable({
      maxFileSize: 2 * 1024 * 1024, // 2MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    // Extract data from form
    const studentId = fields.studentId?.[0];
    const exerciseId = fields.exerciseId?.[0];
    const classId = fields.classId?.[0];
    const folder = fields.folder?.[0] || 'student-submissions';
    
    // Get the uploaded file
    const uploadedFile = files.file?.[0];
    
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!studentId || !exerciseId || !classId) {
      return res.status(400).json({ error: 'Missing required fields: studentId, exerciseId, classId' });
    }

    console.log('📁 File info:', {
      filename: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype
    });

    // 🔑 CREATE PREDICTABLE FILENAME FOR OVERWRITES
    // This ensures same student + exercise always gets same URL
    const fileExtension = uploadedFile.originalFilename?.split('.').pop()?.toLowerCase() || 'jpg';
    const predictableFileName = `${studentId}_${classId}_${exerciseId}.${fileExtension}`;
    const fullPublicId = `${folder}/${predictableFileName}`;

    console.log('🎯 Upload target:', fullPublicId);

    // 🌤️ UPLOAD TO CLOUDINARY WITH OVERWRITE
    const result = await cloudinary.uploader.upload(uploadedFile.filepath, {
      public_id: fullPublicId,
      folder: folder,
      overwrite: true, // 🔥 This is the magic - same URL every time!
      resource_type: 'auto',
      context: {
        original_name: uploadedFile.originalFilename,
        student_id: studentId,
        exercise_id: exerciseId,
        class_id: classId,
      },
      tags: [`student-${studentId}`, `exercise-${exerciseId}`, `class-${classId}`, 'resubmission-enabled'],
    });

    // Clean up temporary file
    fs.unlinkSync(uploadedFile.filepath);

    console.log('✅ Upload successful:', result.secure_url);

    // Return consistent response format
    const response = {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      originalName: uploadedFile.originalFilename,
      fileType: uploadedFile.mimetype,
      fileSize: uploadedFile.size,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      createdAt: result.created_at,
      
      // Additional metadata
      predictableFileName: predictableFileName,
      isOverwrite: true, // Always true with this approach
      cloudinaryFolder: folder,
      bytesToMB: (uploadedFile.size / 1024 / 1024).toFixed(2),
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Upload API Error:', error);
    
    // Return user-friendly error messages
    let errorMessage = 'Upload failed';
    
    if (error.message?.includes('File size')) {
      errorMessage = 'File too large (max 2MB)';
    } else if (error.message?.includes('Invalid')) {
      errorMessage = 'Invalid file type';
    } else if (error.http_code === 401) {
      errorMessage = 'Cloudinary authentication failed';
    }

    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}