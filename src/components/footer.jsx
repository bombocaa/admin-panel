import React, { useState } from "react";
import { db } from "../firebase";  // Import db from firebase.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";  // Import Firestore methods
import "../styles/footer.css";
import { FaFacebookF, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const Footer = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that all fields are filled
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      // Add inquiry data to Firestore under 'reservationForm' collection
      await addDoc(collection(db, "reservationForm"), {
        fullName: formData.name,
        email: formData.email,
        phoneNo: formData.phone,
        inquiry: formData.message,  // Add the message as an inquiry field
        date: serverTimestamp()     // Add the current server timestamp
      });

      // Clear the form and any error message
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
      setErrorMessage("");
      alert("Your inquiry has been submitted successfully!");
    } catch (error) {
      setErrorMessage("Error submitting your inquiry. Please try again.");
    }
  };

  return (
    <footer className="footer-container">
      <div className="footer-columns">
        {/* Follow Us */}
        <div className="footer-column">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://www.facebook.com/tglobaleliteres" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
          </div>
        </div>

        {/* Contact Us */}
        <div className="footer-column">
          <h4 className="footer-contact-title">Contact Us</h4>
          <div className="footer-contact-item">
            <span className="footer-contact-icon" role="img" aria-label="Phone">
              <FaPhoneAlt style={{ color: "#99BC85" }} />
            </span>
            <span className="footer-contact-link">+63 928 711 3900</span>
          </div>
          <div className="footer-contact-item">
            <span className="footer-contact-icon" role="img" aria-label="Email">
              <FaEnvelope style={{ color: "#99BC85" }} />
            </span>
            <span className="footer-contact-link">t.globaleliteresidences@yahoo.com.ph</span>
          </div>
          <div className="footer-contact-item">
            <span className="footer-contact-icon" role="img" aria-label="Location">
              <FaMapMarkerAlt style={{ color: "#99BC85" }} />
            </span>
            <span className="footer-contact-link">
              720 M.V. Delos Santos St., Sampaloc,<br />
              Manila, Philippines, 1008
            </span>
          </div>
        </div>

        {/* Inquire Now */}
        <div className="footer-column">
          <h4>Inquire Now</h4>
          <form className="footer-inquire-form" onSubmit={handleSubmit}>
            {errorMessage && <p className="error-message">{errorMessage}</p>}  {/* Display error message */}
            <div className="form-group">
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                aria-label="Full Name"
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
                aria-label="Email Address"
              />
            </div>

            <div className="form-group">
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                required
                aria-label="Phone Number"
              />
            </div>

            <div className="form-group">
              <textarea
                id="message"
                name="message"
                rows="3"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleInputChange}
                required
                aria-label="Your Message"
              ></textarea>
            </div>

            <button type="submit" className="submit-btn">
              Send Message
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} T-Global Elite Residences. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 