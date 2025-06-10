import React, { useState, useEffect, useRef } from 'react';
import { FaFileAlt, FaPrint, FaCalendarAlt, FaDumbbell, FaUsers, FaTools, FaMoneyBillWave, FaUserFriends, FaDatabase, FaLightbulb, FaCalendarCheck, FaFilter } from 'react-icons/fa';
import { firestore } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import '../styles/reports.css';

function TipsCard() {
  return (
    <div className="reports-tips-card">
      <div className="tips-header"><FaLightbulb style={{fontSize: '2.5em', marginRight: 12}} /> Tips for Using Reports</div>
      <ul>
        <li>
          <FaCalendarCheck style={{marginRight: 12, fontSize: '2.5em'}}/>
          <span>
            <b>Select a date range</b> to focus your report on a specific period.
          </span>
        </li>
        <li>
          <FaFilter style={{marginRight: 12, fontSize: '2.5em'}}/>
          <span>
            <b>Choose a report type</b> to view tenants, payments, maintenance, guests, amenities, or all data at once.
          </span>
        </li>
        <li>
          <FaPrint style={{marginRight: 12, fontSize: '2.5em'}}/>
          <span>
            <b>Print or export</b> your results for sharing or record-keeping.
          </span>
        </li>
      </ul>
    </div>
  );
}

