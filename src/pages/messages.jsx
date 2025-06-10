import React, { useState } from "react";
import "../styles/messages.css";
import {FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const messagesData = [
  {
    id: 1,
    name: "Alice Johnson",
    subject: "Rental Extension",
    date: "April 5, 2025",
    message: "I would like to request an extension for my rental agreement for another 6 months. Please advise.",
    roomNumber: "101"
  },
  {
    id: 2,
    name: "Carlos Santos",
    subject: "Parking Space",
    date: "April 4, 2025",
    message: "Is there an available parking space I can rent for my car? I would like to reserve one if possible.",
    roomNumber: "102"
  },
  {
    id: 3,
    name: "Emily Tan",
    subject: "Visitor Policy",
    date: "April 3, 2025",
    message: "Can you clarify the visitor policy for tenants? I plan to have my family visit me next month.",
    roomNumber: "103"
  },
];

function Messages() {
  const [messages, setMessages] = useState(messagesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Search and filter messages (remove sorting)
  const filteredMessages = messages.filter((message) => {
    const term = searchTerm.toLowerCase();
    return (
      message.name.toLowerCase().includes(term) ||
      message.roomNumber.toLowerCase().includes(term)
    );
  });

  // Remove sorting, use filteredMessages directly
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMessages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);

  const openViewModal = (message) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Utility function for future use when implementing new message creation
  const addNewMessage = (newMessage) => {
    setMessages(prevMessages => {
      const updatedMessages = [newMessage, ...prevMessages];
      setCurrentPage(1); // Reset to first page when new item is added
      return updatedMessages;
    });
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
    <div className="messages-container">
      <h2 className="messages-title">Messages</h2>
      {/* Search Bar */}
      <div className="tenant-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by name or room number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="messages-table">
        <table>
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Name</th>
              <th>Subject</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((message) => (
              <tr
                key={message.id}
                className="clickable-row"
                onClick={() => openViewModal(message)}
              >
                <td>{message.roomNumber}</td>
                <td>{message.name}</td>
                <td>{message.subject}</td>
                <td>{formatDate(message.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="messages-pagination">
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

      {/* View Message Modal */}
      {isViewModalOpen && selectedMessage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{selectedMessage.subject}</h3>
            <p><strong>Room Number:</strong> {selectedMessage.roomNumber}</p>
            <p><strong>From:</strong> {selectedMessage.name}</p>
            <p><strong>Date:</strong> {formatDate(selectedMessage.date)}</p>
            <p className="message-content">{selectedMessage.message}</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
