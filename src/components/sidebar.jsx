import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaUserCog,
  FaEnvelope,
  FaTools,
  FaWallet,
  FaRegNewspaper,
  FaTv,
  FaChevronDown,
  FaDoorOpen,
  FaUserFriends,
  FaChartBar,
  FaDumbbell,
  FaHistory,
} from "react-icons/fa";
import "../styles/sidebar.css";

function Sidebar() {
  const [isMessagesDropdownOpen, setIsMessagesDropdownOpen] = useState(false);

  // Toggle the Messages dropdown
  const toggleMessagesDropdown = () => {
    setIsMessagesDropdownOpen(!isMessagesDropdownOpen);
  };

  return (
    <div className="sidebar">
      <h1 className="sidebar-title">T-GLOBAL RESIDENCE</h1>
      <ul className="sidebar-list">
        <li className="sidebar-item">
          <NavLink to="/dashboard" className="sidebar-link">
            <FaTv className="sidebar-icon" />
            <span>Overview</span>
          </NavLink>
        </li>
        <li className="sidebar-item">
          <NavLink to="/tenants" className="sidebar-link">
            <FaUserCog className="sidebar-icon" />
            <span>Tenants</span>
          </NavLink>
        </li>

        {/* Messages Dropdown */}
        <li className="sidebar-item">
          <div
            className="sidebar-link"
            onClick={toggleMessagesDropdown}
            style={{ cursor: "pointer" }}
          >
            <FaEnvelope className="sidebar-icon" />
            <span>Inquiries</span>
            <FaChevronDown
              className={`dropdown-icon ${isMessagesDropdownOpen ? "open" : ""}`}
              style={{ marginLeft: "auto" }}
            />
          </div>
          {isMessagesDropdownOpen && (
            <ul className="sidebar-sublist">
              <li className="sidebar-subitem">
                <NavLink to="/messages" className="sidebar-sublink">
                  Tenants Inquiries
                </NavLink>
              </li>
              <li className="sidebar-subitem">
                <NavLink to="/inquiries" className="sidebar-sublink">
                  Guests Inquiries
                </NavLink>
              </li>
            </ul>
          )}
        </li>

        <li className="sidebar-item">
          <NavLink to="/maintenance" className="sidebar-link">
            <FaTools className="sidebar-icon" />
            <span>Maintenance Request</span>
          </NavLink>
        </li>

        <li className="sidebar-item">
          <NavLink to="/guest-approval" className="sidebar-link">
            <FaUserFriends className="sidebar-icon" />
            <span>Guest Approval</span>
          </NavLink>
        </li>

        <li className="sidebar-item">
          <NavLink to="/payments" className="sidebar-link">
            <FaWallet className="sidebar-icon" />
            <span>Payment</span>
          </NavLink>
        </li>

        <li className="sidebar-item">
          <NavLink to="/announcements" className="sidebar-link">
            <FaRegNewspaper className="sidebar-icon" />
            <span>Announcement</span>
          </NavLink>
        </li>

        <li className="sidebar-item">
          <NavLink to="/room-update" className="sidebar-link">
            <FaDoorOpen className="sidebar-icon" />
            <span>Room Availability Status</span>
          </NavLink>
        </li>

        <li className="sidebar-item">
          <NavLink to="/amenities-use" className="sidebar-link">
            <FaDumbbell className="sidebar-icon" />
            <span>Amenities Use Records</span>
          </NavLink>
        </li>

        <li className="sidebar-item">
          <NavLink to="/reports" className="sidebar-link">
            <FaChartBar className="sidebar-icon" />
            <span>Reports</span>
          </NavLink>
        </li>

        <li className="sidebar-item">
          <NavLink to="/audit-log" className="sidebar-link">
            <FaHistory className="sidebar-icon" />
            <span>Audit Log</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
