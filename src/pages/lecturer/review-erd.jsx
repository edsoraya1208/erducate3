// src/pages/lecturer/LecturerReviewERD.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DashboardHeader from '../../components/dashboard/dashboard-header';
import LecturerReviewERDComponent from '../../components/class/lect-review-erd-components';
import '../../styles/create-exercise.css?v=4';

const LecturerReviewERD = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const { 
    detectedData, 
    exerciseData, 
    classId, 
    exerciseId,
    rubricAnalysis // ✅ Grab this from location state
  } = location.state || {};

  useEffect(() => {
    console.log('📍 Review page loaded, checking data...');
    // ... (Keep existing validation logic) ...
    if (!detectedData || !exerciseData || !classId || !exerciseId) {
      console.error('❌ Missing required data!');
      alert('Missing data. Redirecting...');
      navigate('/lecturer/dashboard1', { replace: true });
    } else if (!detectedData.isERD) {
      alert(`❌ This is not an ERD diagram!\n\nReason: ${detectedData.reason || 'Invalid image format'}\n\nPlease upload a valid ERD diagram.`);
      navigate(-1, { replace: true });
    }
  }, [detectedData, exerciseData, classId, exerciseId, navigate]);

  // ✅ UPDATED: Now receives the processed data from the component
  const handlePublish = async (publishData) => {
    setIsLoading(true);
    
    console.log('🔥 Page received data to publish:', publishData);
    
    try {
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      
      // ✅ Prepare Firestore Update Data
      const updateData = {
        correctAnswer: {
          elements: publishData.elements // Elements cleaned by component
        },
        status: 'active',
        approvedAt: serverTimestamp(), // Added approvedAt to match original component logic
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // ✅ Add Rubric data if it exists in the passed data
      if (publishData.rubricStructured) {
        updateData.rubricStructured = {
            ...publishData.rubricStructured,
            detectedAt: serverTimestamp()
        };
      }

      // ✅ Perform the DB write
      await updateDoc(exerciseRef, updateData);

      console.log('✅ Firebase update successful!');
      alert('✅ Exercise published successfully!');
      navigate(`/lecturer/class/${classId}`, { replace: true });
      
    } catch (error) {
      console.error('❌ Publish error:', error);
      alert('❌ Failed to publish exercise');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure? This will discard the exercise.')) {
      navigate(`/lecturer/class/${classId}`, { replace: true });
    }
  };

  if (!detectedData || !detectedData.isERD) {
    return (
      <div className="ce-page create-exercise-container">
        <DashboardHeader userType="lecturer" currentPage="review-erd" />
        <div style={{ padding: '2rem', textAlign: 'center' }}><p>Loading review data...</p></div>
      </div>
    );
  }

  return (
    <div className="ce-page create-exercise-container">
      <DashboardHeader userType="lecturer" currentPage="review-erd" />
      
      {/* ✅ Component is now Pure UI, Page handles the Logic */}
      <LecturerReviewERDComponent
        detectedData={detectedData}
        answerSchemeUrl={exerciseData.answerScheme.url}
        rubricText={exerciseData.rubricText}
        rubricAnalysis={rubricAnalysis} // Pass this down
        onPublish={handlePublish}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default LecturerReviewERD;