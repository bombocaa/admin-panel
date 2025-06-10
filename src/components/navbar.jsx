import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaSearch, FaTimes, FaBell } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/navbar.css";
import { logActivity } from '../utils/activityLogger';
import { auth, firestore } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState("");
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const notificationsRef = useRef([]);

  // Expanded static keyword-to-page mapping
  const keywordMap = {
    // Dashboard
    dashboard: "/dashboard",
    overview: "/dashboard",
    home: "/dashboard",
    main: "/dashboard",
    summary: "/dashboard",
    stats: "/dashboard",
    statistics: "/dashboard",
    analytics: "/dashboard",
    // Tenants
    tenant: "/tenants",
    tenants: "/tenants",
    resident: "/tenants",
    residents: "/tenants",
    occupant: "/tenants",
    occupants: "/tenants",
    people: "/tenants",
    users: "/tenants",
    user: "/tenants",
    renter: "/tenants",
    renters: "/tenants",
    lease: "/tenants",
    leases: "/tenants",
    // Messages
    message: "/messages",
    messages: "/messages",
    chat: "/messages",
    chats: "/messages",
    communication: "/messages",
    mail: "/messages",
    mails: "/messages",
    inbox: "/messages",
    conversation: "/messages",
    conversations: "/messages",
    // Inquiries
    inquiry: "/inquiries",
    inquiries: "/inquiries",
    question: "/inquiries",
    questions: "/inquiries",
    ask: "/inquiries",
    asks: "/inquiries",
    request: "/inquiries",
    requests: "/inquiries",
    contact: "/inquiries",
    contacts: "/inquiries",
    feedback: "/inquiries",
    support: "/inquiries",
    // Maintenance
    maintenance: "/maintenance",
    repair: "/maintenance",
    repairs: "/maintenance",
    fix: "/maintenance",
    fixing: "/maintenance",
    issue: "/maintenance",
    issues: "/maintenance",
    problem: "/maintenance",
    problems: "/maintenance",
    service: "/maintenance",
    services: "/maintenance",
    "work order": "/maintenance",
    "work orders": "/maintenance",
    // Payments
    payment: "/payments",
    payments: "/payments",
    bill: "/payments",
    bills: "/payments",
    invoice: "/payments",
    invoices: "/payments",
    fee: "/payments",
    fees: "/payments",
    rent: "/payments",
    rents: "/payments",
    transaction: "/payments",
    transactions: "/payments",
    finance: "/payments",
    finances: "/payments",
    due: "/payments",
    dues: "/payments",
    // Announcements
    announcement: "/announcements",
    announcements: "/announcements",
    notice: "/announcements",
    notices: "/announcements",
    news: "/announcements",
    update: "/announcements",
    updates: "/announcements",
    info: "/announcements",
    information: "/announcements",
    bulletin: "/announcements",
    bulletins: "/announcements",
    // Room Availability Status
    status: "/room-update",
    "room status": "/room-update",
    availability: "/room-update",
    available: "/room-update",
    rooms: "/room-update",
    room: "/room-update",
    vacant: "/room-update",
    occupancy: "/room-update",
    occupied: "/room-update",
    open: "/room-update",
    closed: "/room-update",
    // Guest Approval
    guest: "/guest-approval",
    guests: "/guest-approval",
    visitor: "/guest-approval",
    visitors: "/guest-approval",
    approval: "/guest-approval",
    approvals: "/guest-approval",
    authorize: "/guest-approval",
    authorization: "/guest-approval",
    entry: "/guest-approval",
    entries: "/guest-approval",
    access: "/guest-approval",
    // Reports
    report: "/reports",
    reports: "/reports",
    export: "/reports",
    exports: "/reports",
    data: "/reports",
    print: "/reports",
    printing: "/reports",
    summaries: "/reports",
    // Profile
    profile: "/profile",
    account: "/profile",
    admin: "/profile",
    settings: "/profile",
    setting: "/profile",
    details: "/profile",
    personal: "/profile",
    preferences: "/profile"
  };

  // Function to get page title based on current path
  const getPageTitle = () => {
    const path = location.pathname;
    const pathParts = path.substring(1).split('/');
    const mainRoute = pathParts[0];
    if (!mainRoute) return "DASHBOARD";
    
    const title = mainRoute
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return title.toUpperCase();
  };

  // Close dropdowns if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Logout handler
  const handleLogout = async () => {
    // Log 'Time Out' activity
    try {
      const user = auth.currentUser;
      if (user) {
        const adminsRef = collection(firestore, 'admins');
        const q = query(adminsRef, where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        let name = user.email;
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0];
          name = adminDoc.data().full_name || user.email;
        }
        await logActivity('Time Out', `Admin: ${name}`, user.uid);
      }
    } catch (e) {
      // Ignore logging errors
    }
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  // Search handler with static keyword navigation (partial match)
  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = search.trim().toLowerCase();
    // Partial match for any keyword
    for (const [keyword, path] of Object.entries(keywordMap)) {
      if (searchTerm.includes(keyword)) {
        navigate(path);
        setSearch("");
        return;
      }
    }
    // Default: go to search results page
    if (searchTerm) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearch("");
    }
  };

  // Handle search icon click
  const handleSearchIconClick = (e) => {
    e.preventDefault();
    if (search.trim()) {
      handleSearch(e);
    }
  };

  // Fetch user name on mount
  useEffect(() => {
    async function fetchUserName() {
      const user = auth.currentUser;
      if (user) {
        const adminsRef = collection(firestore, 'admins');
        const q = query(adminsRef, where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        let name = user.email;
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0];
          name = adminDoc.data().full_name || user.email;
        }
        setUserName(name);
      }
    }
    fetchUserName();
  }, []);

  useEffect(() => {
    // Helper to fetch tenant info
    const getTenantInfo = async (userId) => {
      if (!userId) return { name: 'Unknown', email: '' };
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('user_id', '==', userId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        return { name: userDoc.full_name || userDoc.email || 'Unknown', email: userDoc.email || '' };
      }
      return { name: 'Unknown', email: '' };
    };

    // Helper to add notification
    const addNotification = async (collectionName, doc) => {
      let message = '';
      let title = `New in ${collectionName}`;
      let notifId = `${collectionName}_${doc.id || doc.createdAt || Math.random()}`;
      let timestamp = doc.createdAt || doc.date || new Date();
      switch (collectionName) {
        case 'garbageRequests':
          message = `Garbage request for ${doc.roomNumber || 'Unknown Room'}`;
          break;
        case 'reservationForm':
          message = `${doc.fullName || doc.email || 'Someone'} submitted a reservation form.`;
          title = 'New Reservation Form';
          break;
        case 'roomAvailability':
          // If the structure is floors > floor > [rooms], summarize changes
          if (doc.floors) {
            message = 'Room availability updated.';
          } else {
            message = 'Room availability changed.';
          }
          title = 'Room Availability Update';
          break;
        case 'inquiries':
          message = `${doc.fullName || doc.email || 'Someone'} sent an inquiry: "${doc.message || ''}"`;
          title = 'New Inquiry';
          break;
        case 'users':
          message = `${doc.full_name || doc.email || 'A new user'} has registered.`;
          title = 'New User Registered';
          break;
        default: {
          // Fallback to previous logic
          const userId = doc.userId || doc.user_id;
          const tenant = await getTenantInfo(userId);
          message = `${tenant.name} added a new entry.`;
        }
      }
      const notif = {
        id: notifId,
        type: collectionName,
        title,
        message,
        timestamp,
        read: false,
      };
      // Prevent duplicates
      if (!notificationsRef.current.some(n => n.id === notif.id)) {
        notificationsRef.current = [notif, ...notificationsRef.current];
        setNotifications([...notificationsRef.current]);
        setUnreadCount(c => c + 1);
      }
    };

    // Listen to all collections
    const unsubscribes = [];
    const collectionsToWatch = [
      { name: 'StudyAreaReservation', userField: 'userId' },
      { name: 'garbageRequests', userField: 'userId' },
      { name: 'guestReservations', userField: 'userId' },
      { name: 'maintenanceRequests', userField: 'userId' },
      { name: 'payments', userField: 'tenant' }, // payments may use tenant name
      { name: 'reservations', userField: 'userId' },
      // Added collections below
      { name: 'reservationForm', userField: 'email' },
      { name: 'roomAvailability', userField: null },
      { name: 'inquiries', userField: 'email' },
      { name: 'users', userField: 'email' },
    ];

    collectionsToWatch.forEach(({ name, userField }) => {
      const colRef = collection(firestore, name);
      const unsub = onSnapshot(colRef, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const doc = change.doc.data();
            doc.id = change.doc.id;
            // Only notify if not already in notifications
            await addNotification(name, doc);
          }
        });
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // Mark notification as read
  const handleNotificationClick = (notifId, type) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    setNotificationOpen(false);
    // Navigate based on type
    switch(type) {
      case 'maintenanceRequests':
        navigate('/maintenance');
        break;
      case 'guestReservations':
        navigate('/guest-approval');
        break;
      case 'inquiries':
        navigate('/inquiries');
        break;
      case 'announcements':
        navigate('/announcements');
        break;
      case 'payments':
        navigate('/payments');
        break;
      case 'StudyAreaReservation':
      case 'reservations':
      case 'garbageRequests':
        navigate('/amenities-use');
        break;
      default:
        break;
    }
  };

  return (
    <div className="navbar">
      <div className="logo">{getPageTitle()}</div>

      <form className="navbar-search-bar" onSubmit={handleSearch}>
        <FaSearch 
          className="search-icon" 
          onClick={handleSearchIconClick} 
          style={{ cursor: 'pointer' }} 
        />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <FaTimes
            className="clear-icon"
            onClick={() => setSearch("")}
            tabIndex={0}
            aria-label="Clear search"
          />
        )}
      </form>

      <div className="navbar-icons">
        <div className="notification-menu" ref={notificationRef}>
          <div className="notification-icon-wrapper">
            <FaBell
              className="notification-icon"
              onClick={() => setNotificationOpen(!notificationOpen)}
            />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          {notificationOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification.id, notification.type)}
                    >
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.timestamp?.toDate?.() || notification.timestamp).toLocaleString()}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-item">
                    <p>No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu" ref={menuRef}>
          <FaUser
            className="user-icon"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />
          <span className="navbar-username">{userName}!</span>
          {dropdownOpen && (
            <div className="dropdown">
              <Link to="/profile" className="dropdown-link">Profile</Link>
              <button onClick={handleLogout} className="dropdown-link">Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
