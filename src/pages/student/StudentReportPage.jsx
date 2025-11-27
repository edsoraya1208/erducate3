// src/pages/student/StudentReportPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import DashboardHeader from '../../components/dashboard/dashboard-header';
import StudentReportComponent from '../../components/class/StudentReportComponent';
import '../../styles/lecturer-shared-header.css';
import '../../styles/student-report.css';

const StudentReportPage = () => {
  const { classId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, classId, exerciseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch exercise data
      const exerciseRef = doc(db, 'classes', classId, 'exercises', exerciseId);
      const exerciseSnap = await getDoc(exerciseRef);

      if (!exerciseSnap.exists()) {
        setError('Exercise not found');
        setLoading(false);
        return;
      }

      const exercise = { id: exerciseSnap.id, ...exerciseSnap.data() };
      setExerciseData(exercise);

      // Fetch student's submission
      const submissionsRef = collection(db, 'submissions');
      const submissionQuery = query(
        submissionsRef,
        where('classId', '==', classId),
        where('exerciseId', '==', exerciseId),
        where('studentId', '==', user.uid)
      );

      const submissionSnapshot = await getDocs(submissionQuery);

      if (submissionSnapshot.empty) {
        setError('No submission found for this exercise');
        setLoading(false);
        return;
      }

      const submissionDoc = submissionSnapshot.docs[0];
      const submissionData = { 
        id: submissionDoc.id, 
        ...submissionDoc.data() 
      };

      if (submissionData.status !== 'published') {
        setError('Your results are not yet published. Please check back later.');
        setLoading(false);
        return;
      }

      if (!submissionData.grade) {
        setError('Your submission has not been graded yet.');
        setLoading(false);
        return;
      }

      setSubmission(submissionData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load your results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="report-error-state">
        <div className="report-error-icon">🔒</div>
        <h2>Please log in to view your results</h2>
      </div>
    );
  }

  return (
    <div className="lecturer-page-wrapper">
      <DashboardHeader />
      <StudentReportComponent 
        submission={submission}
        exerciseData={exerciseData}
        loading={loading}
        error={error}
        classId={classId}
      />
    </div>
  );
};

export default StudentReportPage;