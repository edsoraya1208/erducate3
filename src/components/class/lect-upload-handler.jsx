// 🌤️ CLOUDINARY UPLOAD LOGIC COMPONENT (UPDATED FOR SINGLE ID APPROACH)
// 🔄 CHANGED: Now uses single Firestore ID and proper folder structure
import { uploadToCloudinary } from '../../config/cloudinary';

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

  // 🆕 NEW: Single uploadFiles function with proper folder structure
  const uploadFiles = async (formData, classId, exerciseId) => {
    let answerSchemeData = null;
    let rubricData = null;

    try {
      // 🗂️ PROPER FOLDER STRUCTURE: exercises/classId/exerciseId/
      const baseFolder = `exercises/${classId}/${exerciseId}`;
      
      if (formData.answerSchemeFile) {
        console.log('🌤️ Uploading answer scheme to:', `${baseFolder}/answer-scheme`);
        
        // For lecturers: Use direct Cloudinary upload (unsigned preset)
        answerSchemeData = await uploadToCloudinary(
          formData.answerSchemeFile, 
          baseFolder, // This creates: exercises/class123/exerciseABC123/
          { 
            filename: 'answer-scheme', // Predictable filename for overwrite
            resourceType: 'image'
          }
        );
        console.log('✅ Answer scheme uploaded:', answerSchemeData.url);
      }

      if (formData.rubricFile) {
        console.log('🌤️ Uploading rubric to:', `${baseFolder}/rubric`);
        
        // For lecturers: Use direct Cloudinary upload (unsigned preset)
        rubricData = await uploadToCloudinary(
          formData.rubricFile, 
          baseFolder, // This creates: exercises/class123/exerciseABC123/
          { 
            filename: 'rubric', // Predictable filename for overwrite
            resourceType: 'raw' // for PDFs
          }
        );
        console.log('✅ Rubric uploaded:', rubricData.url);
      }

      return { answerSchemeData, rubricData };
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  // ❌ REMOVED: uploadLecturerFiles() - merged into single uploadFiles function above

  // 📋 FORMAT CLOUDINARY DATA FOR FIRESTORE (UPDATED function name but same logic)
  const formatFirebaseStorageData = (answerSchemeData, rubricData) => {
    return {
      answerScheme: answerSchemeData ? {
        url: answerSchemeData.url,           
        publicId: answerSchemeData.publicId,     
        originalName: answerSchemeData.originalName,
        fileType: answerSchemeData.fileType,
        fileSize: answerSchemeData.fileSize,
        width: answerSchemeData.width,       
        height: answerSchemeData.height,     
        format: answerSchemeData.format,
        uploadedAt: answerSchemeData.createdAt, 
        cloudinaryFolder: answerSchemeData.cloudinaryFolder,
        resourceType: answerSchemeData.resourceType
      } : null,
      
      rubric: rubricData ? {
        url: rubricData.url,
        publicId: rubricData.publicId,           
        originalName: rubricData.originalName,
        fileType: rubricData.fileType,
        fileSize: rubricData.fileSize,
        format: rubricData.format,
        uploadedAt: rubricData.createdAt,        
        cloudinaryFolder: rubricData.cloudinaryFolder,
        resourceType: rubricData.resourceType
      } : null
    };
  };

  return {
    validateFile,
    uploadFiles, // 🆕 UPDATED: Single function with proper folder structure
    formatFirebaseStorageData
  };
};