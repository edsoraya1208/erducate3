import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import '../../styles/my-class-lect.css';
import '../../styles/lecturer-shared-header.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';

const LecturerMyClass = () => {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState(location.state?.classData || null);
  const [activeTab, setActiveTab] = useState('exercises');
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const [user] = useAuthState(auth);

  // Helper function to get user display name
 const getUserDisplayName = () => {
  return user?.displayName || user?.email?.split('@')[0] || 'User';
};

  // Fetch class data if not passed via state
  useEffect(() => {
    const fetchClassData = async () => {
      if (!classData && classId) {
        try {
          const classRef = doc(db, 'classes', classId);
          const classSnap = await getDoc(classRef);
          
          if (classSnap.exists()) {
            setClassData({
              id: classSnap.id,
              ...classSnap.data()
            });
          }
        } catch (error) {
          console.error('Error fetching class:', error);
        }
      }
    };

    fetchClassData();
  }, [classId, classData]);

  // Fetch exercises from Firebase
  const fetchExercises = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'exercises'), 
        where('classId', '==', classId)
      );
      const querySnapshot = await getDocs(q);
      const exercisesData = [];
      
      querySnapshot.forEach((doc) => {
        exercisesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students from Firebase
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'enrollments'), 
        where('classId', '==', classId)
      );
      const querySnapshot = await getDocs(q);
      const studentsData = [];
      
      querySnapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'exercises') {
      fetchExercises();
    } else {
      fetchStudents();
    }
  }, [activeTab, classId]);

  // Publish exercise
  const handlePublishExercise = async (exerciseId) => {
    try {
      const exerciseRef = doc(db, 'exercises', exerciseId);
      await updateDoc(exerciseRef, {
        status: 'active',
        publishedAt: new Date()
      });
      fetchExercises();
    } catch (error) {
      console.error('Error publishing exercise:', error);
    }
  };

  // Edit exercise
  const handleEditExercise = (exerciseId) => {
    console.log('Edit exercise:', exerciseId);
    // navigate(`/lecturer/edit-exercise/${exerciseId}`);
  };

  // View submissions
  const handleViewSubmissions = (exerciseId) => {
    console.log('View submissions for:', exerciseId);
    // navigate(`/lecturer/exercise/${exerciseId}/submissions`);
  };

  // Create new exercise
  const handleNewExercise = () => {
    console.log('Create new exercise');
    navigate(`/lecturer/create-exercise?classId=${classId}`);
  };

  const handleDashboardClick = () => {
    navigate('/lecturer/dashboard1');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  // Filter exercises based on search and status
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exercise.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusClasses = {
      'completed': 'status-completed',
      'active': 'status-active',
      'draft': 'status-draft'
    };
    return statusClasses[status] || 'status-draft';
  };

  // Generate initials for student avatars
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  // Shared header component
  const Header = () => (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="logo-container">
          <div className="logo-icon">
            <img 
              src="/logo.svg" 
              alt="ERDucate Logo" 
              className="custom-logo"
            />
          </div>
          <span className="brand-name">
            ERDucate
          </span>
        </div>
      </div>
      
      <div className="header-right">
        <nav className="nav-items">
          <span className="nav-item" onClick={handleDashboardClick}>Dashboard</span>
          <span className="nav-item">{getUserDisplayName()}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );

  if (!classData) {
    return (
      <div className="page-container">
        <Header />
        <main className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading class data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />

      <main className="main-content">
        <div className="lecturer-my-class">
          <div className="class-header">
            <div className="class-info">
              <h1>My Class</h1>
              <p>Overview of class exercises</p>
            </div>
          </div>

          <div className="class-details">
            <h2>{classData.name || 'Database Principles - CS301-G2'}</h2>
            <p className="class-meta">{classData.courseCode || 'CS301'} • {classData.enrolledStudents || 42} students enrolled</p>
          </div>

          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
              onClick={() => setActiveTab('exercises')}
            >
              Exercises
            </button>
            <button 
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              Students
            </button>
          </div>

          {activeTab === 'exercises' && (
            <div className="exercises-content">
              <div className="exercises-controls">
                <div className="search-filter">
                  <input 
                    type="text"
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-filter"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <button 
                  className="new-exercise-btn"
                  onClick={handleNewExercise}
                >
                  + New Exercise
                </button>
              </div>

              <div className="exercise-grid">
                {loading ? (
                  <div className="loading">Loading exercises...</div>
                ) : (
                  filteredExercises.map((exercise) => (
                    <div key={exercise.id} className="exercise-card">
                      <div className="exercise-header">
                        <h3>{exercise.title}</h3>
                        <span className={`status-badge ${getStatusBadge(exercise.status)}`}>
                          {exercise.status?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="exercise-meta">
                        <p>Due: {exercise.dueDate}</p>
                        <p>{exercise.submissions || 0}/{exercise.maxSubmissions || 0} submissions</p>
                        <p>{exercise.marks} marks</p>
                      </div>

                      <div className="exercise-actions">
                        {exercise.status === 'draft' ? (
                          <>
                            <button 
                              className="btn-class-lect btn-publish"
                              onClick={() => handlePublishExercise(exercise.id)}
                            >
                              Publish
                            </button>
                            <button 
                              className="btn btn-edit"
                              onClick={() => handleEditExercise(exercise.id)}
                            >
                              Edit
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-view"
                            onClick={() => handleViewSubmissions(exercise.id)}
                          >
                            View Submission
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="students-content">
              <h3>Enrolled Students</h3>
              <div className="students-list">
                {loading ? (
                  <div className="loading">Loading students...</div>
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="student-item">
                      <div className="student-avatar">
                        {getInitials(student.name)}
                      </div>
                      <div className="student-info">
                        <h4>{student.name}</h4>
                        <p>{student.email}</p>
                      </div>
                      <div className="student-progress">
                        {student.completedExercises || 0}/{exercises.length} exercises completed
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LecturerMyClass;