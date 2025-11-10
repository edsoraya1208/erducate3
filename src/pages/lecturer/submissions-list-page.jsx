// src/pages/lecturer/submission-list-page.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import LecturerSubmissions from '../../components/class/submission-list';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const ExerciseSubmissionsPage = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  
  const [exerciseData, setExerciseData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendingReview: 0,
    pendingConfirmation: 0,
    published: 0
  });

  const [user] = useAuthState(auth);

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  // ✅ COMBINED FETCH - Loads exercise + submissions together
  // ✅ REAL-TIME LISTENER - Auto-updates when due date changes
  useEffect(() => {
    if (!exerciseId || !user) return;

    let unsubscribe = null;
    
    const initializeData = async () => {
      setLoading(true);
      
      try {
        // First, get submissions to find classId
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('exerciseId', '==', exerciseId)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        if (submissionsSnapshot.empty) {
          setLoading(false);
          return;
        }

        const firstSubmission = submissionsSnapshot.docs[0].data();
        const classId = firstSubmission.classId;
        
        // Verify lecturer owns this class
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDocs(query(collection(db, 'classes'), where('__name__', '==', classId)));
        
        if (classSnap.empty) {
          console.error('Class not found');
          navigate('/lecturer/dashboard');
          return;
        }

        const classData = classSnap.docs[0].data();
        if (classData.instructorId !== user.uid) {
          console.error('Unauthorized: You do not own this class');
          navigate('/lecturer/dashboard');
          return;
        }

        // ✅ Set up real-time listener for exercise (auto-updates when due date changes)
        const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
        unsubscribe = onSnapshot(exerciseRef, (exerciseSnap) => {
          if (exerciseSnap.exists()) {
            setExerciseData({
              id: exerciseSnap.id,
              classId: classId,
              ...exerciseSnap.data()
            });
          }
        });

        // Process submissions
        const submissionsData = [];
        let pendingReview = 0;
        let pendingConfirmation = 0;
        let published = 0;
        
        submissionsSnapshot.forEach((doc) => {
          const data = {
            id: doc.id,
            ...doc.data()
          };
          submissionsData.push(data);
          
          if (data.status === 'submitted') pendingReview++;
          else if (data.status === 'graded') pendingConfirmation++;
          else if (data.status === 'published') published++;
        });
        
        submissionsData.sort((a, b) => {
          const aDate = a.submittedAt?.toDate?.() || new Date(a.submittedAt) || new Date(0);
          const bDate = b.submittedAt?.toDate?.() || new Date(b.submittedAt) || new Date(0);
          return bDate - aDate;
        });
        
        setSubmissions(submissionsData);
        setStats({
          total: submissionsData.length,
          pendingReview,
          pendingConfirmation,
          published
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [exerciseId, user, navigate]);

  const handleGradeSubmission = (submissionId) => {
    // TODO: Navigate to grading page when ready
    console.log('Grade submission:', submissionId);
    // navigate(`/lecturer/grade-submission/${submissionId}`);
  };

  const handleViewSubmission = (submissionId) => {
    // TODO: Navigate to view page when ready
    console.log('View submission:', submissionId);
    // navigate(`/lecturer/view-submission/${submissionId}`);
  };

  return (
    <div className="submissions-page">
      <DashboardHeader 
        userType="lecturer"
        currentPage="submissions"
        additionalNavItems={[]}
      />
      
      <LecturerSubmissions 
        exerciseData={exerciseData}
        submissions={submissions}
        stats={stats}
        loading={loading}
        onGradeSubmission={handleGradeSubmission}
        onViewSubmission={handleViewSubmission}
        getUserDisplayName={getUserDisplayName}
      />
    </div>
  );
};

export default ExerciseSubmissionsPage;