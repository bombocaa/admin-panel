import React, { useState } from "react";
import "../styles/register.css";
import logoImage from "../assets/login_logo_1.png";
import { firestore, auth } from "../firebase";  // Correct import, just use auth
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

// Register component
export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add user data to Firestore in "admins" collection
      await addDoc(collection(firestore, "admins"), {
        full_name: fullName,
        email: email,
        created_at: new Date(),
        user_id: user.uid,  // Unique user ID from Firebase Authentication
      });

      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.log(err);  // Add logging for debugging
      setError("Error creating account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="logo-section">
        <img src={logoImage} alt="Logo" className="logo-image" />
      </div>

      <div className="divider"></div>

      <div className="form-section">
        <div className="form-wrapper">
          <h1>WELCOME</h1>
          <h2 className="form-title">Register as Admin</h2>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="register-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="register-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="register-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              className="register-form-submit-button"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
          {error && <p className="error">{error}</p>}
          <p className="form-footer">
            Already have an account? <a href="/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
