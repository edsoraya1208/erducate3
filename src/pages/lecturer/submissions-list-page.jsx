// src/pages/lecturer/submission-list-page.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
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

  // Fetch exercise data
  // Fetch exercise data
useEffect(() => {
  const fetchExerciseData = async () => {
    if (!exerciseId) return;
    
    try {
      // We need to find which class this exercise belongs to
      // First, let's try to get it from a submission (if any exists)
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('exerciseId', '==', exerciseId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      if (!submissionsSnapshot.empty) {
        const firstSubmission = submissionsSnapshot.docs[0].data();
        const classId = firstSubmission.classId;
        
        // ✅ VERIFY LECTURER OWNS THIS CLASS FIRST
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        
        if (!classSnap.exists() || classSnap.data().instructorId !== user?.uid) {
          console.error('Unauthorized: You do not own this class');
          navigate('/lecturer/dashboard');
          return;
        }
        
        // Now fetch the exercise from the class
        const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
        const exerciseSnap = await getDoc(exerciseRef);
        
        if (exerciseSnap.exists()) {
          setExerciseData({
            id: exerciseSnap.id,
            classId: classId,
            ...exerciseSnap.data()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching exercise:', error);
    }
  };

  fetchExerciseData();
}, [exerciseId, user, navigate]);

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!exerciseId) return;
      
      setLoading(true);
      try {
        const q = query(
          collection(db, 'submissions'),
          where('exerciseId', '==', exerciseId)
        );
        const querySnapshot = await getDocs(q);
        
        const submissionsData = [];
        let pendingReview = 0;
        let pendingConfirmation = 0;
        let published = 0;
        
        querySnapshot.forEach((doc) => {
          const data = {
            id: doc.id,
            ...doc.data()
          };
          submissionsData.push(data);
          
          // Count statuses
          if (data.status === 'submitted') pendingReview++;
          else if (data.status === 'graded') pendingConfirmation++;
          else if (data.status === 'published') published++;
        });
        
        // Sort by submission date (newest first)
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
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [exerciseId]);

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