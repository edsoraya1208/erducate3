// 🔥 FIREBASE STORAGE UPLOAD LOGIC COMPONENT
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

// 🎯 UPLOAD HANDLER: Manages all file upload logic and validation
export const useUploadHandler = () => {

  // 📁 ENHANCED FILE VALIDATION
  const validateFile = (file, fileType) => {
    try {
      // Size validation (10MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 2MB');
      }

      // 📝 TYPE VALIDATION based on field
      if (fileType === 'answerSchemeFile') {
        // Answer scheme should be images only
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Answer scheme must be an image file (JPG, PNG, GIF, WebP)');
        }
      } else if (fileType === 'rubricFile') {
        // Rubric should be PDF only
        if (file.type !== 'application/pdf') {
          throw new Error('Rubric must be a PDF file');
        }
      }

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

  // 🔥 UPLOAD FILES TO FIREBASE STORAGE
  const uploadFiles = async (formData) => {
    let answerSchemeData = null;
    let rubricData = null;

    try {
      if (formData.answerSchemeFile) {
        console.log('Uploading answer scheme to Firebase Storage...');
        answerSchemeData = await uploadToFirebaseStorage(
          formData.answerSchemeFile, 
          'answer-schemes'
        );
        console.log('✅ Answer scheme uploaded:', answerSchemeData.url);
      }

      if (formData.rubricFile) {
        console.log('Uploading rubric to Firebase Storage...');
        rubricData = await uploadToFirebaseStorage(
          formData.rubricFile, 
          'rubrics'
        );
        console.log('✅ Rubric uploaded:', rubricData.url);
      }

      return { answerSchemeData, rubricData };
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  // 🔥 FIREBASE STORAGE UPLOAD FUNCTION
  const uploadToFirebaseStorage = async (file, folder = 'exercises') => {
    if (!file) {
      throw new Error('No file provided');
    }

    try {
      // 🔒 PREVENT DUPLICATES - Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const uniqueFilename = `${folder}_${timestamp}_${randomString}.${fileExtension}`;

      // 📤 CREATE FIREBASE STORAGE REFERENCE
      const storageRef = ref(storage, `${folder}/${uniqueFilename}`);
      
      console.log(`🔥 Uploading ${file.name} to Firebase Storage...`);
      
      // 🔥 UPLOAD TO FIREBASE STORAGE
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload completed, getting download URL...');
      
      // 📥 GET DOWNLOAD URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Firebase Storage upload successful:', downloadURL);
      
      // 📊 RETURN USEFUL DATA (similar to Cloudinary format for consistency)
      return {
        url: downloadURL,                    // Download URL for file access
        fullPath: snapshot.ref.fullPath,     // Full path in storage (like publicId)
        name: snapshot.ref.name,             // Storage filename
        bucket: snapshot.ref.bucket,         // Storage bucket
        originalName: file.name,             // Original filename
        fileType: file.type,                 // MIME type
        fileSize: file.size,                 // File size in bytes
        
        // 🆕 ADDITIONAL USEFUL DATA
        storageFolder: folder,               // Which folder it's stored in
        uniqueFilename: uniqueFilename,      // Our generated unique name
        bytesToMB: (file.size / 1024 / 1024).toFixed(2), // Human readable size
        uploadedAt: new Date().toISOString(), // Upload timestamp
        
        // 🖼️ For images, we don't get width/height from Firebase Storage
        // You'd need to use a separate library if you need image dimensions
        width: null,                         // Firebase doesn't provide this
        height: null,                        // Firebase doesn't provide this
        format: file.name.split('.').pop()   // File extension
      };

    } catch (error) {
      console.error('❌ Firebase Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  // 📋 FORMAT FIREBASE STORAGE DATA FOR FIRESTORE
  const formatFirebaseStorageData = (answerSchemeData, rubricData) => {
    return {
      answerScheme: answerSchemeData ? {
        url: answerSchemeData.url,           
        fullPath: answerSchemeData.fullPath,     // Firebase Storage path (replaces publicId)
        storageName: answerSchemeData.name,      // Storage filename
        bucket: answerSchemeData.bucket,         // Storage bucket
        originalName: answerSchemeData.originalName,
        fileType: answerSchemeData.fileType,
        fileSize: answerSchemeData.fileSize,
        width: answerSchemeData.width,       
        height: answerSchemeData.height,
        format: answerSchemeData.format,
        uploadedAt: answerSchemeData.uploadedAt
      } : null,
      
      rubric: rubricData ? {
        url: rubricData.url,
        fullPath: rubricData.fullPath,           // Firebase Storage path (replaces publicId)
        storageName: rubricData.name,            // Storage filename
        bucket: rubricData.bucket,               // Storage bucket
        originalName: rubricData.originalName,
        fileType: rubricData.fileType,
        fileSize: rubricData.fileSize,
        format: rubricData.format,
        uploadedAt: rubricData.uploadedAt
      } : null
    };
  };

  return {
    validateFile,
    uploadFiles,
    formatFirebaseStorageData // dah tukar from formatcloudinary tadi
  };
};