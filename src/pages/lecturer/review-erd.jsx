// src/pages/lecturer/LecturerReviewERD.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DashboardHeader from '../../components/dashboard/dashboard-header';
import LecturerReviewERDComponent from '../../components/class/LecturerReviewERDComponent';
import '../../styles/create-exercise.css';

const LecturerReviewERD = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Get state from URL parameter
  const stateParam = searchParams.get('state');
  const stateData = stateParam ? JSON.parse(decodeURIComponent(stateParam)) : null;

  const { 
    detectedData, 
    exerciseData, 
    classId, 
    exerciseId 
  } = stateData || {};

  useEffect(() => {
    if (!detectedData || !exerciseData || !classId || !exerciseId) {
      alert('Missing data. Redirecting...');
      navigate('/lecturer/dashboard1');
    }
  }, [detectedData, exerciseData, classId, exerciseId, navigate]);

  const handlePublish = async (reviewedData) => {
    setIsLoading(true);
    
    try {
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      
      await updateDoc(exerciseRef, {
        correctAnswer: {
          entities: reviewedData.entities,
          relationships: reviewedData.relationships,
          attributes: reviewedData.attributes
        },
        status: 'active',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert('Exercise published successfully!');
      navigate(`/lecturer/class/${classId}`);
      
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish exercise');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure? This will discard the exercise.')) {
      navigate(`/lecturer/class/${classId}`);
    }
  };

  if (!detectedData) return null;

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