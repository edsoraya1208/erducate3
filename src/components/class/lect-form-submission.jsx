// 🔥 FIREBASE IMPORTS
import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🆕 FORM SUBMISSION HANDLER: Manages all form submission logic
export const useFormSubmission = () => {

  // ❌ REMOVED: generateExerciseId() - We now use Firestore auto-generated IDs

  // 🆕 CUSTOM VALIDATION FUNCTION (UNCHANGED)
  const validateForm = (formData, isPublishedExercise) => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Please fill out this field.';
    }
    if (!formData.description.trim()) {
      errors.description = 'Please fill out this field.';
    }
    if (!formData.totalMarks || formData.totalMarks <= 0) {
      errors.totalMarks = 'Please fill out this field.';
    }
    if (!formData.answerSchemeFile && !isPublishedExercise) {
      errors.answerSchemeFile = 'Please fill out this field.';
    }
    if (!formData.rubricFile && !isPublishedExercise) {
      errors.rubricFile = 'Please fill out this field.';
    }
    if (!formData.dueDate || !formData.dueDate.trim()) {
      errors.dueDate = 'Please fill out this field.';
    }

    return errors;
  };

  // 🔄 UPDATED: Create document reference first to get ID
  const createDocumentReference = (classId) => {
    return doc(collection(db, 'classes', classId, 'exercises'));
  };

  // 💾 SAVE EXERCISE TO FIRESTORE (UPDATED for single ID approach)
  const saveExerciseToFirestore = async (exerciseData, classId, exerciseRef = null) => {
    try {
      console.log('Saving exercise to Firestore...');
      console.log('About to save to path:', `classes/${classId}/exercises`);
      console.log('ClassID value:', classId);
      
      let docRef;
      if (exerciseRef) {
        // Use existing document reference (for new exercises)
        await setDoc(exerciseRef, exerciseData);
        docRef = exerciseRef;
      } else {
        // Legacy support: Create new exercise with addDoc (for existing drafts)
        exerciseData.createdAt = serverTimestamp();
        docRef = await addDoc(collection(db, 'classes', classId, 'exercises'), exerciseData);
      }
      
      console.log('✅ Exercise saved with ID:', docRef.id);
      return docRef;
    } catch (error) {
      console.error('❌ Firestore error:', error);
      throw error;
    }
  };

  // 💾 SAVE AS DRAFT FUNCTION - UPDATED with single ID approach
  const saveDraft = async (formData, classId, user, getUserDisplayName, uploadFiles, formatFirebaseStorageData, existingDraftRef = null) => {
    // Only save if there's meaningful content
    if (!formData.title.trim() && !formData.description.trim()) {
      console.log('No content to save as draft');
      return false;
    }

    if (!classId || !user?.uid) {
      console.warn('Cannot save draft: missing classId or user');
      return false;
    }

    try {
      console.log('Saving draft exercise...');

      // 🆕 NEW APPROACH: Get document reference first to obtain exerciseId
      let docRef = existingDraftRef;
      if (!docRef) {
        docRef = createDocumentReference(classId);
      }
      const exerciseId = docRef.id; // 🔑 This is our single source of truth ID!
      
      console.log('📋 Using Firestore-generated exercise ID:', exerciseId);

      // 🌤️ Upload files with proper folder structure: exercises/classId/exerciseId/
      const { answerSchemeData, rubricData } = await uploadFiles(formData, classId, exerciseId);
      const FirebaseStorageUpload = formatFirebaseStorageData(answerSchemeData, rubricData);

      // 📝 Create draft exercise data (no separate exerciseId field needed!)
      const draftData = {
        title: formData.title.trim() || 'Untitled Exercise',
        description: formData.description.trim() || '',
        dueDate: formData.dueDate || null,
        totalMarks: formData.totalMarks ? parseInt(formData.totalMarks) : null,
        
        ...FirebaseStorageUpload,
        
        createdBy: getUserDisplayName(),
        createdById: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'draft' // 🆕 KEY DIFFERENCE: Mark as draft
      };

      // Save to Firestore using the document reference
      await saveExerciseToFirestore(draftData, classId, docRef);
      console.log('✅ Draft saved successfully with ID:', exerciseId);
      
      return { success: true, exerciseId, docRef }; // Return both for future reference
      
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      throw error;
    }
  };

  // 🚀 SUBMIT EXERCISE FUNCTION - UPDATED with single ID approach
  const submitExercise = async (formData, classId, user, getUserDisplayName, uploadFiles, formatFirebaseStorageData, existingDraftId = null, isPublishedExercise = false) => {
    try {
      let docRef;
      if (existingDraftId) {
        // Create proper document reference from the ID string
        docRef = doc(db, 'classes', classId, 'exercises', existingDraftId);
      } else {
        // Create new document reference
        docRef = createDocumentReference(classId);
      }
      const exerciseId = docRef.id;
      
      console.log('📋 Using Firestore-generated exercise ID:', exerciseId);

      const exerciseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate || null,
        totalMarks: formData.totalMarks ? parseInt(formData.totalMarks) : null,
        
        // ✅ User and metadata
        createdBy: getUserDisplayName(),
        createdById: user.uid,
        updatedAt: serverTimestamp(),
        status: 'active' // Keep as active for regular submit
      };

      // Add createdAt only for new documents
      if (!existingDraftRef) {
        exerciseData.createdAt = serverTimestamp();
      }

      // 🌤️ STEP 2: Only handle file uploads if NOT editing a published exercise
      if (!isPublishedExercise) {
        console.log('📁 Uploading files to folder: exercises/', classId, '/', exerciseId);
        const { answerSchemeData, rubricData } = await uploadFiles(formData, classId, exerciseId);
        const FirebaseStorageUpload = formatFirebaseStorageData(answerSchemeData, rubricData);
        
        // Add file data to exercise data
        Object.assign(exerciseData, FirebaseStorageUpload);
      } else {
        console.log('📁 Skipping file uploads (published exercise - files preserved)...');
        // For published exercises, we don't touch the answerScheme and rubric fields
        // They will remain as they were in the database
      }

      // 🗄️ STEP 3: Save to Firestore
      const savedDocRef = await saveExerciseToFirestore(exerciseData, classId, docRef);
      
      console.log('✅ Exercise created/updated with ID:', savedDocRef.id);
      console.log('📁 Files uploaded to folder:', `exercises/${classId}/${exerciseId}/`);
      return savedDocRef;
      
    } catch (error) {
      console.error('❌ Error creating/updating exercise:', error);
      throw error;
    }
  };

  return {
    validateForm,
    saveDraft,
    submitExercise,
    createDocumentReference // 🆕 NEW: Export for external use
  };
};