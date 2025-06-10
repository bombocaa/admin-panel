import React, { useState, useEffect } from 'react';
import { FaSearch, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import '../styles/amenities-use.css';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { firestore } from '../firebase'; // adjust path as needed

function AmenitiesUse() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const recordsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      const allRecords = [];

      // 1. Fetch all users and build a lookup by user_id
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const userMap = {};
      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.user_id) {
          userMap[data.user_id.trim().toLowerCase()] = {
            full_name: data.full_name || 'Unknown',
            roomNo: data.roomNo || 'Unknown'
          };
        }
      });

      // 2. Fetch from reservations (userId)
      const reservationsSnap = await getDocs(collection(firestore, 'reservations'));
      for (const docSnap of reservationsSnap.docs) {
        const data = docSnap.data();
        const userKey = (data.userId || '').trim().toLowerCase();
        const userInfo = userMap[userKey] || { full_name: 'Unknown', roomNo: 'Unknown' };
        allRecords.push({
          tenantName: userInfo.full_name,
          roomNumber: userInfo.roomNo,
          amenity: data.facility || 'Unknown',
          date: data.date ? (data.date.toDate ? data.date.toDate() : data.date) : '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          status: data.status || '',
        });
      }

      // 3. Fetch from StudyAreaReservation (userId)
      const studySnap = await getDocs(collection(firestore, 'StudyAreaReservation'));
      for (const docSnap of studySnap.docs) {
        const data = docSnap.data();
        const studyUserKey = (data.userId || '').trim().toLowerCase();
        const studyUserInfo = userMap[studyUserKey] || { full_name: 'Unknown', roomNo: 'Unknown' };
        allRecords.push({
          tenantName: studyUserInfo.full_name,
          roomNumber: studyUserInfo.roomNo,
          amenity: data.facility || 'Unknown',
          date: data.date ? (data.date.toDate ? data.date.toDate() : data.date) : '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          status: data.status || '',
          seatNumber: data.seatNumber || '',
        });
      }

      setRecords(allRecords);
    };

    fetchData();
  }, []);

  // Filter records based on search term only
  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.tenantName.toLowerCase().includes(searchLower) ||
      record.roomNumber.toLowerCase().includes(searchLower) ||
      record.amenity.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  // Helper to format date as MM/DD/YYYY
  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const date = (dateObj instanceof Date) ? dateObj : new Date(dateObj);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Example function to add a new amenity use record
  const handleAddAmenityUse = async (formData) => {
    // Add amenity use record to Firestore (pseudo-code, adapt as needed)
    await addDoc(collection(firestore, "amenitiesUse"), formData);
  };

  return (
    <div className="amenities-use-container">
      <h2>Amenities Use Records</h2>

      <div className="tenant-search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by tenant name, room number, or amenity..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="amenities-table-wrapper">
        <table className="amenities-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Room</th>
              <th>Amenity</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Seat Number</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record, idx) => (
              <tr key={idx}>
                <td>{record.tenantName}</td>
                <td>{record.roomNumber}</td>
                <td>{record.amenity}</td>
                <td>{formatDate(record.date)}</td>
                <td>{record.startTime}</td>
                <td>{record.endTime}</td>
                <td>{record.amenity.toLowerCase() === 'study area' ? (record.seatNumber || '') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="amenities-pagination">
          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="pagination-btn" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AmenitiesUse; 