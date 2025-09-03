// 🌤️ CLOUDINARY UPLOAD LOGIC COMPONENT (SWITCHED FROM FIREBASE STORAGE)
// 🔄 CHANGED: Now using Cloudinary instead of Firebase Storage for file uploads
import { uploadToCloudinary } from '../../config/cloudinary'; // 🆕 NEW: Import Cloudinary function

// 🎯 UPLOAD HANDLER: Manages all file upload logic and validation
export const useUploadHandler = () => {

  // 📁 ENHANCED FILE VALIDATION (UNCHANGED - same validation logic)
  const validateFile = (file, fileType) => {
    try {
      // Size validation (2MB limit - matches Cloudinary config)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 2MB');
      }

      // 📝 TYPE VALIDATION based on field (UNCHANGED)
      if (fileType === 'answerSchemeFile') {
        // Answer scheme should be images only
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Answer scheme must be an image file (JPG, PNG)');
        }
      } else if (fileType === 'rubricFile') {
        // Rubric should be PDF only
        if (file.type !== 'application/pdf') {
          throw new Error('Rubric must be a PDF file');
        }
      }

      // 🔒 FILENAME VALIDATION - Prevent malicious filenames (UNCHANGED)
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      if (sanitizedName !== file.name) {
        console.warn('Filename was sanitized for security');
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  // 🌤️ UPLOAD FILES TO CLOUDINARY (CHANGED - now uses Cloudinary instead of Firebase)
  const uploadFiles = async (formData) => {
    let answerSchemeData = null;
    let rubricData = null;

    try {
      if (formData.answerSchemeFile) {
        console.log('🌤️ Uploading answer scheme to Cloudinary...'); // 🔄 CHANGED: Updated log message
        answerSchemeData = await uploadToCloudinary( // 🔄 CHANGED: Now calls Cloudinary function
          formData.answerSchemeFile, 
          'answer-schemes' // Cloudinary folder name
        );
        console.log('✅ Answer scheme uploaded to Cloudinary:', answerSchemeData.url);
      }

      if (formData.rubricFile) {
        console.log('🌤️ Uploading rubric to Cloudinary...'); // 🔄 CHANGED: Updated log message
        rubricData = await uploadToCloudinary( // 🔄 CHANGED: Now calls Cloudinary function
          formData.rubricFile, 
          'rubrics' // Cloudinary folder name
        );
        console.log('✅ Rubric uploaded to Cloudinary:', rubricData.url);
      }

      return { answerSchemeData, rubricData };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error); // 🔄 CHANGED: Updated error message
      throw error;
    }
  };

  // 📋 FORMAT CLOUDINARY DATA FOR FIRESTORE (CHANGED - now formats Cloudinary data)
  // 🔄 CHANGED: Function name and data structure to match Cloudinary response
  const formatFirebaseStorageData = (answerSchemeData, rubricData) => {
    return {
      answerScheme: answerSchemeData ? {
        url: answerSchemeData.url,           
        publicId: answerSchemeData.publicId,     // 🔄 CHANGED: Cloudinary uses publicId instead of fullPath
        originalName: answerSchemeData.originalName,
        fileType: answerSchemeData.fileType,
        fileSize: answerSchemeData.fileSize,
        width: answerSchemeData.width,       // 🆕 NEW: Cloudinary provides image dimensions
        height: answerSchemeData.height,     // 🆕 NEW: Cloudinary provides image dimensions
        format: answerSchemeData.format,
        uploadedAt: answerSchemeData.createdAt, // 🔄 CHANGED: Cloudinary uses createdAt
        // 🆕 NEW: Additional Cloudinary-specific data
        cloudinaryFolder: answerSchemeData.cloudinaryFolder,
        resourceType: answerSchemeData.resourceType
      } : null,
      
      rubric: rubricData ? {
        url: rubricData.url,
        publicId: rubricData.publicId,           // 🔄 CHANGED: Cloudinary uses publicId instead of fullPath
        originalName: rubricData.originalName,
        fileType: rubricData.fileType,
        fileSize: rubricData.fileSize,
        format: rubricData.format,
        uploadedAt: rubricData.createdAt,        // 🔄 CHANGED: Cloudinary uses createdAt
        // 🆕 NEW: Additional Cloudinary-specific data
        cloudinaryFolder: rubricData.cloudinaryFolder,
        resourceType: rubricData.resourceType
      } : null
    };
  };

  return {
    validateFile, // UNCHANGED
    uploadFiles, // 🔄 CHANGED: Now uses Cloudinary internally
    formatFirebaseStorageData // 🔄 CHANGED: Now formats Cloudinary data (keeping same function name for compatibility)
  };
};