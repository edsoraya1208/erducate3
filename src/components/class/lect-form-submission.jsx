// 🔥 FIREBASE IMPORTS
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🆕 FORM SUBMISSION HANDLER: Manages all form submission logic
export const useFormSubmission = () => {

  // 🆕 CUSTOM VALIDATION FUNCTION
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

    return errors;
  };

  // 💾 SAVE EXERCISE TO FIRESTORE
  const saveExerciseToFirestore = async (exerciseData, classId, draftId = null) => {
    try {
      console.log('Saving exercise to Firestore...');
      console.log('About to save to path:', `classes/${classId}/exercises`);
      console.log('ClassID value:', classId);
      
      let docRef;
      if (draftId) {
        // Update existing draft
        const existingDraftRef = doc(db, 'classes', classId, 'exercises', draftId);
        await updateDoc(existingDraftRef, exerciseData);
        docRef = { id: draftId };
      } else {
        // Create new exercise
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

  // 💾 SAVE AS DRAFT FUNCTION
  const saveDraft = async (formData, classId, user, getUserDisplayName, uploadFiles, formatFirebaseStorageData, draftId = null) => {
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

      // 🌤️ Upload files if they exist
      const { answerSchemeData, rubricData } = await uploadFiles(formData);
      const FirebaseStorageUpload = formatFirebaseStorageData(answerSchemeData, rubricData);

      // 📝 Create draft exercise data
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

      // Save to Firestore
      await saveExerciseToFirestore(draftData, classId, draftId);
      console.log('✅ Draft saved successfully');
      
      return true; // Success
      
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      throw error;
    }
  };

  // 🚀 SUBMIT EXERCISE FUNCTION
  const submitExercise = async (formData, classId, user, getUserDisplayName, uploadFiles, formatFirebaseStorageData, draftId = null) => {
    try {
      // 🌤️ STEP 1: Upload files to firebase
      const { answerSchemeData, rubricData } = await uploadFiles(formData);
      const FirebaseStorageUpload = formatFirebaseStorageData(answerSchemeData, rubricData);

      // 🗄️ STEP 2: Prepare exercise data
      const exerciseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate || null,
        totalMarks: formData.totalMarks ? parseInt(formData.totalMarks) : null,
        
        ...FirebaseStorageUpload,
        
        // ✅ User and metadata
        createdBy: getUserDisplayName(),
        createdById: user.uid,
        updatedAt: serverTimestamp(),
        status: 'active' // Keep as active for regular submit
      };

      // 🗄️ STEP 3: Save to Firestore
      const docRef = await saveExerciseToFirestore(exerciseData, classId, draftId);
      
      console.log('✅ Exercise created with ID:', docRef.id);
      return docRef;
      
    } catch (error) {
      console.error('❌ Error creating exercise:', error);
      throw error;
    }
  };

  return {
    validateForm,
    saveDraft,
    submitExercise
  };
};