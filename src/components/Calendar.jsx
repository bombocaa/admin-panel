import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaList, FaPlus } from 'react-icons/fa';
import '../styles/calendar.css';

const Calendar = ({ guestVisits, onAddEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [today] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    description: ''
  });

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getEventsForDate = (dateStr) => {
    const guestEvents = guestVisits?.filter(event => event.visitDate === dateStr) || [];
    return [...guestEvents];
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const getWeekDates = () => {
    const weekDates = [];
    const currentDay = new Date(currentDate);
    const dayOfWeek = currentDay.getDay();
    const diff = currentDay.getDate() - dayOfWeek;

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDay.getFullYear(), currentDay.getMonth(), diff + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth + firstDayOfMonth;
    const weeks = Math.ceil(totalDays / 7);

    for (let i = 0; i < weeks * 7; i++) {
      const dayNumber = i - firstDayOfMonth + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const date = isCurrentMonth
        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber)
        : null;
      const events = date ? getEventsForDate(date.toISOString().split('T')[0]) : [];

      days.push(
        <div
          key={i}
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} 
            ${isToday(date) ? 'today' : ''} 
            ${isSelected(date) ? 'selected' : ''}`}
          onClick={() => isCurrentMonth && setSelectedDate(date)}
        >
          {isCurrentMonth && (
            <>
              <span className="day-number">{dayNumber}</span>
              {events.length > 0 && (
                <div className="event-indicators">
                  {events.map((event, index) => (
                    <div
                      key={index}
                      className={`event-dot guest`}
                      title="Guest Visit"
                    />
                  ))}
                </div>
              )}
              {events.length > 0 && (
                <div className="event-count">{events.length}</div>
              )}
            </>
          )}
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates();
    return weekDates.map((date, index) => {
      const events = getEventsForDate(date.toISOString().split('T')[0]);
      return (
        <div
          key={index}
          className={`calendar-day ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="week-day-header">
            <span className="day-name">{days[date.getDay()]}</span>
            <span className="day-number">{date.getDate()}</span>
          </div>
          <div className="week-events">
            {events.map((event, index) => (
              <div
                key={index}
                className={`week-event guest`}
              >
                <span className="event-time">
                  {event.visitTime}
                </span>
                <span className="event-title">
                  {event.tenantName} - {event.guestName}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  const renderEventList = () => {
    if (!selectedDate) return null;

    const events = getEventsForDate(selectedDate.toISOString().split('T')[0]);
    if (events.length === 0) {
      return <div className="no-events">No events scheduled for this date</div>;
    }

    return (
      <div className="event-list">
        {events.map((event, index) => (
          <div key={index} className={`event-item guest`}>
            <div className="event-time">
              {event.visitTime}
            </div>
            <div className="event-details">
              <div className="event-title">
                {event.tenantName} - {event.guestName}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleAddEvent = () => {
    if (selectedDate) {
      setNewEvent(prev => ({
        ...prev,
        date: selectedDate.toISOString().split('T')[0]
      }));
      setShowEventModal(true);
    }
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    if (onAddEvent) {
      onAddEvent(newEvent);
    }
    setShowEventModal(false);
    setNewEvent({
      title: '',
      date: '',
      time: '',
      description: ''
    });
  };

  const renderEventModal = () => {
    if (!showEventModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Add New Event</h3>
            <button 
              className="close-button"
              onClick={() => setShowEventModal(false)}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleEventSubmit}>
            <div className="form-group">
              <label>Event Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
                required
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter event description"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={() => setShowEventModal(false)}>
                Cancel
              </button>
              <button type="submit" className="submit-button">
                Add Event
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button onClick={handlePrevMonth} className="month-nav">
            <FaChevronLeft />
          </button>
          <h2>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={handleNextMonth} className="month-nav">
            <FaChevronRight />
          </button>
        </div>
        <div className="calendar-actions">
          <button onClick={handleToday} className="today-button">
            Today
          </button>
          <button onClick={handleAddEvent} className="add-event-button">
            <FaPlus /> Add Event
          </button>
          <div className="view-toggle">
            <button
              className={`view-button ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              <FaCalendarAlt />
            </button>
            <button
              className={`view-button ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      <div className={`calendar-grid ${viewMode === 'week' ? 'week-view' : ''}`}>
        {days.map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
        {viewMode === 'month' ? renderCalendarDays() : renderWeekView()}
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot guest"></div>
          <span>Guest Visit</span>
        </div>
      </div>

      {selectedDate && (
        <div className="selected-date-events">
          <h3>Events for {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</h3>
          {renderEventList()}
        </div>
      )}

      {renderEventModal()}
    </div>
  );
};

export default Calendar; 