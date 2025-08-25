import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import '../../styles/my-class-stud.css';

const StudentMyClass = ({ classId }) => {
  const [user] = useAuthState(auth);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 🆕 NEW: Added state for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user, classId]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      if (classId) {
        // Fetch exercises for specific class only
        console.log('=== DEBUGGING STUDENT EXERCISES ===');
        console.log('Current user UID:', user.uid);
        console.log('Fetching exercises for classId:', classId);
        
        // First, verify student is enrolled in this specific class
        const enrollmentQuery = query(
          collection(db, 'studentClasses'),
          where('studentId', '==', user.uid),
          where('classId', '==', classId)
        );
        
        const enrollmentSnapshot = await getDocs(enrollmentQuery);
        console.log('Enrollment check result:', enrollmentSnapshot.size);
        
        if (enrollmentSnapshot.empty) {
          console.log('Student not enrolled in this class');
          setError('You are not enrolled in this class');
          setExercises([]);
          setLoading(false);
          return;
        }
        
        const allExercises = [];
        
        try {
          // Get class info first
          const classDoc = await getDoc(doc(db, 'classes', classId));
          const classData = classDoc.exists() ? classDoc.data() : null;
          console.log('Class data:', classData);
          
          // Store class data in state
          setClassData(classData);
          
          // Get exercises for this class - simple query without orderBy
          const exercisesQuery = query(
            collection(db, 'classes', classId, 'exercises'),
            where('status', '==', 'active')
          );
          
          console.log('Fetching exercises with query...');
          const exercisesSnapshot = await getDocs(exercisesQuery);
          console.log('Found exercises:', exercisesSnapshot.size);
          
          for (const exerciseDoc of exercisesSnapshot.docs) {
            const exerciseData = { 
              id: exerciseDoc.id, 
              classId: classId,
              className: classData?.name || classData?.title || 'Unknown Class',
              ...exerciseDoc.data() 
            };
            
            console.log('Processing exercise:', exerciseData.title);
            
            // Check if student has progress on this exercise
            const progressQuery = query(
              collection(db, 'studentProgress'),
              where('studentId', '==', user.uid),
              where('classId', '==', classId),
              where('exerciseId', '==', exerciseDoc.id)
            );
            
            const progressSnapshot = await getDocs(progressQuery);
            const progress = progressSnapshot.docs[0]?.data();
            
            exerciseData.progress = progress;
            exerciseData.isSubmitted = !!progress;
            exerciseData.isCompleted = progress?.status === 'completed' || progress?.isCompleted;
            exerciseData.isPastDue = exerciseData.dueDate && exerciseData.dueDate.toDate 
              ? new Date() > exerciseData.dueDate.toDate() 
              : false;            
            allExercises.push(exerciseData);
          }
          
          // UPDATED SORTING: Urgent due dates first, then by creation order
          allExercises.sort((a, b) => {
            // Get due dates if they exist
            const dueDateA = a.dueDate?.toDate ? a.dueDate.toDate() : null;
            const dueDateB = b.dueDate?.toDate ? b.dueDate.toDate() : null;
            
            // Both have due dates - most urgent first
            if (dueDateA && dueDateB) {
              return dueDateA - dueDateB;
            }
            
            // Only A has due date - A goes first (urgent)
            if (dueDateA && !dueDateB) return -1;
            
            // Only B has due date - B goes first (urgent)  
            if (!dueDateA && dueDateB) return 1;
            
            // Neither has due date - sort by creation date (oldest first for learning sequence)
            const createdA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const createdB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            
            return createdA - createdB;
          });
          
          console.log('Final exercises data:', allExercises);
          setExercises(allExercises);
          
        } catch (classError) {
          console.error(`Error fetching exercises for class ${classId}:`, classError);
          setError('Error loading exercises for this class');
        }
        
      } else {
        // Fetch exercises for all enrolled classes (original logic)
        const studentClassesQuery = query(
          collection(db, 'studentClasses'),
          where('studentId', '==', user.uid)
        );
        
        const studentClassesSnapshot = await getDocs(studentClassesQuery);
        const enrolledClassIds = studentClassesSnapshot.docs.map(doc => doc.data().classId);
        
        if (enrolledClassIds.length === 0) {
          setExercises([]);
          setLoading(false);
          return;
        }
        
        const allExercises = [];
        
        // For each enrolled class, fetch exercises
        for (const classId of enrolledClassIds) {
          try {
            // Get class info first
            const classDoc = await getDoc(doc(db, 'classes', classId));
            const classData = classDoc.exists() ? classDoc.data() : null;
            
            // Get exercises for this class - only active exercises
            const exercisesQuery = query(
              collection(db, 'classes', classId, 'exercises'),
              where('status', '==', 'active')
            );
            
            const exercisesSnapshot = await getDocs(exercisesQuery);
            
            for (const exerciseDoc of exercisesSnapshot.docs) {
              const exerciseData = { 
                id: exerciseDoc.id, 
                classId: classId,
                className: classData?.name || classData?.title || 'Unknown Class',
                ...exerciseDoc.data() 
              };
              
              // Check if student has progress on this exercise
              const progressQuery = query(
                collection(db, 'studentProgress'),
                where('studentId', '==', user.uid),
                where('classId', '==', classId),
                where('exerciseId', '==', exerciseDoc.id)
              );
              
              const progressSnapshot = await getDocs(progressQuery);
              const progress = progressSnapshot.docs[0]?.data();
              
              exerciseData.progress = progress;
              exerciseData.isSubmitted = !!progress;
              exerciseData.isCompleted = progress?.status === 'completed' || progress?.isCompleted;
              exerciseData.isPastDue = exerciseData.dueDate ? new Date() > exerciseData.dueDate.toDate() : false;
              
              allExercises.push(exerciseData);
            }
          } catch (classError) {
            console.warn(`Error fetching exercises for class ${classId}:`, classError);
          }
        }
        
        // UPDATED SORTING for all classes view too
        allExercises.sort((a, b) => {
          // Get due dates if they exist
          const dueDateA = a.dueDate?.toDate ? a.dueDate.toDate() : null;
          const dueDateB = b.dueDate?.toDate ? b.dueDate.toDate() : null;
          
          // Both have due dates - most urgent first
          if (dueDateA && dueDateB) {
            return dueDateA - dueDateB;
          }
          
          // Only A has due date - A goes first (urgent)
          if (dueDateA && !dueDateB) return -1;
          
          // Only B has due date - B goes first (urgent)  
          if (!dueDateA && dueDateB) return 1;
          
          // Neither has due date - sort by creation date (oldest first for learning sequence)
          const createdA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const createdB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          
          return createdA - createdB;
        });
        
        setExercises(allExercises);
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NEW: Filter exercises based on search term and status (simplified to 2 states)
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        matchesStatus = exercise.isCompleted;
      } else if (statusFilter === 'not-started') {
        matchesStatus = !exercise.isCompleted; // Simplified: either completed or not
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (exercise) => {
    if (exercise.isCompleted) {
      return { text: 'COMPLETED', class: 'stud-mc-status-graded' };
    } else {
      return { text: 'NOT STARTED', class: 'stud-mc-status-not-submitted' };
    }
  };

  const getActionButton = (exercise) => {
    if (exercise.isCompleted && exercise.isPastDue) {
      return {
        text: 'View Results',
        class: 'stud-mc-btn-feedback',
        action: () => handleViewResults(exercise.classId, exercise.id)
      };
    } else if (exercise.isSubmitted && !exercise.isCompleted) {
      return {
        text: 'Continue Exercise',
        class: 'stud-mc-btn-edit',
        action: () => handleContinueExercise(exercise.classId, exercise.id)
      };
    } else {
      return {
        text: 'Start Exercise',
        class: 'stud-mc-btn-start',
        action: () => handleStartExercise(exercise.classId, exercise.id)
      };
    }
  };

  const handleStartExercise = (classId, exerciseId) => {
    // Navigate to exercise attempt page
    window.location.href = `/student/class/${classId}/submit-exercise/${exerciseId}`;
  };

  const handleContinueExercise = (classId, exerciseId) => {
    // Navigate to continue exercise page
    window.location.href = `/student/class/${classId}/exercise/${exerciseId}`;
  };

  const handleViewResults = (classId, exerciseId) => {
    // Navigate to results page
    window.location.href = `/student/class/${classId}/exercise/${exerciseId}/results`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No due date';
    
    // Handle both Firestore Timestamp and regular Date objects
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      // If it's a string, try to parse it
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getScore = (exercise) => {
    if (exercise.progress && exercise.progress.score !== undefined) {
      return `${exercise.progress.score}/${exercise.totalMarks || 100}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="stud-mc-container">
        <div className="stud-mc-loading">Loading exercises...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stud-mc-container">
        <div className="stud-mc-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="stud-mc-container">
      <div className="stud-mc-header">
        <h1 className="stud-mc-title">My Exercises</h1>
        <p className="stud-mc-subtitle">View available exercises and submit your answers</p>
      </div>

  
      <div className="stud-mc-section">
        <div className="stud-mc-section-header">
          <h2 className="stud-mc-section-title">
            {!classId && !classData ? 'Available Exercises' : classData?.name || classData?.title || 'Available Exercises'}
          </h2>
          {classId && classData && (
            <p className="stud-mc-class-meta-inline">
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} available
            </p>
          )}
          <div className="stud-mc-controls">
            <div className="stud-mc-search-filter">
              <input 
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="stud-mc-search-input"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="stud-mc-status-filter"
              >
                <option value="all">All Status</option>
                <option value="not-started">Not Started</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        
        {filteredExercises.length === 0 ? (
          <div className="stud-mc-empty-state">
            {exercises.length === 0 ? (
              <div className="stud-mc-empty-content">
                <div className="stud-mc-empty-icon">📝</div>
                <h3>No exercises available</h3>
                <p>No exercises available{classId ? ' for this class' : '. Make sure you\'re enrolled in a class'}.</p>
              </div>
            ) : (
              <div className="stud-mc-empty-content">
                <div className="stud-mc-empty-icon">🔍</div>
                <h3>No exercises found</h3>
                <p>No exercises match your current search and filter criteria. Try adjusting your search term or filter.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="stud-mc-exercises-grid">
            {filteredExercises.map((exercise) => {
              const status = getStatusBadge(exercise);
              const actionButton = getActionButton(exercise);
              const score = getScore(exercise);

              return (
                <div key={`${exercise.classId}-${exercise.id}`} className="stud-mc-exercise-card">
                  <div className="stud-mc-card-header">
                    <div>
                      <h3 className="stud-mc-exercise-title">{exercise.title}</h3>
                      {!classId && <p className="stud-mc-class-name">{exercise.className}</p>}
                    </div>
                    <span className={`stud-mc-status-badge ${status.class}`}>
                      {status.text}
                    </span>
                  </div>
                  
                  <div className="stud-mc-card-content">
                    <div className="stud-mc-exercise-info">
                      <p className="stud-mc-due-date">
                        Due: {formatDate(exercise.dueDate)} • {exercise.totalMarks || 100} marks
                      </p>
                      {score && (
                        <p className="stud-mc-grade">Score: {score}</p>
                      )}
                    </div>
                    
                    <div className="stud-mc-card-actions">
                      <button 
                        className={`stud-mc-action-btn ${actionButton.class}`}
                        onClick={actionButton.action}
                      >
                        {actionButton.text}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMyClass;