// src/pages/lecturer/LecturerReviewERD.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DashboardHeader from '../../components/dashboard/dashboard-header';
import LecturerReviewERDComponent from '../../components/class/lect-review-erd-components';
import '../../styles/create-exercise.css';

const LecturerReviewERD = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const { 
    detectedData, 
    exerciseData, 
    classId, 
    exerciseId 
  } = location.state || {};

  useEffect(() => {
    console.log('📍 Review page loaded, checking data...');
    console.log('detectedData:', detectedData);
    console.log('classId:', classId);
    console.log('exerciseId:', exerciseId);

    if (!detectedData || !exerciseData || !classId || !exerciseId) {
      console.error('❌ Missing required data!');
      alert('Missing data. Redirecting...');
      navigate('/lecturer/dashboard1', { replace: true });
    } else if (!detectedData.isERD) {
      // ✅ Handle non-ERD images
      alert(`❌ This is not an ERD diagram!\n\nReason: ${detectedData.reason || 'Invalid image format'}\n\nPlease upload a valid ERD diagram.`);
      navigate(-1, { replace: true });
    } else {
      console.log('✅ All data present, showing review page');
    }
  }, [detectedData, exerciseData, classId, exerciseId, navigate]);

  const handlePublish = async (reviewedData) => {
    setIsLoading(true);
    
    try {
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      
      await updateDoc(exerciseRef, {
        correctAnswer: {
          elements: reviewedData.elements
        },
        status: 'active',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert('✅ Exercise published successfully!');
      navigate(`/lecturer/class/${classId}`, { replace: true });
      
    } catch (error) {
      console.error('Publish error:', error);
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
        <DashboardHeader 
          userType="lecturer"
          currentPage="review-erd"
          additionalNavItems={[]}
        />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading review data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ce-page create-exercise-container">
      <DashboardHeader 
        userType="lecturer"
        currentPage="review-erd"
        additionalNavItems={[]}
      />
      
      <LecturerReviewERDComponent
        detectedData={detectedData}
        answerSchemeUrl={exerciseData.answerScheme.url}
        rubricUrl={exerciseData.rubric?.url}
        onPublish={handlePublish}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};

export default LecturerReviewERD;