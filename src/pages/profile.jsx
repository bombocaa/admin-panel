import React, { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaRegClock, FaEdit, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { firestore, auth } from '../firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import '../styles/profile.css';
import profileImg from '../assets/profile_plain.png';
import { formatTimeAgo, logActivity } from '../utils/activityLogger';

function AdminProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
    timeIn: ''
  });
  const [isEditing, setIsEditing] = useState({
    name: false,
    email: false,
    phone: false
  });
  const [adminDocId, setAdminDocId] = useState(null);
  const fileInputRef = useRef(null);
  const [avatar, setAvatar] = useState(profileImg);
  const [activities, setActivities] = useState([]);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const adminsRef = collection(firestore, 'admins');
        const q = query(adminsRef, where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0];
          const adminData = adminDoc.data();
          setAdminDocId(adminDoc.id);
          setProfile({
            name: adminData.full_name || '',
            email: adminData.email || '',
            phone: adminData.phone || '',
            status: 'Active',
            timeIn: adminData.time_in ? new Date(adminData.time_in.toDate()).toLocaleString() : 'Never'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Fetch recent activities
  const fetchActivities = async () => {
    try {
      const activitiesRef = collection(firestore, 'activityLogs');
      const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const activityList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activityList);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchActivities();
    // eslint-disable-next-line
  }, []);

  // Save field to database
  const saveField = async (field, value) => {
    try {
      if (!adminDocId) return;
      const adminRef = doc(firestore, 'admins', adminDocId);
      let updateData = {};
      if (field === 'name') updateData['full_name'] = value;
      else if (field === 'email') updateData['email'] = value;
      else if (field === 'phone') updateData['phone'] = value;
      await setDoc(adminRef, { ...profile, ...updateData }, { merge: true });
      setIsEditing(prev => ({ ...prev, [field]: false }));
      fetchProfile();
    } catch (error) {
      console.error('Error saving field:', error);
    }
  };

  // Handlers for editing
  const handleEdit = (field) => {
    setIsEditing(prev => ({ ...prev, [field]: true }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  const handleSave = (e, field) => {
    if (e.type === 'blur' || e.key === 'Enter') {
      saveField(field, profile[field]);
    }
  };

  // Avatar change handler
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update time in/out
  const updateTimeInOut = async (type) => {
    try {
      if (!adminDocId) return;
      const adminRef = doc(firestore, 'admins', adminDocId);
      const now = new Date();
      
      await setDoc(adminRef, {
        [type === 'in' ? 'time_in' : 'time_out']: now
      }, { merge: true });

      // Log the activity
      await logActivity(
        `Admin ${type === 'in' ? 'signed in' : 'signed out'}`,
        `Admin: ${profile.name}`,
        auth.currentUser?.uid
      );

      fetchProfile();
    } catch (error) {
      console.error(`Error updating time ${type}:`, error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={avatar} alt="Profile" className="avatar-icon" />
          <FaEdit className="edit-icon edit-icon-avatar" onClick={handleAvatarClick} />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>
        <div className="profile-divider"></div>
        <div className="profile-info">
          <div className="editable-detail">
            {isEditing.name ? (
              <input
                className="profile-name"
                type="text"
                name="name"
                value={profile.name}
                autoFocus
                onChange={handleChange}
                onBlur={e => handleSave(e, 'name')}
                onKeyDown={e => handleSave(e, 'name')}
              />
            ) : (
              <>
                <h2 className="profile-name">{profile.name}</h2>
                <FaEdit className="edit-icon edit-icon-name" onClick={() => handleEdit('name')} />
              </>
            )}
          </div>
          <div className="editable-detail" style={{marginTop: '4px'}}>
            {isEditing.email ? (
              <input
                className="profile-email"
                type="email"
                name="email"
                value={profile.email}
                autoFocus
                onChange={handleChange}
                onBlur={e => handleSave(e, 'email')}
                onKeyDown={e => handleSave(e, 'email')}
              />
            ) : (
              <>
                <p className="profile-email">{profile.email}</p>
                <FaEdit className="edit-icon edit-icon-email" onClick={() => handleEdit('email')} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="profile-details">
        <h3>Personal Information</h3>
        <div className="detail-item">
          <span className="detail-title">Phone Number:</span>
          <span className="editable-detail detail-value">
            {isEditing.phone ? (
              <input
                className="detail-value"
                type="text"
                name="phone"
                value={profile.phone}
                autoFocus
                onChange={handleChange}
                onBlur={e => handleSave(e, 'phone')}
                onKeyDown={e => handleSave(e, 'phone')}
                style={{minWidth: '120px'}}
              />
            ) : (
              <>
                <FaEdit className="edit-icon" onClick={() => handleEdit('phone')} />
                {profile.phone}
              </>
            )}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-title">Status:</span>
          <span className="detail-value"><FaCheckCircle /> {profile.status}</span>
        </div>
        <div className="detail-item">
          <span className="detail-title">Last Time In:</span>
          <span className="detail-value">{profile.timeIn}</span>
        </div>
      </div>
      <div className="profile-section-divider"></div>
      <div className="audit-log">
        <h3>Recent Activity</h3>
        <div className="log-list">
          {activities.map((activity) => (
            <div key={activity.id} className="log-item">
              <div className="log-content">
                <span className="log-action">{activity.action}</span>
                <span className="log-details">{activity.details}</span>
              </div>
              <span className="log-time">
                <FaRegClock /> {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="log-item">
              <span className="log-action">No recent activities</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
