// api/upload-lecturer.js - NEW API ENDPOINT FOR LECTURER UPLOADS
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 LECTURER API: Starting file upload...');

    const form = formidable({
      maxFileSize: 2 * 1024 * 1024, // 2MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const folder = fields.folder?.[0] || 'exercises';
    const filename = fields.filename?.[0] || 'file';
    const uploadType = fields.uploadType?.[0] || 'lecturer';
    
    const uploadedFile = files.file?.[0];
    
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 Lecturer file info:', {
      filename: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype,
      targetFilename: filename
    });

    // 🗂️ ORGANIZED FOLDER STRUCTURE (same as student but for lecturers)
    // folder comes in as: "exercises/classId/exerciseId"
    const fullPublicId = `${folder}/${filename}`;

    console.log('🎯 Lecturer upload target:', fullPublicId);
    console.log('🔍 DEBUG - Folder:', folder);
    console.log('🔍 DEBUG - Filename:', filename);

    // 🌤️ UPLOAD TO CLOUDINARY WITH OVERWRITE (same logic as student)
    const result = await cloudinary.uploader.upload(uploadedFile.filepath, {
      folder: folder,
      public_id: filename, // Predictable filename: answer-scheme or rubric
      overwrite: true, // 🔑 KEY: Enable overwrite for draft editing
      invalidate: true, // Clear CDN cache
      resource_type: 'auto',
      context: {
        original_name: uploadedFile.originalFilename,
        upload_type: uploadType,
      },
      tags: [`lecturer-${uploadType}`, 'exercise-content', 'resubmission-enabled'],
      transformation: uploadedFile.mimetype.startsWith('image/') ? [
        // Only apply transformations to images
        { format: 'jpg', quality: 'auto:good' }
      ] : [] // No transformation for PDFs
    });

    // Clean up temporary file
    fs.unlinkSync(uploadedFile.filepath);

    console.log('✅ Lecturer upload successful:', result.secure_url);
    console.log('🔍 Final public_id:', result.public_id);
    console.log('🔍 Was overwritten:', result.overwritten || false);

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
      overwritten: result.overwritten || false,
      
      cloudinaryFolder: folder,
      bytesToMB: (uploadedFile.size / 1024 / 1024).toFixed(2),
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Lecturer Upload API Error:', error);
    
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