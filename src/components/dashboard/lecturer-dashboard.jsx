// src/components/dashboard/lecturer-dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';import { useAuthState } from 'react-firebase-hooks/auth';
import '../../styles/lecturer-shared-header.css';
import '../../styles/lecturer-dashboard.css';
import { useUser } from '../../contexts/UserContext'; 


const LecturerDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [user, error] = useAuthState(auth);
  const {getUserDisplayName } = useUser();

  // Generate unique class code
  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Load classes from Firebase
  const loadClasses = async () => {
    try {
      setLoading(true);
      const classesRef = collection(db, 'classes');
      //can add a where clause to filter by instructor ID if needed
      // const q = query(classesRef, where("instructorId", "==", currentUserId));
      const querySnapshot = await getDocs(classesRef);
      
      const classesData = [];
      querySnapshot.forEach((doc) => {
        classesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
      alert('Error loading classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Create new class
  const handleCreateClass = async () => {
    const className = prompt('Enter class name (e.g., "Database Principles - CS301-G1"):');
    if (!className || className.trim() === '') return;

    try {
      setCreating(true);
      const classCode = generateClassCode();
      
     const newClass = {
        title: className.trim(),
        classCode: classCode,
        description: "Share this code with students to join your class",
        createdAt: new Date(),
        instructorId: user?.uid || "unknown",
        instructorName: user?.displayName || user?.email || "Unknown Instructor"
      };

      await addDoc(collection(db, 'classes'), newClass);
      
      // Reload classes to show the new one
      await loadClasses();
      
      alert(`Class "${className}" created successfully with code: ${classCode}`);
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Error creating class. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Function to handle copying class code to clipboard
  const handleCopyCode = async (classCode) => {
    try {
      await navigator.clipboard.writeText(classCode);
      alert(`Class code ${classCode} copied to clipboard!`);
      // You can replace alert with a toast notification for better UX
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Error copying code to clipboard');
    }
  };

  // Function to handle class deletion
  const handleDeleteClass = async (classId, className) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${className}"?`);
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'classes', classId));
        // Remove the class from local state
        setClasses(classes.filter(cls => cls.id !== classId));
        alert(`Class "${className}" deleted successfully.`);
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error deleting class. Please try again.');
      }
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      // Add your logout logic here (clear tokens, redirect, etc.)
      console.log('Logging out...');
    }
  };

  return (
    <div className="lecturer-dashboard">
      {/* 🏠 TOP NAVIGATION HEADER - Contains logo and navigation */}
      <header className="dashboard-header">
        <div className="header-left">
          {/* 🎨 LOGO SECTION - ERDucate branding */}
          <div className="logo-container">
            <div className="logo-icon">
              <img 
                src="/logo.svg" 
                alt="ERDucate Logo" 
                className="custom-logo"
              />
            </div>
            {/* Brand name with CSS styling */}
            <span className="brand-name">
              ERDucate
            </span>
          </div>
        </div>
        
        <div className="header-right">
          <nav className="nav-items">
            <span className="nav-item active">Dashboard</span>
            {/* Use actual user name instead of hardcoded */}
            <span className="nav-item">{getUserDisplayName()}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Header Section with Title and Create Button */}
          <div className={`dashboard-header-section ${classes.length === 0 ? 'hidden' : ''}`}>            <h1 className="dashboard-title">Instructor's Dashboard</h1>
            <button 
              className="create-class-btn"
              onClick={handleCreateClass}
              disabled={creating}
            >
              {creating ? 'Creating...' : '+ Create Class'}
            </button>
          </div>
          
          {/* Loading State */}
          {loading ? (
            <div className="loading-container">
              <p>Loading classes...</p>
            </div>
          ) : (
            /* Classes Grid - This is where all class cards are displayed */
            <div className="classes-grid">
              {classes.length === 0 ? (
                <div className="empty-state-container">
                  <div className="empty-state-content">
                    <div className="empty-state-icon">
                      <img src="/empty-class.svg" alt="ERDucate" className="empty-class" />
                    </div>
                    <h2 className="empty-state-title">No Classes Yet</h2>
                    <p className="empty-state-description">
                      You haven't created any classes yet. Start by creating your first class to manage students and exercises.
                    </p>
                    <button 
                      className="create-first-class-btn"
                      onClick={handleCreateClass}
                      disabled={creating}
                    >
                      {creating ? 'Creating...' : 'Create Your First Class'}
                    </button>
                  </div>
                </div>
              ) : (
                classes.map((classItem) => (
                  <div key={classItem.id} className="class-card">
                    {/* Class Header with Title and Delete Button */}
                    <div className="class-header">
                      <h3 className="class-title">{classItem.title}</h3>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteClass(classItem.id, classItem.title)}
                        title="Delete this class"
                      >
                        Delete Class
                      </button>
                    </div>
                    
                    {/* Class Code Section */}
                    <div className="class-code-section">
                      <div className="code-label">Class Code</div>
                      <div className="code-container">
                        {/* The actual class code - students use this to join */}
                        <span className="class-code">{classItem.classCode}</span>
                        {/* Copy button to copy code to clipboard */}
                        <button 
                          className="copy-btn"
                          onClick={() => handleCopyCode(classItem.classCode)}
                          title="Copy class code"
                        >
                          Copy Code
                        </button>
                      </div>
                      {/* Description text below the code */}
                      <p className="class-description">{classItem.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LecturerDashboard;