import React from 'react';
import {FaTrashAlt } from 'react-icons/fa';
import '../styles/quickActionsPanel.css';

const QuickActionsPanel = ({ onAddAnnouncement, onTrashCollection, onAddTenant }) => {
  return (
    <div className="quick-actions-panel">
      <button className="quick-action-btn" onClick={onTrashCollection}>
        <FaTrashAlt className="quick-action-icon" />
        Trash Collection Alert
      </button>

    </div>
  );
};

export default QuickActionsPanel; 