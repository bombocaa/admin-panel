import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";  // Import Firebase Auth service

const firebaseConfig = {
  apiKey: "AIzaSyD9C5Y5QRI-KjEhx4waCQyEwxI2PpuLuLE",
  authDomain: "t-global-6c6aa.firebaseapp.com",
  projectId: "t-global-6c6aa",
  storageBucket: "t-global-6c6aa.appspot.com",
  messagingSenderId: "144543017618",
  appId: "1:144543017618:web:edf4354696a7758b60d44b",
  measurementId: "G-K9LW4T23E7"
};

// Initialize Firebase
let app;
let analytics;
let firestore;
let auth;

try {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  firestore = getFirestore(app);
  auth = getAuth(app);

  // Enable offline persistence
  enableIndexedDbPersistence(firestore)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      }
    });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Export Firebase services
export { app, firestore, auth, analytics };
