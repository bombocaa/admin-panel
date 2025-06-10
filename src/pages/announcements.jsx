import React, { useState, useEffect } from "react";
import { firestore } from "../firebase"; // Import Firestore DB from Firebase configuration
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import "../styles/announcement.css";
import { FaSearch } from "react-icons/fa";

function Announcement() {
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch the announcements from Firestore when the component mounts
    const fetchAnnouncements = async () => {
      try {
        const q = query(collection(firestore, "announcements"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedAnnouncements = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAnnouncements(fetchedAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements: ", error);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement({ ...newAnnouncement, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Input/Data Validation
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    if (newAnnouncement.title.trim().length < 5) {
      setFormError("Title must be at least 5 characters long.");
      return;
    }
    if (newAnnouncement.message.trim().length < 10) {
      setFormError("Message must be at least 10 characters long.");
      return;
    }
    setFormError(""); // Clear error if validation passes
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString();

    try {
      // Add the new announcement to Firestore
      const docRef = await addDoc(collection(firestore, "announcements"), {
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        date: formattedDate,
        time: formattedTime,
      });

      setAnnouncements([
        ...announcements,
        {
          id: docRef.id,
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          date: formattedDate,
          time: formattedTime,
        },
      ]);

      // Close the form and reset the fields
      setIsFormOpen(false);
      setNewAnnouncement({ title: "", message: "" });
    } catch (error) {
      console.error("Error adding new announcement: ", error);
    }
  };

  const closeModal = () => {
    setIsFormOpen(false);
  };

  // Filter announcements based on search term
  const filteredAnnouncements = announcements.filter((announcement) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      announcement.title.toLowerCase().includes(searchLower) ||
      announcement.message.toLowerCase().includes(searchLower)
    );
  });

  // Helper to format date as MM/DD/YYYY
  function formatDate(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // Helper to extract date and time from Firestore Timestamp or string
  function getDateAndTime(ts) {
    if (!ts) return { date: '', time: '' };
    if (typeof ts === 'string') {
      const d = new Date(ts);
      if (!isNaN(d)) {
        return {
          date: formatDate(ts),
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return { date: ts, time: '' };
    }
    if (typeof ts === 'object' && ts.seconds) {
      const d = new Date(ts.seconds * 1000);
      return {
        date: formatDate(d),
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return { date: '', time: '' };
  }

  return (
    <div className="announcement-container">
      <h2>Announcements</h2>
      
      <div className="announcement-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search announcements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <button className="add-announcement-button" onClick={() => setIsFormOpen(true)}>
        + Add New Announcement
      </button>

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="announcement-form-container">
            <h3>Submit New Announcement</h3>
            <form onSubmit={handleSubmit}>
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={newAnnouncement.title}
                onChange={handleInputChange}
                required
              />

              <label>Message:</label>
              <textarea
                name="message"
                value={newAnnouncement.message}
                onChange={handleInputChange}
                required
              ></textarea>

              {/* Show error message if validation fails */}
              {formError && <div style={{ color: 'red', marginBottom: '10px' }}>{formError}</div>}

              <button type="submit">Submit Announcement</button>
              <button type="button" className="cancel-button" onClick={closeModal}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="announcement-list">
        {filteredAnnouncements.map((announcement) => {
          const { date, time } = getDateAndTime(announcement.date);
          return (
            <div className="announcement-item" key={announcement.id}>
              <h3>{announcement.title}</h3>
              <p>{announcement.message}</p>
              <div className="announcement-meta">
                <span className="announcement-date">{date}</span>
                <span className="announcement-time">{time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Announcement;
