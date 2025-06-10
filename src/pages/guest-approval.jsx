import React, { useState, useEffect, useRef } from "react";
import { firestore } from "../firebase";
import { collection, doc, updateDoc, onSnapshot, query, orderBy, getDoc, addDoc } from "firebase/firestore";
import "../styles/guest-approval.css";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { logActivity } from '../utils/activityLogger';
import { auth } from '../firebase';

function GuestApproval() {
  const [guestRequests, setGuestRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Add click outside listener
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpenId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Real-time listener for guest requests from 'guestReservations' collection
    const q = query(collection(firestore, "guestReservations"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          guests: data.guests || []
        };
      });
      setGuestRequests(requests);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      setDropdownOpenId(null); // Close dropdown immediately
      const requestRef = doc(firestore, "guestReservations", id);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();
      
      await updateDoc(requestRef, {
        status: status,
        updatedAt: new Date()
      });

      // Log the activity with more specific details
      await logActivity(
        `Guest Reservation Status Updated`,
        `Facility: ${requestData.facility} - Guest: ${requestData.guests[0]?.name} - Status changed from "${requestData.status}" to "${status}"`,
        auth.currentUser?.uid
      );
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const filteredRequests = guestRequests.filter((request) => {
    const term = searchTerm.toLowerCase();
    return (
      request.facility?.toLowerCase().includes(term) ||
      request.guests.some(guest => guest.name.toLowerCase().includes(term)) ||
      request.date?.toLowerCase().includes(term)
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Utility function for future use when implementing new guest request creation
  const addNewGuestRequest = (newRequest) => {
    setGuestRequests(prevRequests => {
      const updatedRequests = [newRequest, ...prevRequests];
      setCurrentPage(1);
      return updatedRequests;
    });
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const toggleDropdown = (id) => {
    setDropdownOpenId(dropdownOpenId === id ? null : id);
  };

  // Helper to format date as MM/DD/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="guest-approval-container">
      <h2>Guest Approval Requests</h2>

      <div className="guest-approval-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by tenant name, guest name, or date..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="guest-approval-list">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>Guest Name</th>
              <th>Visit Date</th>
              <th>Time</th>
              <th>Category</th>
              <th>Contact Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((request) => (
              <tr key={request.id} onClick={() => openModal(request)} style={{ cursor: 'pointer' }}>
                <td>{request.facility}</td>
                <td>{request.guests[0]?.name}</td>
                <td>{request.date ? formatDate(request.date) : ''}</td>
                <td>{request.guests[0]?.time}</td>
                <td>{request.guests[0]?.category}</td>
                <td>{request.guests[0]?.contactNumber}</td>
                <td>
                  <span className={`guest-status ${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                  <button className="guest-dropdown-btn" onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(request.id);
                  }}>
                    Change Status ▼
                  </button>
                  {dropdownOpenId === request.id && (
                    <div className="guest-dropdown-menu" ref={dropdownRef}>
                      {request.status !== "approved" && (
                        <button onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(request.id, "approved");
                        }}>
                          Approve
                        </button>
                      )}
                      {request.status !== "declined" && (
                        <button onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(request.id, "declined");
                        }}>
                          Decline
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination - now directly below the table */}
        <div className="guest-approval-pagination">
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

      {isModalOpen && selectedRequest && (
        <div className="guest-modal-overlay">
          <div className="guest-modal-content">
            <h3>Guest Request Details</h3>
            <div className="guest-detail-row">
              <span className="guest-label">Facility:</span>
              <span>{selectedRequest.facility}</span>
            </div>
            <div className="guest-detail-row">
              <span className="guest-label">Guest Name:</span>
              <span>{selectedRequest.guests[0]?.name}</span>
            </div>
            <div className="guest-detail-row">
              <span className="guest-label">Visit Date:</span>
              <span>{selectedRequest.date ? formatDate(selectedRequest.date) : ''}</span>
            </div>
            <div className="guest-detail-row">
              <span className="guest-label">Time:</span>
              <span>{selectedRequest.guests[0]?.time}</span>
            </div>
            <div className="guest-detail-row">
              <span className="guest-label">Category:</span>
              <span>{selectedRequest.guests[0]?.category}</span>
            </div>
            <div className="guest-detail-row">
              <span className="guest-label">Contact Number:</span>
              <span>{selectedRequest.guests[0]?.contactNumber}</span>
            </div>
            <div className="guest-detail-row">
              <span className="guest-label">Status:</span>
              <span className={`guest-status ${selectedRequest.status.toLowerCase()}`}>
                {selectedRequest.status}
              </span>
            </div>
            <div className="guest-modal-actions">
              <button className="guest-close-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestApproval;
