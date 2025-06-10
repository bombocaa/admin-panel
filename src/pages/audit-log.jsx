import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { formatTimeAgo } from '../utils/activityLogger';
import '../styles/audit-log.css';
import '../styles/profile.css';
import { FaSearch, FaChevronLeft, FaChevronRight, FaPrint } from 'react-icons/fa';

function AuditLog() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [eventOptions, setEventOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 7;
  const printRef = useRef();

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const auditLogsRef = collection(firestore, 'activityLogs');
        const q = query(auditLogsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAuditLogs(logs);
        // Extract unique event types (actions)
        const uniqueEvents = Array.from(new Set(logs.map(log => log.action))).filter(Boolean);
        setEventOptions(uniqueEvents);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, []);

  // Filtering logic
  const filteredLogs = auditLogs.filter(log => {
    // Search filter
    const searchMatch =
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      (log.userId || '').toLowerCase().includes(search.toLowerCase());
    // Date filter (single date)
    let dateMatch = true;
    if (date) {
      if (log.timestamp?.toDate) {
        const logDate = log.timestamp.toDate();
        const selectedDate = new Date(date);
        dateMatch =
          logDate.getFullYear() === selectedDate.getFullYear() &&
          logDate.getMonth() === selectedDate.getMonth() &&
          logDate.getDate() === selectedDate.getDate();
      }
    }
    // Event filter
    const eventMatch = eventFilter ? log.action === eventFilter : true;
    return searchMatch && dateMatch && eventMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  // Reset to first page if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, date, eventFilter]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="profile-container audit-log-container">
      <div className="audit-log-title">Audit Log</div>
      <div className="audit-log-header-row">
        <div className="audit-log-search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by action, time, details"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
        <div className="audit-log-table-container" ref={printRef}>
          <table className="audit-log-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr><td colSpan="3" style={{textAlign:'center',color:'#888'}}>No logs found.</td></tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.action}</td>
                    <td>{formatTimeAgo(log.timestamp)}</td>
                    <td>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="audit-log-pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <FaChevronLeft />
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            aria-label="Next page"
          >
            <FaChevronRight />
          </button>
        </div>
        </>
      )}
    </div>
  );
}

export default AuditLog; 