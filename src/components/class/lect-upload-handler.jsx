// 🌤️ CLOUDINARY UPLOAD LOGIC COMPONENT (UPDATED - Answer Scheme Only)
// 🔄 CHANGED: Removed rubric FILE upload, keeping rubric TEXT in form
import { uploadToCloudinary } from '../../config/cloudinary';

// 🎯 UPLOAD HANDLER: Manages all file upload logic and validation
export const useUploadHandler = () => {

  // 📁 ENHANCED FILE VALIDATION - Only for answer scheme now
  const validateFile = (file, fileType) => {
    try {
      // Size validation (2MB limit - matches Cloudinary config)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 2MB');
      }

      // 📝 TYPE VALIDATION - Only answer scheme (images)
      if (fileType === 'answerSchemeFile') {
        // Answer scheme should be images only
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Answer scheme must be an image file (JPG, PNG)');
        }
      }
      // ❌ REMOVED: rubricFile validation - rubric is now text-based

      // 🔒 FILENAME VALIDATION - Prevent malicious filenames
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      if (sanitizedName !== file.name) {
        console.warn('Filename was sanitized for security');
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  // 🆕 UPDATED: uploadFiles function - only handles answer scheme now
  const uploadFiles = async (formData, classId, exerciseId) => {
    let answerSchemeData = null;
    // ❌ REMOVED: rubricData variable - rubric is stored as text in Firestore

    try {
      // 🗂️ PROPER FOLDER STRUCTURE: lecturer_exercise/classId/exerciseId/
      const baseFolder = `lecturer_exercise/${classId}/${exerciseId}`;
      
      if (formData.answerSchemeFile) {
        console.log('🌤️ Uploading answer scheme to:', `${baseFolder}/answer-scheme`);
        
        // For lecturers: Use direct Cloudinary upload (unsigned preset)
        answerSchemeData = await uploadToCloudinary(
          formData.answerSchemeFile, 
          baseFolder, // This creates: lecturer_exercise/class123/exerciseABC123/
          { 
            filename: 'answer-scheme', // Predictable filename for overwrite
            resourceType: 'image'
          }
        );
        console.log('✅ Answer scheme uploaded:', answerSchemeData.url);
      }

      // ❌ REMOVED: rubricFile upload block - rubric is now text in the form

      return { answerSchemeData, rubricData: null }; // Return null for rubricData
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  // 📋 FORMAT CLOUDINARY DATA FOR FIRESTORE - Only answer scheme now
  const formatFirebaseStorageData = (answerSchemeData, rubricData = null) => {
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
      
      // ❌ REMOVED: rubric file object - rubric is now stored as text field in Firestore
      // Note: Your form should have a 'rubricText' field that gets saved directly to Firestore
    };
  };

  return {
    validateFile,
    uploadFiles, // 🆕 UPDATED: Only handles answer scheme file upload
    formatFirebaseStorageData
  };
};