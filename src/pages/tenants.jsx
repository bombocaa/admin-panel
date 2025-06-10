import React, { useState, useEffect } from "react";
import { FaPlus, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../styles/tenants.css";
import { firestore, auth } from "../firebase"; // Import firestore and auth from firebase.js
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"; // Firestore functions
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase Authentication function

function Tenants() {
  const [tenants, setTenants] = useState([]); // State to store tenants
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    room: "",
    transferDate: "",
    phone: "",
    email: "" // Added email for tenant registration
  });
  const [error, setError] = useState(null); // To hold any error messages
  const [formError, setFormError] = useState(""); // For form validation errors
  const [searchTerm, setSearchTerm] = useState("");
  const [printRef, setPrintRef] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Number of items to show per page

  // Fetch tenants from Firestore when the component mounts
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const tenantsCollection = collection(firestore, "users"); // Fetch users from "users" collection
        const tenantSnapshot = await getDocs(tenantsCollection);
        const tenantList = tenantSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().full_name, // Assuming the document has a "full_name" field
          room: doc.data().roomNo, // Assuming the document has a "room_number" field
          transferDate: doc.data().created_at.toDate().toLocaleDateString(), // Assuming created_at exists
          phone: doc.data().phone, // Change 'contact' to 'phone'
          status: doc.data().status || "Inactive", // Status, initially inactive
          email: doc.data().email, // Add email field
        }));
        setTenants(tenantList);
      } catch (err) {
        console.error("Error fetching tenants: ", err);
        setError("Error fetching tenant data.");
      }
    };

    fetchTenants();
  }, []); // Empty array ensures this runs only once when the component mounts

  // Function to generate a random one-time password
  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8); // Example password, 8 characters
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission to add a new tenant and create a Firebase user
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Input/Data Validation
    if (!formData.name.trim() || !formData.room.trim() || !formData.transferDate.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setFormError("All fields are required.");
      return;
    }
    if (formData.name.trim().length < 3) {
      setFormError("Name must be at least 3 characters long.");
      return;
    }
    if (formData.room.trim().length < 2) {
      setFormError("Room number must be at least 2 characters long.");
      return;
    }
    // Email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    // Phone validation (basic: must be digits and at least 7 characters)
    const phoneRegex = /^\d{7,}$/;
    if (!phoneRegex.test(formData.phone.replace(/[^\d]/g, ""))) {
      setFormError("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    setFormError(""); // Clear error if validation passes
    try {
      // Check if tenant already exists
      const existingTenant = await getDocs(
        collection(firestore, "users")
      ).then((snapshot) =>
        snapshot.docs.find(
          (doc) => doc.data().roomNo === formData.room
        )
      );

      // If tenant exists, update status to Active
      if (existingTenant) {
        const tenantId = existingTenant.id;

        // Update the existing tenant's status to Active
        const tenantRefDoc = doc(firestore, "users", tenantId);
        await updateDoc(tenantRefDoc, {
          status: "Active", // Change status to active
        });

        // Show success message
        alert(`Account for ${formData.name} has been activated.`);

        // Re-fetch tenants to include the updated one
        const tenantsCollection = collection(firestore, "users");
        const tenantSnapshot = await getDocs(tenantsCollection);
        const tenantList = tenantSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().full_name,
          room: doc.data().roomNo,
          transferDate: doc.data().created_at.toDate().toLocaleDateString(),
          phone: doc.data().phone,
          status: doc.data().status,
          email: doc.data().email, // Add email field
        }));
        setTenants(tenantList);
      } else {
        // If tenant doesn't exist, create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.room // Using room as a temporary password
        );

        // Add tenant data to Firestore
        await addDoc(collection(firestore, "users"), {
          full_name: formData.name,
          roomNo: formData.room,
          created_at: new Date(),
          phone: formData.phone,
          status: "Active", // Set status to Active immediately
          email: formData.email,
        });

        setFormData({ name: "", room: "", transferDate: "", phone: "", email: "" }); // Reset form
        setShowForm(false);
        setError(null);

        // Re-fetch tenants to include the new one
        const tenantsCollection = collection(firestore, "users");
        const tenantSnapshot = await getDocs(tenantsCollection);
        const tenantList = tenantSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().full_name,
          room: doc.data().roomNo,
          transferDate: doc.data().created_at.toDate().toLocaleDateString(),
          phone: doc.data().phone,
          status: doc.data().status,
          email: doc.data().email, // Add email field
        }));
        setTenants(tenantList);

        // Show success message
        alert(`Account for ${formData.name} has been created and activated.`);
      }
    } catch (err) {
      console.error("Error adding or updating tenant: ", err);
      setError("Error adding or updating tenant.");
    }
  };

  // Search and filter tenants (remove sorting)
  const filteredTenants = tenants.filter((tenant) => {
    const term = searchTerm.toLowerCase();
    return (
      tenant.name.toLowerCase().includes(term) ||
      tenant.room.toLowerCase().includes(term) ||
      tenant.phone?.toLowerCase().includes(term) ||
      tenant.status?.toLowerCase().includes(term) ||
      tenant.transferDate?.toLowerCase().includes(term)
    );
  });

  // Remove sorting, use filteredTenants directly
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTenants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePrint = () => {
    // Print 20 tenants per page
    const tenantsPerPrintPage = 20;
    let printTableRows = "";
    tenants.forEach((tenant, idx) => {
      if (idx % tenantsPerPrintPage === 0 && idx !== 0) {
        printTableRows += '</tbody></table><div style="page-break-after: always;"></div><table class="tenant-table"><thead><tr>' +
          '<th>Name</th><th>Room Number</th><th>Date of Transfer</th><th>Phone Number</th></tr></thead><tbody>';
      }
      printTableRows += `<tr>
        <td>${tenant.name}</td>
        <td>${tenant.room}</td>
        <td>${tenant.transferDate}</td>
        <td>${tenant.phone}</td>
      </tr>`;
    });
    const printTable = `<table class="tenant-table"><thead><tr><th>Name</th><th>Room Number</th><th>Date of Transfer</th><th>Phone Number</th></tr></thead><tbody>${printTableRows}</tbody></table>`;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `
      <div class="print-container">
        <div class="print-header">

          <h2>Tenant List Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        ${printTable}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="tenants-container">
      <div className="tenants-header">
        <h2>Tenant List</h2>
        <div className="header-buttons">
        <button className="add-button" onClick={() => setShowForm(true)}>
          <FaPlus /> Add Tenant
        </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="tenant-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by name, room, phone, or date..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="tenant-list-wrapper" ref={printRef}>
        <table className="tenant-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Room Number</th>
              <th>Date of Transfer</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((tenant) => (
              <tr key={tenant.id}>
                <td>{tenant.name}</td>
                <td>{tenant.room}</td>
                <td>{tenant.transferDate}</td>
                <td>{tenant.phone}</td>
                <td>{tenant.email}</td>
                <td>
                  <span className={`status-badge ${tenant.status.toLowerCase()}`}>
                    {tenant.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - Always show */}
      <div className="tenants-pagination">
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

      {/* Tenant Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-form">
            <h3>Add New Tenant</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="room"
                placeholder="Room Number"
                value={formData.room}
                onChange={handleChange}
                required
              />
              <input
                type="date"
                name="transferDate"
                placeholder="Date of Transfer"
                value={formData.transferDate}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phone" // Change 'contact' to 'phone'
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {/* Show error message if validation fails */}
              {formError && <div style={{ color: 'red', marginBottom: '10px' }}>{formError}</div>}
              <div className="form-actions">
                <button type="submit" className="send-button">
                  Add Tenant
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Display error message */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Tenants;
