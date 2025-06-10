import React, { useState, useEffect, useRef } from "react";
import { firestore } from "../firebase"; // Import Firestore
import { collection, doc, updateDoc, onSnapshot, getDoc, addDoc } from "firebase/firestore"; // Firestore functions
import "../styles/maintenance.css"; // Import CSS for styling
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { logActivity } from '../utils/activityLogger';
import { auth } from "../firebase";

function Maintenance() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Real-time listener for maintenance requests
    const unsubscribe = onSnapshot(collection(firestore, "maintenanceRequests"), (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        roomNumber: doc.data().roomNo, // Assuming 'roomNo' is the field name in Firestore
        issueType: doc.data().category, // Assuming 'category' is the field name for issue type
        description: doc.data().description,
        date: doc.data().date,
        status: doc.data().status,
        attachmentUrl: doc.data().attachmentUrl || null, // Add attachment if present
      }));
      setMaintenanceRequests(requests);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

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

  // Handle updating the request status to "Completed"
  const handleStatusUpdate = async (id, status) => {
    try {
      setDropdownOpenId(null); // Close dropdown immediately
      const requestRef = doc(firestore, "maintenanceRequests", id);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();
      
      await updateDoc(requestRef, {
        status: status,
      });

      // Log the activity with more specific details
      await logActivity(
        `Maintenance Status Updated`,
        `Room ${requestData.roomNo} - ${requestData.category}: Status changed from "${requestData.status}" to "${status}"`,
        auth.currentUser?.uid
      );
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  // Filter requests by room number or date
  const filteredRequests = maintenanceRequests.filter((request) => {
    const term = searchTerm.toLowerCase();
    return (
      request.roomNumber.toLowerCase().includes(term) ||
      request.date.toLowerCase().includes(term)
    );
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Utility function for future use when implementing new maintenance request creation
  const addNewRequest = (newRequest) => {
    setMaintenanceRequests(prevRequests => {
      const updatedRequests = [newRequest, ...prevRequests];
      setCurrentPage(1); // Reset to first page when new item is added
      return updatedRequests;
    });
  };

  // Modal open/close handlers
  const openModal = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // Dropdown handlers
  const toggleDropdown = (id) => {
    setDropdownOpenId(dropdownOpenId === id ? null : id);
  };

  return (
    <div className="maintenance-container">
      <h2>Maintenance Requests</h2>

      {/* Search Bar */}
      <div className="maintenance-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by room number or date..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="request-list">
        <table>
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Issue Type</th>
              <th>Description</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((request) => (
              <tr key={request.id} onClick={() => openModal(request)} style={{ cursor: 'pointer' }}>
                <td>{request.roomNumber}</td>
                <td>{request.issueType}</td>
                <td>{request.description.length > 30 ? request.description.slice(0, 30) + '...' : request.description}</td>
                <td>{request.date}</td>
                <td>
                  <span className={`status ${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                  <button className="dropdown-action-btn" onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(request.id);
                  }}>
                    Change Status ▼
                  </button>
                  {dropdownOpenId === request.id && (
                    <div className="dropdown-menu" ref={dropdownRef}>
                      {request.status !== "Ongoing" && (
                        <button onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(request.id, "Ongoing");
                        }}>
                          Mark as Ongoing
                        </button>
                      )}
                      {request.status !== "Completed" && (
                        <button onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(request.id, "Completed");
                        }}>
                          Mark as Completed
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
        <div className="maintenance-pagination">
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

      {/* Modal for full message and attachment */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Maintenance Request Details</h3>
            <p><strong>Room Number:</strong> {selectedRequest.roomNumber}</p>
            <p><strong>Issue Type:</strong> {selectedRequest.issueType}</p>
            <p><strong>Date:</strong> {selectedRequest.date}</p>
            <p><strong>Status:</strong> {selectedRequest.status}</p>
            <p><strong>Description:</strong></p>
            <p className="message-content">{selectedRequest.description}</p>
            {selectedRequest.attachmentUrl && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Attachment:</strong>
                <img src={selectedRequest.attachmentUrl} alt="Attachment" style={{ maxWidth: '100%', marginTop: '0.5rem', borderRadius: '8px' }} />
              </div>
            )}
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Maintenance;
