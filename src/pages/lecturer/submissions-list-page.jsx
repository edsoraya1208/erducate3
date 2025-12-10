import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

// Components
import LecturerSubmissions from '../../components/class/submission-list';
import DashboardHeader from '../../components/dashboard/dashboard-header';

const ExerciseSubmissionsPage = () => {
  const { exerciseId, classId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  // State
  const [exerciseData, setExerciseData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendingReview: 0,
    pendingConfirmation: 0,
    published: 0
  });

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  useEffect(() => {
    if (!exerciseId || !classId || !user) return;

    let unsubscribe = null;
    
    const initializeData = async () => {
      setLoading(true);
      
      try {
        // 1. Verify lecturer owns this class
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
          console.error('Class not found');
          navigate('/lecturer/dashboard1');
          return;
        }

        const classData = classSnap.data();
        if (classData.instructorId !== user.uid) {
          console.error('Unauthorized');
          navigate('/lecturer/dashboard1');
          return;
        }

        // 2. Fetch exercise data
        const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
        const exerciseSnap = await getDoc(exerciseRef);

        if (!exerciseSnap.exists()) {
          console.error('Exercise not found');
          navigate(`/lecturer/class/${classId}`);
          return;
        }

        const exercise = { 
          id: exerciseSnap.id, 
          classId: classId,
          ...exerciseSnap.data() 
        };
        setExerciseData(exercise);

        // Real-time listener for exercise updates
        unsubscribe = onSnapshot(exerciseRef, (snap) => {
          if (snap.exists()) {
            setExerciseData({
              id: snap.id,
              classId: classId,
              ...snap.data()
            });
          }
        });

        // 3. Get submissions
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('exerciseId', '==', exerciseId)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);

        if (submissionsSnapshot.empty) {
          setLoading(false);
          return;
        }

        // 4. Process submissions & Stats
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
        
        // Sort: Newest first
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

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [exerciseId, classId, user, navigate]);

  const handleViewAndGrade = (submissionId) => {
    // Navigate to the Grading Page
    navigate(`/lecturer/class/${classId}/exercise/${exerciseId}/grade/${submissionId}`);
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
        onViewAndGrade={handleViewAndGrade}
        getUserDisplayName={getUserDisplayName}
      />
    </div>
  );
};

export default ExerciseSubmissionsPage;