// src/pages/lecturer/dashboard1.jsx
import React from 'react';
import LecturerDashboard from '../../components/dashboard/lecturer-dashboard';

/**
 * Dashboard1 Page Component
 * 
 * This is the main page component that renders the lecturer dashboard.
 * It serves as a wrapper for the LecturerDashboard component.
 * 
 * In a real application, this page might:
 * - Handle authentication checks
 * - Fetch initial data
 * - Manage loading states
 * - Handle error states
 */
const Dashboard1 = () => {
  return (
    <div className="dashboard-page">
      {/* 
        Main Dashboard Component
        All the dashboard functionality is contained in this component
      */}
      <LecturerDashboard />
    </div>
  );
};

export default Dashboard1;

/**
 * USAGE NOTES:
 * 
 * 1. To use this page in your routing (with React Router):
 *    import Dashboard1 from './pages/lecturer/dashboard1';
 *    <Route path="/lecturer/dashboard" component={Dashboard1} />
 * 
 * 2. To add authentication:
 *    - Add useEffect to check if user is logged in
 *    - Redirect to login if not authenticated
 *    - Show loading spinner while checking auth
 * 
 * 3. To add data fetching:
 *    - Add useState for classes data
 *    - Add useEffect to fetch classes from API
 *    - Pass data as props to LecturerDashboard
 * 
 * 4. To add error handling:
 *    - Add try-catch in data fetching
 *    - Add error state management
 *    - Show error messages to user
 */