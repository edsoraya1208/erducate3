// api/lecturer-upload.js - SAME AS STUDENT BUT FOR LECTURERS
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
    
    // 🔄 DIFFERENT: Get lecturer-specific fields instead of student fields
    const filename = fields.filename?.[0] || 'exercise-file';
    const folder = fields.folder?.[0] || 'lecturer_exercise';    const uploadType = fields.uploadType?.[0]; // Just for logging
    
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

    // 🔄 DIFFERENT: Use lecturer filename (not student predictable pattern)
    const lectureFileName = filename;
    
    // 🗂️ LECTURER FOLDER STRUCTURE (simpler than student)
    const folderPath = folder; // Just use 'exercises' or whatever folder
    const fullPublicId = `${folderPath}/${lectureFileName}`;

    console.log('🎯 Lecturer upload target:', fullPublicId);
    console.log('🔍 DEBUG - Lecturer filename:', lectureFileName);
    console.log('🔍 DEBUG - Full path:', fullPublicId);

    // 🌤️ UPLOAD TO CLOUDINARY - SAME AS STUDENT BUT DIFFERENT CONTEXT
    const result = await cloudinary.uploader.upload(uploadedFile.filepath, {
      folder: folderPath,
      public_id: lectureFileName,
      overwrite: true, // Allow overwrite for lecturers too
      invalidate: true,
      resource_type: 'auto',
      context: {
        original_name: uploadedFile.originalFilename,
        upload_type: 'lecturer',
        created_by: 'lecturer',
      },
      tags: ['lecturer-upload', 'exercise-material', 'overwrite-enabled'],
      transformation: [
        { format: 'jpg', quality: 'auto:good' }
      ]
    });

    // Clean up temporary file
    fs.unlinkSync(uploadedFile.filepath);

    console.log('✅ Lecturer upload successful:', result.secure_url);
    console.log('🔍 Final public_id:', result.public_id);
    console.log('🔍 Should have overwritten:', result.overwritten || false);

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
      
      // 🔄 DIFFERENT: Lecturer-specific response fields
      filename: lectureFileName,
      folderPath: folderPath,
      fullPublicId: fullPublicId,
      isOverwrite: true,
      cloudinaryFolder: folder,
      bytesToMB: (uploadedFile.size / 1024 / 1024).toFixed(2),
      uploadType: 'lecturer'
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Lecturer Upload API Error:', error);
    
    let errorMessage = 'Lecturer upload failed';
    
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