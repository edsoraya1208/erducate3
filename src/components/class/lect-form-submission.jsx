// 🔥 FIREBASE IMPORTS
import { collection, addDoc, serverTimestamp, doc, updateDoc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

// 🆕 FORM SUBMISSION HANDLER: Manages all form submission logic
export const useFormSubmission = () => {

  // 🆕 BULLETPROOF VALIDATION - Handles all edge cases
  const validateForm = (formData, existingData = null, isDraftSave = false) => {
  const errors = {};

  // 🛡️ Check if editing a published exercise
  const isEditingPublished = existingData?.status === 'active';

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
    if (!formData.dueTime?.trim()) {
      errors.dueTime = 'Please fill out this field.';
    }

    // 🔧 FILE VALIDATION: Allow published exercises to keep existing files
    const hasAnswerScheme = formData.answerSchemeFile || existingData?.answerScheme;
    const hasRubric = formData.rubricText?.trim() || existingData?.rubricText || existingData?.rubricStructured;
    
    // ✅ Only require files if NOT editing published exercise
    if (!isEditingPublished) {
      if (!hasAnswerScheme) {
        errors.answerSchemeFile = 'Please upload an answer scheme file.';
      }
      if (!hasRubric) {
        errors.rubricText = 'Please enter rubric grading criteria.';
      }
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
    console.log('💾 Saving exercise to Firestore...');
    
    let docRef;
    if (exerciseRef) {
      console.log('   - Checking if document exists:', exerciseRef.id);
      console.log('   - Path:', exerciseRef.path);
      
      // ✅ CHECK if document exists before updating
      const docSnap = await getDoc(exerciseRef);
      
      if (docSnap.exists()) {
        // Document exists → UPDATE it
        console.log('   - Document exists, updating...');
        await updateDoc(exerciseRef, {
          ...exerciseData,
          updatedAt: serverTimestamp()
        });
        docRef = exerciseRef;
        console.log('✅ Updated existing document');
      } else {
        // Document doesn't exist → CREATE it
        console.log('   - Document does not exist, creating...');
        exerciseData.createdAt = serverTimestamp();
        exerciseData.updatedAt = serverTimestamp();
        await setDoc(exerciseRef, exerciseData);
        docRef = exerciseRef;
        console.log('✅ Created new document');
      }
    } else {
      console.log('   - Creating new document');
      exerciseData.createdAt = serverTimestamp();
      exerciseData.updatedAt = serverTimestamp();
      docRef = await addDoc(collection(db, 'classes', classId, 'exercises'), exerciseData);
      console.log('✅ Created new document:', docRef.id);
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

  // 📁 SMART FILE HANDLER - Preserves existing files (ANSWER SCHEME ONLY NOW)
  const handleFileUploads = async (formData, classId, exerciseId, existingData = null, uploadFiles, formatFirebaseStorageData) => {
    console.log('📁 Processing file uploads...');
    
    try {
      // Upload new files (only answer scheme now)
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

      // ❌ REMOVED: Rubric file handling - now using text

      console.log('📁 Final file status:');
      console.log('  - Answer scheme:', finalFileData.answerScheme ? '✅ Present' : '❌ Missing');

      return finalFileData;
    } catch (error) {
      console.error('❌ Error handling file uploads:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  };

  // 💾 SAVE AS DRAFT - IMPROVED with datetime handling and rubric text
  const saveDraft = async (formData, classId, user, getUserDisplayName, uploadFiles, formatFirebaseStorageData, existingDraftRef = null) => {
    // More lenient check for drafts - save if ANY content exists
    const hasContent = formData.title?.trim() || 
                      formData.description?.trim() || 
                      formData.answerSchemeFile || 
                      formData.rubricText?.trim() || // 🆕 CHANGED: Check for rubric text instead of file
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

      // Handle files with preservation (answer scheme only)
      const fileData = await handleFileUploads(formData, classId, exerciseId, existingData, uploadFiles, formatFirebaseStorageData);

      // 🆕 CHANGE: Convert date + time to Firebase Timestamp
      const dueDateTime = createDueDateTimestamp(formData.dueDate, formData.dueTime);

      // 📝 Create draft data
      const draftData = {
        title: formData.title?.trim() || 'Untitled Exercise',
        description: formData.description?.trim() || '',
        dueDate: dueDateTime, // 🆕 CHANGED: Now stores Timestamp instead of string
        totalMarks: formData.totalMarks ? parseInt(formData.totalMarks) : null,
        rubricText: formData.rubricText?.trim() || '', // ✅ Keep this - store raw input for editing
        
        ...fileData, // Add preserved + new files (answer scheme only)
        
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

  // 🚀 SUBMIT EXERCISE - WITH AI DETECTION AND RUBRIC ANALYSIS
  const submitExercise = async (formData, classId, user, getUserDisplayName, uploadFiles, formatFirebaseStorageData, existingDraftId = null, setAiLoadingMessage = null) => {
    try {
      let docRef;
      let existingData = null;
      let isEditingExistingExercise = false;

      // 🛡️ CRITICAL: Always use existing document if draftId exists
      if (existingDraftId) {
        console.log('📝 Editing existing exercise:', existingDraftId);
        docRef = doc(db, 'classes', classId, 'exercises', existingDraftId);
        existingData = await fetchExistingData(docRef);
        isEditingExistingExercise = true;
        
        if (!existingData) {
          console.error('❌ Exercise not found:', existingDraftId);
          return { success: false, message: 'Exercise not found' };
        }
        
        console.log('✅ Existing exercise data:', existingData);
      } else {
        console.log('🆕 Creating new exercise');
        docRef = createDocumentReference(classId);
      }
      
      const exerciseId = docRef.id;
      console.log('📋 Using exercise ID:', exerciseId);
      console.log('   - Is editing existing?', isEditingExistingExercise);

      // 🛡️ VALIDATE BEFORE PROCESSING
        const validationErrors = validateForm(formData, existingData, false);        if (Object.keys(validationErrors).length > 0) {
        console.error('❌ Validation failed:', validationErrors);
        return { success: false, errors: validationErrors };
      }

      // 🔍 CHECK: Is this already an active exercise with AI results?
      const hasExistingAIResults = existingData?.status === 'active' && existingData?.correctAnswer?.elements;

      console.log('🔍 Checking exercise status:');
      console.log('   - existingData.status:', existingData?.status);
      console.log('   - Has AI results?', hasExistingAIResults);
      console.log('   - Will run AI?', !hasExistingAIResults);

      // Handle files with preservation (answer scheme only)
      const fileData = await handleFileUploads(formData, classId, exerciseId, existingData, uploadFiles, formatFirebaseStorageData);

      // Convert date + time to Firebase Timestamp
      const dueDateTime = createDueDateTimestamp(formData.dueDate, formData.dueTime);

      if (!dueDateTime) {
        console.error('❌ Failed to create due date timestamp');
        return { 
          success: false, 
          errors: { dueDate: 'Invalid date or time format' }
        };
      }

      // 📝 Create exercise data
      const exerciseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: dueDateTime,
        totalMarks: Number(formData.totalMarks),
        rubricText: formData.rubricText?.trim() || '', // 🆕 NEW: Save rubric as text
        
        ...fileData, // Answer scheme only
        
        createdBy: getUserDisplayName(),
        createdById: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (!existingData) {
        exerciseData.createdAt = serverTimestamp();
      }

      // 🎯 DECISION: Active exercise with AI results OR new publish?
    if (hasExistingAIResults) {
      // ✅ EDITING PUBLISHED EXERCISE: Keep existing AI results, just update fields
      console.log('✅ Updating published exercise - preserving AI results');
      console.log('   - Using docRef ID:', docRef.id);
      console.log('   - Should match existing:', existingDraftId);
      
      exerciseData.status = 'active';
      exerciseData.correctAnswer = existingData.correctAnswer;
      
      if (existingData.rubricStructured) {
        exerciseData.rubricStructured = existingData.rubricStructured;
        console.log('   - Preserved rubricStructured');
      }
      
      if (!formData.rubricText?.trim() && existingData.rubricText) {
        exerciseData.rubricText = existingData.rubricText;
      }
      
      // 🔥 CRITICAL: Use updateDoc instead of setDoc to avoid overwriting
      console.log('🔥 Updating document at path:', `classes/${classId}/exercises/${docRef.id}`);
      await updateDoc(docRef, exerciseData);
      console.log('✅ Published exercise updated successfully');
      return { success: true, exerciseId: docRef.id, isUpdate: true };
    } else {
        // 🆕 NEW PUBLISH: Save as draft first, then trigger AI
        exerciseData.status = 'draft';
        await saveExerciseToFirestore(exerciseData, classId, docRef);
        console.log('✅ Draft saved, calling AI detection...');

        // 🤖 CALL AI DETECTION API
        try {
          if (setAiLoadingMessage) {
            setAiLoadingMessage('🤖 Analyzing ERD with AI... This may take a moment...');
          }
          
          console.log('🤖 Step 1: Calling ERD detection API...');
          
          const detectionResponse = await fetch('https://ai-api-server-vmaz.onrender.com/detect-erd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: fileData.answerScheme.url })
          });

          if (!detectionResponse.ok) {
            const errorData = await detectionResponse.json();
            throw new Error(errorData.message || 'AI detection API failed');
          }

          const detectedData = await detectionResponse.json();
          console.log('✅ Step 1 complete: ERD detected');

          // ✅ Check if it's an ERD
          if (!detectedData.isERD) {
            if (setAiLoadingMessage) {
              setAiLoadingMessage(null);
            }
            console.error('❌ Not an ERD:', detectedData.reason);
            return { 
              success: false, 
              message: `This is not an ERD diagram.\n\nReason: ${detectedData.reason || 'Invalid image format'}\n\nPlease upload a valid ERD diagram.`
            };
          }

          // 🆕 Step 2: Call rubric analysis API
          let rubricAnalysis = null;
          if (formData.rubricText?.trim()) {
            if (setAiLoadingMessage) {
              setAiLoadingMessage('🤖 Analyzing rubric... Almost done...');
            }

            console.log('🤖 Step 2: Calling rubric analysis API...');
            console.log('📝 Rubric text:', formData.rubricText.trim().substring(0, 100) + '...');
            
            const rubricResponse = await fetch('https://ai-api-server-vmaz.onrender.com/detect-rubric', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rubricText: formData.rubricText.trim() })
            });

            console.log('📡 Rubric API response status:', rubricResponse.status);

            if (rubricResponse.ok) {
              rubricAnalysis = await rubricResponse.json();
              console.log('✅ Step 2 complete: Rubric analyzed');
              
              // ✅ Verify it's actually an ERD rubric
              if (!rubricAnalysis.isERDRubric) {
                throw new Error('Rubric analysis failed: Not an ERD rubric');
              }
            } else {
              const errorText = await rubricResponse.text();
              console.error('❌ Rubric analysis failed:', errorText);
              throw new Error(`Rubric analysis API failed: ${errorText}`); // ✅ FAIL completely
            }
          } else {
            console.log('ℹ️ No rubric text provided, skipping rubric analysis');
          }

          // ✅ Clear loading message
          if (setAiLoadingMessage) {
            setAiLoadingMessage(null);
          }

          console.log('✅ All AI processing complete, preparing navigation data...');
          console.log('🔍 Final rubricAnalysis:', rubricAnalysis);
          
          // 🆕 RETURN with navigation data to review page
          const reviewData = {
            detectedData,
            rubricAnalysis, // This should now be populated
            exerciseData: {
              ...exerciseData,
              answerScheme: fileData.answerScheme,
              rubricText: formData.rubricText?.trim() || ''
            },
            classId,
            exerciseId: docRef.id
          };

          console.log('🚀 Navigating with reviewData:', reviewData);

          return { 
            success: true, 
            navigateToReview: true,
            reviewData
          };

        } catch (aiError) {
          if (setAiLoadingMessage) {
            setAiLoadingMessage(null);
          }
          console.error('❌ AI processing failed:', aiError);
          return { 
            success: false, 
            message: `AI detection failed: ${aiError.message}\n\nPlease try again or check your internet connection.`
          };
        }
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