function Reports() {
  const [reportType, setReportType] = useState('tenants');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const tooltipTimeout = useRef(null);

  const reportTypes = [
    { id: 'all', label: 'All Data', icon: <FaDatabase />, description: 'View combined data from all categories' },
    { id: 'tenants', label: 'Tenants List', icon: <FaUsers />, description: 'View and analyze tenant occupancy and status' },
    { id: 'maintenance', label: 'Maintenance Requests', icon: <FaTools />, description: 'Track maintenance issues and their resolution' },
    { id: 'payments', label: 'Payment History', icon: <FaMoneyBillWave />, description: 'Monitor payment records and financial status' },
    { id: 'guests', label: 'Guest Visits', icon: <FaUserFriends />, description: 'Review guest visit logs and approvals' },
    { id: 'amenities', label: 'Amenities Usage', icon: <FaDumbbell />, description: 'Track facility and amenities usage records' }
  ];

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchReportData();
    }
  }, [reportType, dateRange]);

  useEffect(() => {
    if (formError) {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = setTimeout(() => setFormError(''), 3000);
    }
    return () => clearTimeout(tooltipTimeout.current);
  }, [formError]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch data based on report type
      let data = [];
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      switch (reportType) {
        case 'all':
          data = await fetchAllData(startDate, endDate);
          break;
        case 'tenants':
          data = await fetchTenantsData(startDate, endDate);
          break;
        case 'maintenance':
          data = await fetchMaintenanceData(startDate, endDate);
          break;
        case 'payments':
          data = await fetchPaymentsData(startDate, endDate);
          break;
        case 'guests':
          data = await fetchGuestsData(startDate, endDate);
          break;
        case 'amenities':
          data = await fetchAmenitiesData(startDate, endDate);
          break;
        default:
          data = [];
      }

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
    setLoading(false);
  };

  const fetchAllData = async (startDate, endDate) => {
    try {
      // Fetch data from all collections
      const [tenantsData, maintenanceData, paymentsData, guestsData, amenitiesData] = await Promise.all([
        fetchTenantsData(startDate, endDate),
        fetchMaintenanceData(startDate, endDate),
        fetchPaymentsData(startDate, endDate),
        fetchGuestsData(startDate, endDate),
        fetchAmenitiesData(startDate, endDate)
      ]);

      // Combine all data with type indicators and normalized dates
      const allData = [
        ...tenantsData.map(item => ({
          ...item,
          data_type: 'Tenant',
          sort_date: new Date(item.date_of_transfer)
        })),
        ...maintenanceData.map(item => ({
          ...item,
          data_type: 'Maintenance',
          sort_date: new Date(item.date_reported)
        })),
        ...paymentsData.map(item => ({
          ...item,
          data_type: 'Payment',
          sort_date: new Date(item.payment_date)
        })),
        ...guestsData.map(item => ({
          ...item,
          data_type: 'Guest',
          sort_date: new Date(item.check_in_time)
        })),
        ...amenitiesData.map(item => ({
          ...item,
          data_type: 'Amenity',
          sort_date: new Date(item.usage_date)
        }))
      ];

      // Sort by date (most recent first) and then by data type
      return allData.sort((a, b) => {
        // First sort by date
        const dateComparison = b.sort_date - a.sort_date;
        if (dateComparison !== 0) return dateComparison;
        
        // If dates are equal, sort by data type
        return a.data_type.localeCompare(b.data_type);
      });
    } catch (error) {
      console.error('Error fetching all data:', error);
      return [];
    }
  };

  const fetchTenantsData = async (startDate, endDate) => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(
        usersRef,
        where('created_at', '>=', startDate),
        where('created_at', '<=', endDate),
        orderBy('created_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        name: doc.data().full_name,
        room_number: doc.data().roomNo,
        date_of_transfer: doc.data().created_at.toDate().toLocaleDateString(),
        phone_number: doc.data().phone,
        status: doc.data().status || 'Active'
      }));
    } catch (error) {
      console.error('Error fetching tenants data:', error);
      return [];
    }
  };

  const fetchMaintenanceData = async (startDate, endDate) => {
    try {
      const maintenanceRef = collection(firestore, 'maintenanceRequests');
      const q = query(
        maintenanceRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        room_number: doc.data().roomNo,
        category: doc.data().category,
        description: doc.data().description,
        date_reported: doc.data().date.toDate().toLocaleDateString(),
        status: doc.data().status,
        resolution_date: doc.data().resolutionDate ? doc.data().resolutionDate.toDate().toLocaleDateString() : '-'
      }));
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      return [];
    }
  };

  const fetchPaymentsData = async (startDate, endDate) => {
    try {
      const paymentsRef = collection(firestore, 'payments');
      const q = query(
        paymentsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        tenant_name: doc.data().tenant,
        room_number: doc.data().roomNo,
        amount: `₱${Number(doc.data().amount).toFixed(2)}`,
        payment_date: doc.data().date,
        payment_method: doc.data().verification_status,
        status: doc.data().status
      }));
    } catch (error) {
      console.error('Error fetching payments data:', error);
      return [];
    }
  };

  const fetchGuestsData = async (startDate, endDate) => {
    try {
      const guestsRef = collection(firestore, 'guestVisits');
      const q = query(
        guestsRef,
        where('checkInTime', '>=', startDate),
        where('checkInTime', '<=', endDate),
        orderBy('checkInTime', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        guest_name: doc.data().guestName,
        visiting_room: doc.data().roomNumber,
        host_name: doc.data().hostName,
        check_in_time: doc.data().checkInTime.toDate().toLocaleString(),
        check_out_time: doc.data().checkOutTime ? doc.data().checkOutTime.toDate().toLocaleString() : '-',
        status: doc.data().status
      }));
    } catch (error) {
      console.error('Error fetching guests data:', error);
      return [];
    }
  };

  const fetchAmenitiesData = async (startDate, endDate) => {
    try {
      const amenitiesRef = collection(firestore, 'amenitiesUsage');
      const q = query(
        amenitiesRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        amenity_name: doc.data().amenity,
        user_name: doc.data().tenantName,
        room_number: doc.data().roomNumber,
        usage_date: doc.data().date,
        duration: `${doc.data().timeIn} - ${doc.data().timeOut}`,
        status: 'Completed'
      }));
    } catch (error) {
      console.error('Error fetching amenities data:', error);
      return [];
    }
  };

  const getReportColumns = () => {
    switch (reportType) {
      case 'all':
        return ['Data Type', 'Name/Title', 'Room Number', 'Date', 'Status', 'Details'];
      case 'tenants':
        return ['Name', 'Room Number', 'Date of Transfer', 'Phone Number', 'Status'];
      case 'maintenance':
        return ['Room Number', 'Category', 'Description', 'Date Reported', 'Status', 'Resolution Date'];
      case 'payments':
        return ['Tenant Name', 'Room Number', 'Amount', 'Payment Date', 'Payment Method', 'Status'];
      case 'guests':
        return ['Guest Name', 'Visiting Room', 'Host Name', 'Check-in Time', 'Check-out Time', 'Status'];
      case 'amenities':
        return ['Amenity Name', 'User Name', 'Room Number', 'Usage Date', 'Duration', 'Status'];
      default:
        return [];
    }
  };

  const formatAllDataRow = (item) => {
    switch (item.data_type) {
      case 'Tenant':
        return {
          data_type: item.data_type,
          name_title: item.name,
          room_number: item.room_number,
          date: item.date_of_transfer,
          status: item.status,
          details: `Phone: ${item.phone_number}`
        };
      case 'Maintenance':
        return {
          data_type: item.data_type,
          name_title: item.category,
          room_number: item.room_number,
          date: item.date_reported,
          status: item.status,
          details: item.description
        };
      case 'Payment':
        return {
          data_type: item.data_type,
          name_title: item.tenant_name,
          room_number: item.room_number,
          date: item.payment_date,
          status: item.status,
          details: `${item.amount} (${item.payment_method})`
        };
      case 'Guest':
        return {
          data_type: item.data_type,
          name_title: item.guest_name,
          room_number: item.visiting_room,
          date: item.check_in_time,
          status: item.status,
          details: `Host: ${item.host_name}`
        };
      case 'Amenity':
        return {
          data_type: item.data_type,
          name_title: item.amenity_name,
          room_number: item.room_number,
          date: item.usage_date,
          status: item.status,
          details: `Duration: ${item.duration}`
        };
      default:
        return {};
    }
  };

  const handlePrint = () => {
    const reportTitle = `${reportType === 'all' ? 'All Data' : reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    const dateRangeText = `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;
    const columns = getReportColumns();

    // Sort data for printing if it's the "all" report type
    const sortedData = reportType === 'all' 
      ? [...reportData].sort((a, b) => {
          // First sort by date
          const dateA = new Date(a.date_of_transfer || a.date_reported || a.payment_date || a.check_in_time || a.usage_date);
          const dateB = new Date(b.date_of_transfer || b.date_reported || b.payment_date || b.check_in_time || b.usage_date);
          const dateComparison = dateB - dateA;
          if (dateComparison !== 0) return dateComparison;
          
          // If dates are equal, sort by data type
          return a.data_type.localeCompare(b.data_type);
        })
      : reportData;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.write(`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              margin: 0;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .header h1 {
              margin: 0;
              color: #333;
              font-size: 24px;
            }
            .date-range { 
              text-align: center; 
              margin: 10px 0;
              color: #666;
              font-size: 16px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 14px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #A0C878;
              color: white;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .data-type {
              font-weight: 600;
              color: #2c3e50;
            }
            .date-cell {
              white-space: nowrap;
            }
            @media print {
              body {
                padding: 0;
              }
              .header {
                background-color: white;
                padding: 0;
                margin-bottom: 30px;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead {
                display: table-header-group;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportTitle}</h1>
            <div class="date-range">${dateRangeText}</div>
          </div>
          <table>
            <thead>
              <tr>
                ${columns.map(column => `<th>${column}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${reportType === 'all' 
                ? sortedData.map(item => {
                    const formattedItem = formatAllDataRow(item);
                    return `
                      <tr>
                        <td class="data-type">${formattedItem.data_type}</td>
                        <td>${formattedItem.name_title}</td>
                        <td>${formattedItem.room_number}</td>
                        <td class="date-cell">${formattedItem.date}</td>
                        <td>${formattedItem.status}</td>
                        <td>${formattedItem.details}</td>
                      </tr>
                    `;
                  }).join('')
                : reportData.map(item => `
                    <tr>
                      ${columns.map(column => `<td>${item[column.toLowerCase().replace(/\s+/g, '_')] || '-'}</td>`).join('')}
                    </tr>
                  `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    doc.close();

    // Print the iframe content
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    // Remove the iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  return (
    <div className="container">
      <div className="reports-header">
        <h1>Generate Reports</h1>
      </div>
      <div className="reports-welcome-card">
        <div className="icon">
          <FaFileAlt size={36} color="#A0C878" />
        </div>
        <div>
          <h2>Welcome to Reports</h2>
          <p>
            Generate, analyze, and print reports for tenants, payments, maintenance, and more.<br />
            Use the filters below to customize your report. Need help? See the tips on the right!
          </p>
        </div>
      </div>
      <div className="reports-content">
        <div className="reports-main">
          <form
            className="reports-form"
            onSubmit={e => {
              e.preventDefault();
              if (!dateRange.start || !dateRange.end) {
                setFormError("Please select both a start date and an end date.");
                return;
              }
              setFormError('');
              handlePrint();
            }}
          >
            <div className="reports-form-row">
              <div className="reports-form-group">
                <label><FaFileAlt className="icon-inline" /> Report Type:</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)}>
                  {reportTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                <p className="form-description">{reportTypes.find(t => t.id === reportType)?.description}</p>
                <button className="generate-report-btn" type="submit">
                  <FaFileAlt className="icon-inline" /> Generate Report
                </button>
              </div>
              <div className="reports-form-group" style={{ position: 'relative' }}>
                <label><FaCalendarAlt className="icon-inline" /> Start Date:</label>
                <input type="date" value={dateRange.start} onChange={e => handleDateChange('start', e.target.value)} />
                {formError && (
                  <div className="form-tooltip" role="tooltip">
                    {formError}
                  </div>
                )}
              </div>
              <div className="reports-form-group">
                <label><FaCalendarAlt className="icon-inline" /> End Date:</label>
                <input type="date" value={dateRange.end} onChange={e => handleDateChange('end', e.target.value)} />
              </div>
            </div>
          </form>
        </div>
        <TipsCard />
      </div>
      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Generating your report...</p>
        </div>
      )}
    </div>
  );
}

export default Reports; 