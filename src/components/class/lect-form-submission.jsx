// 🔥 FIREBASE IMPORTS
import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🆕 FORM SUBMISSION HANDLER: Manages all form submission logic
export const useFormSubmission = () => {

  // 🆕 BULLETPROOF VALIDATION - Handles all edge cases
  const validateForm = (formData, existingData = null, isDraftSave = false) => {
    const errors = {};

    // Always require basic fields (even for drafts when publishing)
    if (!isDraftSave) {
      if (!formData.title?.trim()) {
        errors.title = 'Please fill out this field.';
      }
      if (!formData.description?.trim()) {
        errors.description = 'Please fill out this field.';
      }
      if (!formData.totalMarks || formData.totalMarks <= 0) {
        errors.totalMarks = 'Please fill out this field.';
      } else if (formData.totalMarks < 1 || formData.totalMarks > 100) {
        errors.totalMarks = 'Total marks must be between 1 and 100.';
      }
      if (!formData.dueDate?.trim()) {
        errors.dueDate = 'Please fill out this field.';
      }
      // 🆕 NEW: Validate time field
      if (!formData.dueTime?.trim()) {
        errors.dueTime = 'Please fill out this field.';
      }

      // 🔧 SMART FILE VALIDATION: Check if we have files (existing OR new)
      const hasAnswerScheme = formData.answerSchemeFile || existingData?.answerScheme;
      const hasRubric = formData.rubricFile || existingData?.rubric;
      
      if (!hasAnswerScheme) {
        errors.answerSchemeFile = 'Please upload an answer scheme file.';
      }
      if (!hasRubric) {
        errors.rubricFile = 'Please upload a rubric file.';
      }
    }

    return errors;
  };

  // 🆕 NEW: Convert date + time strings to Firebase Timestamp
  const createDueDateTimestamp = (dateString, timeString) => {
    if (!dateString || !timeString) {
      return null;
    }

    try {
      // Combine date and time: "2025-01-10" + "23:59" = "2025-01-10T23:59:00"
      const dateTimeString = `${dateString}T${timeString}:00`;
      const dateObject = new Date(dateTimeString);
      
      // Check if date is valid
      if (isNaN(dateObject.getTime())) {
        console.error('Invalid date/time:', dateString, timeString);
        return null;
      }

      // Convert to Firebase Timestamp
      return Timestamp.fromDate(dateObject);
    } catch (error) {
      console.error('Error creating timestamp:', error);
      return null;
    }
  };

  // 🔄 Create document reference
  const createDocumentReference = (classId) => {
    return doc(collection(db, 'classes', classId, 'exercises'));
  };

  // 💾 SAVE EXERCISE TO FIRESTORE
  const saveExerciseToFirestore = async (exerciseData, classId, exerciseRef = null) => {
    try {
      console.log('Saving exercise to Firestore...');
      console.log('About to save to path:', `classes/${classId}/exercises`);
      console.log('ClassID value:', classId);
      
      let docRef;
      if (exerciseRef) {
        await setDoc(exerciseRef, exerciseData);
        docRef = exerciseRef;
      } else {
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

  // 🛡️ FETCH EXISTING DATA HELPER
  const fetchExistingData = async (docRef) => {
    try {
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        console.log('✅ Found existing document');
        return currentDoc.data();
      }
      console.log('ℹ️ No existing document found');
      return null;
    } catch (error) {
      console.error('⚠️ Error fetching existing document:', error);
      return null;
    }
  };

  // 📁 SMART FILE HANDLER - Preserves existing files
  const handleFileUploads = async (formData, classId, exerciseId, existingData = null, uploadFiles, formatFirebaseStorageData) => {
    console.log('📁 Processing file uploads...');
    
    try {
      // Upload new files (only if provided)
      const { answerSchemeData, rubricData } = await uploadFiles(formData, classId, exerciseId);
      const newFileData = formatFirebaseStorageData(answerSchemeData, rubricData);

      // 🔥 SMART MERGE: Preserve existing files, add new ones
      const finalFileData = {};
      
      // Handle answer scheme
      if (newFileData.answerScheme) {
        finalFileData.answerScheme = newFileData.answerScheme;
        console.log('✅ New answer scheme uploaded');
      } else if (existingData?.answerScheme) {
        finalFileData.answerScheme = existingData.answerScheme;
        console.log('✅ Preserved existing answer scheme');
      }

      // Handle rubric
      if (newFileData.rubric) {
        finalFileData.rubric = newFileData.rubric;
        console.log('✅ New rubric uploaded');
      } else if (existingData?.rubric) {
        finalFileData.rubric = existingData.rubric;
        console.log('✅ Preserved existing rubric');
      }

      console.log('📁 Final file status:');
      console.log('  - Answer scheme:', finalFileData.answerScheme ? '✅ Present' : '❌ Missing');
      console.log('  - Rubric:', finalFileData.rubric ? '✅ Present' : '❌ Missing');

      return finalFileData;
    } catch (error) {
      console.error('❌ Error handling file uploads:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  };

  // 💾 SAVE AS DRAFT - IMPROVED with datetime handling
  const saveDraft = async (formData, classId, user, getUserDisplayName, uploadFiles, formatFirebaseStorageData, existingDraftRef = null) => {
    // More lenient check for drafts - save if ANY content exists
    const hasContent = formData.title?.trim() || 
                      formData.description?.trim() || 
                      formData.answerSchemeFile || 
                      formData.rubricFile ||
                      formData.dueDate?.trim() ||
                      formData.totalMarks;

    if (!hasContent) {
      console.log('No content to save as draft');
      return { success: false, message: 'No content to save' };
    }

    if (!classId || !user?.uid) {
      console.warn('Cannot save draft: missing classId or user');
      return { success: false, message: 'Missing required data' };
    }

    try {
      console.log('Saving draft exercise...');

      let docRef = existingDraftRef;
      let existingData = null;

      if (!docRef) {
        docRef = createDocumentReference(classId);
      } else {
        // Fetch existing data to preserve files
        existingData = await fetchExistingData(docRef);
      }
      
      const exerciseId = docRef.id;
      console.log('📋 Using exercise ID:', exerciseId);

      // Handle files with preservation
      const fileData = await handleFileUploads(formData, classId, exerciseId, existingData, uploadFiles, formatFirebaseStorageData);

      // 🆕 CHANGE: Convert date + time to Firebase Timestamp
      const dueDateTime = createDueDateTimestamp(formData.dueDate, formData.dueTime);

      // 📝 Create draft data
      const draftData = {
        title: formData.title?.trim() || 'Untitled Exercise',
        description: formData.description?.trim() || '',
        dueDate: dueDateTime, // 🆕 CHANGED: Now stores Timestamp instead of string
        totalMarks: formData.totalMarks ? parseInt(formData.totalMarks) : null,
        
        ...fileData, // Add preserved + new files
        
        createdBy: getUserDisplayName(),
        createdById: user.uid,
        updatedAt: serverTimestamp(),
        status: 'draft'
      };

      // Add createdAt only for new drafts
      if (!existingData) {
        draftData.createdAt = serverTimestamp();
      }

      await saveExerciseToFirestore(draftData, classId, docRef);
      console.log('✅ Draft saved successfully with ID:', exerciseId);
      
      return { success: true, exerciseId, docRef };
      
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      return { success: false, message: error.message };
    }
  };

  // 🚀 SUBMIT EXERCISE - BULLETPROOF version with datetime
  // 🚀 SUBMIT EXERCISE - NOW WITH AI DETECTION
const submitExercise = async (formData, classId, user, getUserDisplayName, uploadFiles, formatFirebaseStorageData, existingDraftId = null) => {
  try {
    let docRef;
    let existingData = null;

    if (existingDraftId) {
      docRef = doc(db, 'classes', classId, 'exercises', existingDraftId);
      existingData = await fetchExistingData(docRef);
    } else {
      docRef = createDocumentReference(classId);
    }
    
    const exerciseId = docRef.id;
    console.log('📋 Using exercise ID:', exerciseId);

    // 🛡️ VALIDATE BEFORE PROCESSING
    const validationErrors = validateForm(formData, existingData, false);
    if (Object.keys(validationErrors).length > 0) {
      console.error('❌ Validation failed:', validationErrors);
      return { success: false, errors: validationErrors };
    }

    // Handle files with preservation
    const fileData = await handleFileUploads(formData, classId, exerciseId, existingData, uploadFiles, formatFirebaseStorageData);

    // 🆕 Convert date + time to Firebase Timestamp
    const dueDateTime = createDueDateTimestamp(formData.dueDate, formData.dueTime);

    if (!dueDateTime) {
      console.error('❌ Failed to create due date timestamp');
      return { 
        success: false, 
        errors: { dueDate: 'Invalid date or time format' }
      };
    }

    // 📝 Create exercise data (save as draft first)
    const exerciseData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      dueDate: dueDateTime,
      totalMarks: Number(formData.totalMarks),
      
      ...fileData,
      
      createdBy: getUserDisplayName(),
      createdById: user.uid,
      updatedAt: serverTimestamp(),
      status: 'pending_review' // 🆕 CHANGED: Not published yet
    };

    if (!existingData) {
      exerciseData.createdAt = serverTimestamp();
    }

    // 🗄️ Save draft to Firestore first
    await saveExerciseToFirestore(exerciseData, classId, docRef);
    console.log('✅ Draft saved, calling AI detection...');

    // 🤖 CALL AI DETECTION API
    try {
      const detectionResponse = await fetch('https://erducate.vercel.app/api/detect-erd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: fileData.answerScheme.url })
      });

      if (!detectionResponse.ok) {
        throw new Error('AI detection API failed');
      }

      const detectedData = await detectionResponse.json();

      // Check if it's an ERD
      if (!detectedData.isERD) {
        // Delete the draft since it's not an ERD
        await updateDoc(docRef, { status: 'rejected' });
        return { 
          success: false, 
          message: detectedData.reason || 'This is not an ERD diagram' 
        };
      }

      console.log('✅ AI detection complete, navigating to review page');
      
      // 🆕 RETURN with navigation data instead of publishing immediately
      return { 
        success: true, 
        navigateToReview: true,
        reviewData: {
          detectedData,
          exerciseData: {
            ...exerciseData,
            answerScheme: fileData.answerScheme,
            rubric: fileData.rubric
          },
          classId,
          exerciseId: docRef.id
        }
      };

    } catch (aiError) {
      console.error('❌ AI detection failed:', aiError);
      // Delete the draft
      await updateDoc(docRef, { status: 'ai_failed' });
      return { 
        success: false, 
        message: `AI detection failed: ${aiError.message}` 
      };
    }
    
  } catch (error) {
    console.error('❌ Error in submitExercise:', error);
    return { success: false, message: error.message };
  }
};

  return {
    validateForm,
    saveDraft,
    submitExercise,
    createDocumentReference,
    fetchExistingData // 🆕 NEW: Export for checking existing files
  };
};