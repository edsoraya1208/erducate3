import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get notifications for LECTURER
 * Shows exercises ready to review (after due date + has submissions)
 */
export const getLecturerNotifications = async (lecturerId) => {
  try {
    const now = Timestamp.now();
    const notifications = [];

    // ✅ FIXED: Changed createdById to instructorId
    const classesQuery = query(
      collection(db, 'classes'),
      where('instructorId', '==', lecturerId)  // ✅ Changed from createdById
    );
    const classesSnap = await getDocs(classesQuery);

    // For each class, check exercises
    for (const classDoc of classesSnap.docs) {
      const classId = classDoc.id;
      const className = classDoc.data().title || 'Unnamed Class';

      const exercisesQuery = query(
        collection(db, 'classes', classId, 'exercises'),
        where('dueDate', '<=', now), // Past due date
        where('status', '==', 'active')
      );
      const exercisesSnap = await getDocs(exercisesQuery);

      for (const exerciseDoc of exercisesSnap.docs) {
        const exerciseId = exerciseDoc.id;
        const exerciseData = exerciseDoc.data();

        // Check if there are submissions to review
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('exerciseId', '==', exerciseId),
          where('classId', '==', classId)
        );
        const submissionsSnap = await getDocs(submissionsQuery);

        // Count unpublished submissions
        const unpublishedCount = submissionsSnap.docs.filter(
          doc => doc.data().status !== 'published'
        ).length;

        if (unpublishedCount > 0) {
          notifications.push({
            id: exerciseId,
            type: 'review_ready',
            title: exerciseData.title || 'Untitled Exercise',
            className: className,
            count: unpublishedCount,
            dueDate: exerciseData.dueDate,
            classId: classId,
            exerciseId: exerciseId,
            isRead: false // Default unread
          });
        }
      }
    }

    // Sort by due date (most recent first)
    notifications.sort((a, b) => b.dueDate?.toMillis() - a.dueDate?.toMillis());

    return notifications;
  } catch (error) {
    console.error('Error fetching lecturer notifications:', error);
    return [];
  }
};

/**
 * Get notifications for STUDENT
 * Shows published grades
 */
export const getStudentNotifications = async (studentId) => {
  try {
    const notifications = [];
    const now = Timestamp.now();
    
    // ✅ Only show grades from last 30 days
    const thirtyDaysAgo = Timestamp.fromMillis(
      now.toMillis() - (30 * 24 * 60 * 60 * 1000)
    );

    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('studentId', '==', studentId),
      where('status', '==', 'published'),
      where('gradedAt', '>=', thirtyDaysAgo)  // ✅ Add this filter
    );
    
    const submissionsSnap = await getDocs(submissionsQuery);

    for (const submissionDoc of submissionsSnap.docs) {
      const submissionData = submissionDoc.data();
      
      notifications.push({
        id: submissionDoc.id,
        type: 'grade_published',
        title: submissionData.exerciseTitle || 'Exercise',
        score: submissionData.grade?.totalScore || 0,
        maxScore: submissionData.grade?.maxScore || 0,
        gradedAt: submissionData.gradedAt,
        classId: submissionData.classId,
        exerciseId: submissionData.exerciseId,
        submissionId: submissionDoc.id,
        isRead: false // Default unread
      });
    }

    // Sort by graded date (most recent first)
    notifications.sort((a, b) => b.gradedAt?.toMillis() - a.gradedAt?.toMillis());

    return notifications;
  } catch (error) {
    console.error('Error fetching student notifications:', error);
    return [];
  }
};