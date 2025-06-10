import React, { useState, useEffect } from "react";
import "../styles/payment.css";
import { FaSearch, FaChevronLeft, FaChevronRight, FaPlus, FaEye, FaCheck, FaTimes } from "react-icons/fa";
import { firestore } from "../firebase"; // Import Firestore
import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy, getDoc } from "firebase/firestore"; // Firestore functions
import { logActivity } from '../utils/activityLogger';
import { auth } from '../firebase';

// Generate rooms for 3rd to 12th and 14th to 15th floor, 12 rooms per floor
const rooms = [];
for (let floor = 3; floor <= 12; floor++) {
  for (let num = 1; num <= 12; num++) {
    const roomNum = `${floor}${num.toString().padStart(2, '0')}`;
    rooms.push({ id: roomNum, name: `Room ${roomNum}` });
  }
}
for (let floor = 14; floor <= 15; floor++) {
  for (let num = 1; num <= 12; num++) {
    const roomNum = `${floor}${num.toString().padStart(2, '0')}`;
    rooms.push({ id: roomNum, name: `Room ${roomNum}` });
  }
}

function Payment() {
  const [payments, setPayments] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isViewProofOpen, setIsViewProofOpen] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState("");
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [verificationAction, setVerificationAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPayment, setNewPayment] = useState({
    tenant: "",
    roomNo: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    prevReading: "",
    currReading: "",
    rate: "10",
    dueDate: new Date().toISOString().split('T')[0],
  });
  const itemsPerPage = 7;

  // Load payments from Firestore on component mount
  useEffect(() => {
    const paymentsCollection = collection(firestore, "payments");
    const q = query(paymentsCollection, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);
    }, (error) => {
      console.error("Error fetching payments:", error);
    });

    return () => unsubscribe();
  }, []);

  // Search and filter payments
  const filteredPayments = payments.filter((payment) => {
    const term = searchTerm.toLowerCase();
    return (
      payment.tenant.toLowerCase().includes(term) ||
      payment.roomNo.toLowerCase().includes(term)
    );
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const handleMarkAsPaid = (paymentId) => {
    setSelectedPayment(paymentId);
    setIsConfirmOpen(true); 
  };

  const handleConfirmPayment = async () => {
    try {
      const paymentRef = doc(firestore, "payments", selectedPayment);
      const paymentDoc = await getDoc(paymentRef);
      const paymentData = paymentDoc.data();
      
      await updateDoc(paymentRef, {
        status: "Paid",
        paidAt: new Date().toISOString(),
        verification_status: "Verified"
      });

      // Log the activity
      await logActivity(
        `Payment marked as paid`,
        `Payment ID: ${selectedPayment} - Amount: ${paymentData.amount} - Room: ${paymentData.roomNo}`,
        auth.currentUser?.uid
      );

      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Error updating payment. Please try again.");
    }
  };

  const handleCancelPayment = () => {
    setIsConfirmOpen(false); 
  };

  const handleViewProof = (proofUrl) => {
    setSelectedProofUrl(proofUrl);
    setIsViewProofOpen(true);
  };

  const handleVerifyPayment = (paymentId, action) => {
    setSelectedPayment(paymentId);
    setVerificationAction(action);
    setIsVerifyOpen(true);
  };

  const handleConfirmVerification = async () => {
    try {
      const paymentRef = doc(firestore, "payments", selectedPayment);
      const paymentDoc = await getDoc(paymentRef);
      const paymentData = paymentDoc.data();
      
      const updateData = {
        verification_status: verificationAction === "approve" ? "Verified" : "Rejected",
        verifiedAt: new Date().toISOString()
      };

      if (verificationAction === "approve") {
        updateData.status = "Paid";
      }

      await updateDoc(paymentRef, updateData);

      // Log the activity
      await logActivity(
        `Payment verification ${verificationAction === "approve" ? "approved" : "rejected"}`,
        `Payment ID: ${selectedPayment} - Amount: ${paymentData.amount} - Room: ${paymentData.roomNo}`,
        auth.currentUser?.uid
      );

      setIsVerifyOpen(false);
      setSelectedPayment(null);
      setVerificationAction("");
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert("Error verifying payment. Please try again.");
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const consumption = newPayment.prevReading && newPayment.currReading
    ? Math.max(Number(newPayment.currReading) - Number(newPayment.prevReading), 0)
    : 0;

  const handleAddPayment = async () => {
    if (!newPayment.tenant || !newPayment.roomNo || !newPayment.prevReading || !newPayment.currReading || !newPayment.rate || !newPayment.amount) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    try {
      const currentTime = new Date();
      const payment = {
        tenant: newPayment.tenant,
        roomNo: newPayment.roomNo,
        amount: Number(newPayment.amount).toFixed(2),
        prevReading: Number(newPayment.prevReading),
        currReading: Number(newPayment.currReading),
        consumption: consumption,
        rate: Number(newPayment.rate),
        date: newPayment.date,
        dueDate: newPayment.dueDate,
        time: currentTime.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: "Pending",
        verification_status: "Manual Entry",
        createdAt: currentTime.toISOString()
      };

      await addDoc(collection(firestore, "payments"), payment);
      
      // Reset form
      setNewPayment({
        tenant: "",
        roomNo: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        prevReading: "",
        currReading: "",
        rate: "10",
        dueDate: new Date().toISOString().split('T')[0],
      });
      setIsAddPaymentOpen(false);
      alert("Payment added successfully!");
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Error adding payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status, verificationStatus) => {
    if (status === "Paid" && verificationStatus === "Verified") return "paid";
    if (verificationStatus === "Pending Verification") return "pending-verification";
    if (verificationStatus === "Rejected") return "rejected";
    return status.toLowerCase();
  };

  const getStatusText = (status, verificationStatus) => {
    if (verificationStatus === "Pending Verification") return "Pending Verification";
    if (verificationStatus === "Rejected") return "Rejected";
    if (verificationStatus === "Verified" && status === "Paid") return "Verified & Paid";
    return status;
  };

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h2>Payments Management</h2>
        <button className="add-payment-btn" onClick={() => setIsAddPaymentOpen(true)}>
          <FaPlus /> Add New Payment
        </button>
      </div>
      <div className="payment-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by tenant or room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="payment-table-wrapper">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Room</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Proof</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  No payments found
                </td>
              </tr>
            ) : (
              currentItems.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.tenant}</td>
                  <td>{payment.roomNo}</td>
                  <td>₱{payment.amount}</td>
                  <td>{payment.date}</td>
                  <td>{payment.time || "-"}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(payment.status, payment.verification_status)}`}>
                      {getStatusText(payment.status, payment.verification_status)}
                    </span>
                  </td>
                  <td>
                    {payment.proof_url ? (
                      <button
                        className="view-proof-btn"
                        onClick={() => handleViewProof(payment.proof_url)}
                        title="View Payment Proof"
                      >
                        <FaEye />
                      </button>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>No Proof</span>
                    )}
                  </td>
                  <td>
                    {payment.verification_status === "Pending Verification" ? (
                      <div className="verification-actions">
                        <button
                          className="verify-approve-btn"
                          onClick={() => handleVerifyPayment(payment.id, "approve")}
                          title="Approve Payment"
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="verify-reject-btn"
                          onClick={() => handleVerifyPayment(payment.id, "reject")}
                          title="Reject Payment"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (payment.status === "Pending" || payment.status === "Overdue") && !payment.proof_url ? (
                      <button
                        className="mark-paid-button"
                        onClick={() => handleMarkAsPaid(payment.id)}
                      >
                        Mark as Paid
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="payment-pagination">
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

      {/* Add Payment Modal */}
      {isAddPaymentOpen && (
        <div className="modal-overlay">
          <div className="add-payment-container">
            <h3>Add New Payment</h3>
            <div className="form-group">
              <label>Tenant Name</label>
              <input
                type="text"
                value={newPayment.tenant}
                onChange={(e) => setNewPayment({ ...newPayment, tenant: e.target.value })}
                placeholder="Enter tenant name"
              />
            </div>
            <div className="form-group">
              <label>Room</label>
              <select
                value={newPayment.roomNo}
                onChange={(e) => setNewPayment({ ...newPayment, roomNo: e.target.value })}
              >
                <option value="">Select a room</option>
                {rooms.map((roomNo) => (
                  <option key={roomNo.id} value={roomNo.id}>
                    {roomNo.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Previous Reading</label>
              <input
                type="number"
                min="0"
                value={newPayment.prevReading}
                onChange={e => setNewPayment({ ...newPayment, prevReading: e.target.value })}
                placeholder="Enter previous reading"
              />
            </div>
            <div className="form-group">
              <label>Current Reading</label>
              <input
                type="number"
                min="0"
                value={newPayment.currReading}
                onChange={e => setNewPayment({ ...newPayment, currReading: e.target.value })}
                placeholder="Enter current reading"
              />
            </div>
            <div className="form-group">
              <label>Rate per m³</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPayment.rate}
                onChange={e => setNewPayment({ ...newPayment, rate: e.target.value })}
                placeholder="Enter rate per m³"
              />
            </div>
            <div className="form-group">
              <label>Amount (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPayment.amount}
                onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="Enter amount"
                required
              />
            </div>
            {consumption > 0 && (
              <div className="form-group">
                <label style={{ color: '#666', fontSize: '14px' }}>
                  Consumption: {consumption} m³ (for reference)
                </label>
              </div>
            )}
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={newPayment.dueDate}
                onChange={e => setNewPayment({ ...newPayment, dueDate: e.target.value })}
              />
            </div>
            <div className="modal-buttons">
              <button 
                className="confirm-button" 
                onClick={handleAddPayment}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Payment"}
              </button>
              <button 
                className="cancel-button" 
                onClick={() => setIsAddPaymentOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Proof Modal */}
      {isViewProofOpen && (
        <div className="modal-overlay" onClick={() => setIsViewProofOpen(false)}>
          <div className="proof-modal" onClick={(e) => e.stopPropagation()}>
            <div className="proof-header">
              <h3>Payment Proof</h3>
              <button 
                className="close-proof-btn"
                onClick={() => setIsViewProofOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="proof-content">
              <img 
                src={selectedProofUrl} 
                alt="Payment Proof" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh', 
                  objectFit: 'contain' 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Verification Confirmation Modal */}
      {isVerifyOpen && (
        <div className="modal-overlay">
          <div className="confirm-payment-container">
            <h3>{verificationAction === "approve" ? "Approve Payment" : "Reject Payment"}</h3>
            <p>
              Are you sure you want to {verificationAction === "approve" ? "approve" : "reject"} this payment?
              {verificationAction === "approve" && " This will mark the payment as verified and paid."}
            </p>
            <div className="modal-buttons">
              <button 
                className={verificationAction === "approve" ? "confirm-button" : "reject-button"}
                onClick={handleConfirmVerification}
              >
                {verificationAction === "approve" ? "Approve" : "Reject"}
              </button>
              <button 
                className="cancel-button" 
                onClick={() => {
                  setIsVerifyOpen(false);
                  setSelectedPayment(null);
                  setVerificationAction("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {isConfirmOpen && (
        <div className="payment-confirm-overlay">
          <div className="payment-confirm-container">
            <h3>Confirm Payment</h3>
            <p>Are you sure you want to mark this payment as <span style={{ color: '#4caf50', fontWeight: 600 }}>"Paid"</span>?</p>
            <div className="payment-confirm-buttons">
              <button className="payment-confirm-button" onClick={handleConfirmPayment}>
                Confirm
              </button>
              <button className="payment-cancel-button" onClick={handleCancelPayment}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;