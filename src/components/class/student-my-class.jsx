import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import '../../styles/my-class-stud.css';

const StudentMyClass = ({ classId }) => {
  const [user] = useAuthState(auth);
  const [exercises, setExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // FIXED: Initialize with proper class data immediately
  const [classData, setClassData] = useState(() => {
    if (classId) {
      return { 
        name: 'My Exercises', // Default name immediately, no "Loading..."
        id: classId
      };
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user, classId]);

  const fetchExercises = async () => {
    try {
      setExercisesLoading(true);
      setError('');
      
      if (classId) {
        console.log('=== FETCHING EXERCISES FOR CLASS ===');
        console.log('User:', user.uid, 'Class:', classId);
        
        // Run enrollment check and class data fetch in parallel
        const [enrollmentSnapshot, classDoc] = await Promise.all([
          getDocs(query(
            collection(db, 'studentClasses'),
            where('studentId', '==', user.uid),
            where('classId', '==', classId)
          )),
          getDoc(doc(db, 'classes', classId))
        ]);
        
        if (enrollmentSnapshot.empty) {
          setError('You are not enrolled in this class');
          setExercises([]);
          setExercisesLoading(false);
          return;
        }
        
        // FIXED: Only update class data if we got real data from DB
        const classDataFromDb = classDoc.exists() ? classDoc.data() : null;
        if (classDataFromDb) {
          setClassData({
            ...classDataFromDb,
            id: classId
          });
        }
        
        // Get exercises and all progress in parallel
        const [exercisesSnapshot, allProgressSnapshot] = await Promise.all([
          getDocs(query(
            collection(db, 'classes', classId, 'exercises'),
            where('status', '==', 'active')
          )),
          // Get ALL progress for this student+class at once
          getDocs(query(
            collection(db, 'studentProgress'),
            where('studentId', '==', user.uid),
            where('classId', '==', classId)
          ))
        ]);
        
        console.log('Progress documents found:', allProgressSnapshot.docs.length);
        
        // Create a map of progress for quick lookup
        const progressMap = {};
        allProgressSnapshot.docs.forEach(doc => {
          const progressData = doc.data();
          console.log('Progress data:', progressData);
          progressMap[progressData.exerciseId] = progressData;
        });
        
        const allExercises = [];
        
        exercisesSnapshot.docs.forEach(exerciseDoc => {
          const exerciseData = { 
            id: exerciseDoc.id, 
            classId: classId,
            className: classDataFromDb?.name || classDataFromDb?.title || 'Unknown Class',
            ...exerciseDoc.data() 
          };
          
          // Use progress map instead of individual queries
          const progress = progressMap[exerciseDoc.id];
          console.log(`Exercise ${exerciseDoc.id} progress:`, progress);
          
          exerciseData.progress = progress;
          exerciseData.isSubmitted = !!progress;
          
          // FIXED: More comprehensive completion detection
          exerciseData.isCompleted = !!(progress && (
            progress.status === 'completed' || 
            progress.isCompleted === true ||
            progress.submitted === true ||
            progress.fileUrl ||
            progress.submittedAt ||
            (progress.score !== undefined && progress.score !== null)
          ));
          
          console.log(`Exercise ${exerciseDoc.id} - isSubmitted: ${exerciseData.isSubmitted}, isCompleted: ${exerciseData.isCompleted}`);
          
          exerciseData.isPastDue = exerciseData.dueDate && exerciseData.dueDate.toDate 
            ? new Date() > exerciseData.dueDate.toDate() 
            : false;            
          allExercises.push(exerciseData);
        });
        
        // Sort exercises
        allExercises.sort((a, b) => {
          const dueDateA = a.dueDate?.toDate ? a.dueDate.toDate() : null;
          const dueDateB = b.dueDate?.toDate ? b.dueDate.toDate() : null;
          
          if (dueDateA && dueDateB) {
            return dueDateA - dueDateB;
          }
          
          if (dueDateA && !dueDateB) return -1;
          if (!dueDateA && dueDateB) return 1;
          
          const createdA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const createdB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          
          return createdA - createdB;
        });
        
        console.log('✅ Exercises loaded:', allExercises.length);
        setExercises(allExercises);
        
      } else {
        // For all classes view
        const studentClassesSnapshot = await getDocs(query(
          collection(db, 'studentClasses'),
          where('studentId', '==', user.uid)
        ));
        
        const enrolledClassIds = studentClassesSnapshot.docs.map(doc => doc.data().classId);
        
        if (enrolledClassIds.length === 0) {
          setExercises([]);
          setExercisesLoading(false);
          return;
        }
        
        // Get all progress for all classes at once
        const allProgressSnapshot = await getDocs(query(
          collection(db, 'studentProgress'),
          where('studentId', '==', user.uid)
        ));
        
        const progressMap = {};
        allProgressSnapshot.docs.forEach(doc => {
          const progressData = doc.data();
          const key = `${progressData.classId}_${progressData.exerciseId}`;
          progressMap[key] = progressData;
        });
        
        const allExercises = [];
        
        // Process each class in parallel
        const classPromises = enrolledClassIds.map(async (classId) => {
          try {
            const [classDoc, exercisesSnapshot] = await Promise.all([
              getDoc(doc(db, 'classes', classId)),
              getDocs(query(
                collection(db, 'classes', classId, 'exercises'),
                where('status', '==', 'active')
              ))
            ]);
            
            const classData = classDoc.exists() ? classDoc.data() : null;
            
            return exercisesSnapshot.docs.map(exerciseDoc => {
              const exerciseData = { 
                id: exerciseDoc.id, 
                classId: classId,
                className: classData?.name || classData?.title || 'Unknown Class',
                ...exerciseDoc.data() 
              };
              
              const progress = progressMap[`${classId}_${exerciseDoc.id}`];
              
              exerciseData.progress = progress;
              exerciseData.isSubmitted = !!progress;
              
              // Same comprehensive completion detection
              exerciseData.isCompleted = !!(progress && (
                progress.status === 'completed' || 
                progress.isCompleted === true ||
                progress.submitted === true ||
                progress.fileUrl ||
                progress.submittedAt ||
                (progress.score !== undefined && progress.score !== null)
              ));
              
              exerciseData.isPastDue = exerciseData.dueDate ? new Date() > exerciseData.dueDate.toDate() : false;
              
              return exerciseData;
            });
          } catch (classError) {
            console.warn(`Error fetching exercises for class ${classId}:`, classError);
            return [];
          }
        });
        
        const classResults = await Promise.all(classPromises);
        const flatExercises = classResults.flat();
        
        // Sort all exercises
        flatExercises.sort((a, b) => {
          const dueDateA = a.dueDate?.toDate ? a.dueDate.toDate() : null;
          const dueDateB = b.dueDate?.toDate ? b.dueDate.toDate() : null;
          
          if (dueDateA && dueDateB) {
            return dueDateA - dueDateB;
          }
          
          if (dueDateA && !dueDateB) return -1;
          if (!dueDateA && dueDateB) return 1;
          
          const createdA = a.createdAt?.toDate ? a.createdA.toDate() : new Date(0);
          const createdB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          
          return createdA - createdB;
        });
        
        setExercises(flatExercises);
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to load exercises');
    } finally {
      setExercisesLoading(false);
    }
  };

  // Filter exercises based on search term and status
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        matchesStatus = exercise.isCompleted;
      } else if (statusFilter === 'not-started') {
        matchesStatus = !exercise.isCompleted;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (exercise) => {
    // FIXED: Better status detection
    if (exercise.isCompleted || exercise.isSubmitted) {
      return { text: 'COMPLETED', class: 'stud-mc-status-graded' };
    } else {
      return { text: 'NOT STARTED', class: 'stud-mc-status-not-submitted' };
    }
  };

  const getActionButton = (exercise) => {
    // FIXED: Better button state logic
    if (exercise.isCompleted || exercise.isSubmitted) {
      return {
        text: 'View Results',
        class: 'stud-mc-btn-feedback',
        action: () => handleViewResults(exercise.classId, exercise.id)
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
    window.location.href = `/student/class/${classId}/submit-exercise/${exerciseId}`;
  };

  const handleContinueExercise = (classId, exerciseId) => {
    window.location.href = `/student/class/${classId}/exercise/${exerciseId}`;
  };

  const handleViewResults = (classId, exerciseId) => {
    window.location.href = `/student/class/${classId}/exercise/${exerciseId}/results`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No due date';
    
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

  // FIXED: No more "Loading..." flicker
  const getSectionTitle = () => {
    if (!classId) {
      return 'Available Exercises';
    }
    
    // Use the real class name if available, otherwise use the default
    return classData?.name || classData?.title || 'My Exercises';
  };

  if (error) {
    return (
      <div className="stud-mc-container">
        <div className="stud-mc-header">
          <h1 className="stud-mc-title">My Exercises</h1>
          <p className="stud-mc-subtitle">View available exercises and submit your answers</p>
        </div>
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
            {getSectionTitle()}
          </h2>
          {/* FIXED: Always show the exercise count, starts with 0 then updates */}
          <p className="stud-mc-class-meta-inline">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} available
          </p>
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
        
        {exercisesLoading ? (
          <div className="stud-mc-exercises-grid">
            <div className="stud-mc-loading" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              fontSize: '16px',
              color: '#666'
            }}>
              Loading exercises...
            </div>
          </div>
        ) : filteredExercises.length === 0 ? (
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