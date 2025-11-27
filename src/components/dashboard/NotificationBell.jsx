import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { getLecturerNotifications, getStudentNotifications } from '../../services/notificationService';

const NotificationBell = ({ userType }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [userType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const storageKey = `notifications_${userType}_${userId}`;
      const stored = localStorage.getItem(storageKey);
      const readIds = stored ? JSON.parse(stored) : [];

      let notifs = [];
      if (userType === 'lecturer') {
        notifs = await getLecturerNotifications(userId);
      } else {
        notifs = await getStudentNotifications(userId);
      }

      notifs = notifs.map(n => ({
        ...n,
        isRead: readIds.includes(n.id)
      }));

      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    const userId = auth.currentUser?.uid;
    const storageKey = `notifications_${userType}_${userId}`;
    const stored = localStorage.getItem(storageKey);
    const readIds = stored ? JSON.parse(stored) : [];

    if (!readIds.includes(notificationId)) {
      readIds.push(notificationId);
      localStorage.setItem(storageKey, JSON.stringify(readIds));
    }

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    if (notification.type === 'review_ready') {
      navigate(`/lecturer/class/${notification.classId}/exercise/${notification.exerciseId}/submissions`);
    } else if (notification.type === 'grade_published') {
      navigate(`/student/class/${notification.classId}/exercise/${notification.exerciseId}/results`);
    }

    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        {/* ✅ Minimalist Bell Icon */}
        <svg className="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button 
                className="notification-refresh"
                onClick={loadNotifications}
                disabled={loading}
                aria-label="Refresh notifications"
              >
                <svg className="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                </svg>
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon">
                    {notif.type === 'review_ready' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                  </div>
                  
                  <div className="notification-content">
                    {notif.type === 'review_ready' ? (
                      <>
                        <div className="notification-title">
                          {notif.title} - Ready to Review
                        </div>
                        <div className="notification-subtitle">
                          {notif.count} submission{notif.count > 1 ? 's' : ''} • {notif.className}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="notification-title">
                          {notif.title} - Graded
                        </div>
                        <div className="notification-subtitle">
                          Score: {notif.score}/{notif.maxScore}
                        </div>
                      </>
                    )}
                  </div>
                  
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;