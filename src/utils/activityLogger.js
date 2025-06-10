import { firestore } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logActivity = async (action, details, userId = null) => {
  try {
    const activityRef = collection(firestore, 'activityLogs');
    await addDoc(activityRef, {
      action,
      details,
      userId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  const now = new Date();
  const activityTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInSeconds = Math.floor((now - activityTime) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hrs = Math.floor(diffInSeconds / 3600);
    return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  const months = Math.floor(diffInSeconds / 2592000);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}; 