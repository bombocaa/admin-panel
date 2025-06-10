import React, { useState } from "react";
import "../styles/login.css";
import logoImage from "../assets/login_logo_1.png";
import { auth, firestore } from "../firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth"; 
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { logActivity } from '../utils/activityLogger';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null); 
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    
    setError(null);
    
    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password length (example: must be at least 6 characters)
    if (password.length < 8) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true); // Start loading state
      // Attempt to sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update time_in in Firestore for admin
      const adminsRef = collection(firestore, 'admins');
      const q = query(adminsRef, where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const adminRef = doc(firestore, 'admins', adminDoc.id);
        await setDoc(adminRef, { time_in: new Date() }, { merge: true });
        await logActivity('Time In', `Admin: ${adminDoc.data().full_name || user.email}`, user.uid);
      }

      // If successful, redirect to the dashboard
      navigate("/dashboard"); // Redirect to dashboard.jsx
    } catch (err) {
      // Handle different Firebase Auth errors
      if (err.code === "auth/invalid-email") {
        setError("The email address is not valid.");
      } else if (err.code === "auth/user-not-found") {
        setError("No user found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else {
        setError("Error logging in: " + err.message);
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="login-container">
      <div className="logo-section">
        <img src={logoImage} alt="Logo" className="logo-image" />
      </div>

      <div className="divider"></div>

      <div className="form-section">
        <div className="form-wrapper">
          <h1>WELCOME</h1>
          <h2 className="form-title">Login</h2>
          <form className="form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="login-form-submit-button" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          <p className="form-footer">
            Don't have an account? <a href="/register">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
