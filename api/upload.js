// api/upload.js - PROPERLY FIXED VERSION
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // 🔧 ADD CORS HEADERS - Allow localhost requests
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 API: Starting file upload...');

    const form = formidable({
      maxFileSize: 2 * 1024 * 1024, // 2MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const studentId = fields.studentId?.[0];
    const exerciseId = fields.exerciseId?.[0];
    const classId = fields.classId?.[0];
    const folder = fields.folder?.[0] || 'student-submissions';
    
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

    // 🔑 CREATE PREDICTABLE FILENAME - NO EXTENSION (Cloudinary adds it)
    // Don't include extension - let Cloudinary handle it with transformation
    const predictableFileName = `${studentId}_${classId}_${exerciseId}`;
    
    // 🗂️ ORGANIZED FOLDER STRUCTURE
    const folderPath = `${folder}/${classId}/${exerciseId}/${studentId}`;
    const fullPublicId = `${folderPath}/${predictableFileName}`;

    console.log('🎯 Upload target:', fullPublicId);
    console.log('🔍 DEBUG - Predictable filename:', predictableFileName);
    console.log('🔍 DEBUG - Full path:', fullPublicId);

    // 🌤️ UPLOAD TO CLOUDINARY - USING FOLDER PARAMETER (CHATBOT'S SUGGESTION)
    const result = await cloudinary.uploader.upload(uploadedFile.filepath, {
      folder: folderPath, // Use folder parameter instead of including in public_id
      public_id: predictableFileName, // Just the filename, no path
      overwrite: true,
      invalidate: true, // Clear CDN cache
      resource_type: 'auto',
      // ❌ REMOVED format parameter - let Cloudinary handle it but force .jpg in public_id
      context: {
        original_name: uploadedFile.originalFilename,
        student_id: studentId,
        exercise_id: exerciseId,
        class_id: classId,
      },
      tags: [`student-${studentId}`, `exercise-${exerciseId}`, `class-${classId}`, 'resubmission-enabled'],
      transformation: [
        // Convert everything to JPG for consistency
        { format: 'jpg', quality: 'auto:good' }
      ]
    });

    // Clean up temporary file
    fs.unlinkSync(uploadedFile.filepath);

    console.log('✅ Upload successful:', result.secure_url);
    console.log('🔍 Final public_id:', result.public_id);
    console.log('🔍 Should have overwritten:', result.overwritten || false);
    console.log('🔍 DEBUG - result.asset_folder:', result.asset_folder);
    console.log('🔍 DEBUG - Expected folderPath:', folderPath);
    console.log('🔍 DEBUG - Full result object:', JSON.stringify(result, null, 2));

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
      overwritten: result.overwritten || false, // This tells you if it actually overwrote
      
      predictableFileName: predictableFileName,
      folderPath: folderPath,
      fullPublicId: fullPublicId,
      isOverwrite: true,
      cloudinaryFolder: folder,
      bytesToMB: (uploadedFile.size / 1024 / 1024).toFixed(2),
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Upload API Error:', error);
    
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
