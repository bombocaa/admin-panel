import React, { useState, useEffect } from "react";
import "../styles/inquiries.css"; // Assuming same style as Messages
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { collection, getDocs, addDoc } from "firebase/firestore"; // Import Firestore methods
import { firestore } from "../firebase"; // Import firestore from firebase.js

function Inquiries() {
  const [inquiriesList, setInquiriesList] = useState([]);  // Store inquiries
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch inquiries from Firestore
  useEffect(() => {
    const fetchInquiries = async () => {
      const querySnapshot = await getDocs(collection(firestore, "reservationForm"));
      const inquiries = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        inquiries.push({
          id: doc.id,
          fullName: data.fullName,
          email: data.email,
          phoneNo: data.phoneNo,
          inquiry: data.inquiry,
          message: data.message,
          date: data.date,
          time: data.time
        });
      });
      setInquiriesList(inquiries);
    };

    fetchInquiries();
  }, []);  // Runs only once after the component is mounted

  // Search and filter inquiries (remove sorting)
  const filteredInquiries = inquiriesList.filter((inquiry) => {
    if (!inquiry) return false;
    const searchFields = [
      inquiry.fullName || '',
      inquiry.email || '',
      inquiry.id || '',
      inquiry.phoneNo || '',
      inquiry.inquiry || ''
    ];
    return searchFields.some(field => 
      String(field).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort inquiries by date (newest first)
  const sortedInquiries = [...filteredInquiries].sort((a, b) => {
    const dateA = a.date
      ? (typeof a.date === 'object' && typeof a.date.toDate === 'function'
          ? a.date.toDate().getTime()
          : new Date(a.date).getTime())
      : 0;
    const dateB = b.date
      ? (typeof b.date === 'object' && typeof b.date.toDate === 'function'
          ? b.date.toDate().getTime()
          : new Date(b.date).getTime())
      : 0;
    return dateB - dateA;
  });

  // Remove sorting, use sortedInquiries directly
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedInquiries.length / itemsPerPage);

  const openViewModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
  };

  const openReplyModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setIsReplyModalOpen(false);
    setReplyText("");
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    alert(`Reply sent to ${selectedInquiry.fullName}: ${replyText}`);
    closeReplyModal();
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Utility function for future use when implementing new inquiry creation
  const addNewInquiry = (newInquiry) => {
    setInquiriesList(prevInquiries => {
      const updatedInquiries = [newInquiry, ...prevInquiries];
      setCurrentPage(1); // Reset to first page when new item is added
      return updatedInquiries;
    });
  };

  // Helper to format date as MM/DD/YYYY
  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    let dateObj;
    if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
      dateObj = dateValue.toDate();
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      dateObj = new Date(dateValue);
    } else {
      return '-';
    }
    if (isNaN(dateObj.getTime())) return '-';
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Helper to format time as HH:MM AM/PM
  const formatTime = (timeValue) => {
    if (!timeValue) return '-';
    let dateObj;
    if (typeof timeValue === 'object' && typeof timeValue.toDate === 'function') {
      dateObj = timeValue.toDate();
    } else if (typeof timeValue === 'string' || typeof timeValue === 'number') {
      dateObj = new Date(timeValue);
    } else {
      return '-';
    }
    if (isNaN(dateObj.getTime())) return '-';
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  // Example function to add a new inquiry and send notification
  const handleAddInquiry = async (formData) => {
    // Add inquiry to Firestore (pseudo-code, adapt as needed)
    await addDoc(collection(firestore, "reservationForm"), formData);
  };

  return (
    <div className="inquiries-container">
      <h2 className="inquiries-title">Inquiries</h2>
      {/* Search Bar */}
      <div className="tenant-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by name, email, or ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="inquiries-table-container">
        <table className="inquiries-table">
          <thead>
            <tr>
              {/* <th>ID</th> */}
              <th>Full Name</th>
              <th>Inquiry</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((inquiry) => (
              <tr key={inquiry.id} className="inquiry-row" onClick={() => openViewModal(inquiry)}>
                {/* <td>{inquiry.id}</td> */}
                <td>{inquiry.fullName}</td>
                <td>{inquiry.inquiry}</td>
                <td>{inquiry.email}</td>
                <td>{inquiry.phoneNo}</td>
                <td>{formatDate(inquiry.date)}</td>
                <td>{formatTime(inquiry.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="inquiries-pagination">
          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* View Inquiry Modal */}
      {isViewModalOpen && selectedInquiry && (
        <div className="modal-overlay">
          <div className="modal-content-1">
            <h3>INQUIRER MESSAGE</h3>
            <div className="modal-content-grid">
              <div className="modal-column">
                <div className="info-item"><span className="info-label">ID:</span> <span className="info-value">{selectedInquiry.id}</span></div>
                <div className="info-item"><span className="info-label">Full Name:</span> <span className="info-value">{selectedInquiry.fullName}</span></div>
                <div className="info-item"><span className="info-label">Email:</span> <span className="info-value">{selectedInquiry.email}</span></div>
                <div className="info-item"><span className="info-label">Phone Number:</span> <span className="info-value">{selectedInquiry.phoneNo}</span></div>
              </div>
              <div className="modal-column">
                <div className="info-item"><span className="info-label">Date:</span> <span className="info-value">{formatDate(selectedInquiry.date)}</span></div>
                <div className="info-item"><span className="info-label">Time:</span> <span className="info-value">{formatTime(selectedInquiry.date)}</span></div>
              </div>
            </div>
            <div className="message-section">
              <h4>Message:</h4>
              <div className="message-content">{selectedInquiry.inquiry}</div>
            </div>
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {isReplyModalOpen && selectedInquiry && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reply to {selectedInquiry.fullName}</h3>
            <form onSubmit={handleReplySubmit}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply here..."
                rows="5"
                required
              />
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeReplyModal}>Cancel</button>
                <button type="submit" className="submit-button">Send Reply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inquiries;
