import React, { useState } from 'react';
import '../styles/room.css'; // Make sure your CSS is properly linked

const RoomUpdate = () => {
  const generateFloors = () => {
    const floors = {};
    const rooms = [
      { room: '01', available: true },
      { room: '02', available: false },
      { room: '03', available: true },
      { room: '04', available: false },
      { room: '05', available: true },
      { room: '06', available: true },
      { room: '07', available: false },
      { room: '08', available: true },
      { room: '09', available: false },
      { room: '10', available: true },
      { room: '11', available: false },
      { room: '12', available: true },
      { room: '13', available: true },
    ];

    const getFloorSuffix = (num) => {
      if (num === 1) return 'st';
      if (num === 2) return 'nd';
      if (num === 3) return 'rd';
      return 'th';
    };

    for (let i = 3; i <= 15; i++) {
      if (i === 13) continue; // Skip 13th floor

      const floorName = `${i}${getFloorSuffix(i)} Floor`;
      
      floors[floorName] = rooms.map((r) => ({
        room: `${i}${r.room}`,
        available: r.available,
      }));
    }
    return floors;
  };

  const [roomData, setRoomData] = useState(generateFloors());
  const [selectedFloor, setSelectedFloor] = useState('3rd Floor');

  const [showModal, setShowModal] = useState(false);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(null);

  const handleRoomClick = (index) => {
    setCurrentRoomIndex(index);
    setShowModal(true);
  };

  const updateRoomStatus = (isAvailable) => {
    if (currentRoomIndex === null) return;

    setRoomData((prevData) => {
      const updatedFloor = [...prevData[selectedFloor]]; // now selectedFloor exists!
      if (updatedFloor[currentRoomIndex]) {
        updatedFloor[currentRoomIndex].available = isAvailable;
      }
      return {
        ...prevData,
        [selectedFloor]: updatedFloor,
      };
    });

    setShowModal(false);
    setCurrentRoomIndex(null);
  };

  return (
    <div className="room-availability-container">
      <h2>Room Update</h2>
      <p>Select a floor to update rooms:</p>

      <select
        className="floor-selector"
        value={selectedFloor}
        onChange={(e) => setSelectedFloor(e.target.value)}
      >
        {Object.keys(roomData).map((floor) => (
          <option key={floor} value={floor}>
            {floor}
          </option>
        ))}
      </select>

      <div className="floorplan-wrapper">
        <div className="parent">
          {Array.from({ length: 20 }, (_, index) => {
            if (index < 13) {
              const { room, available } = roomData[selectedFloor]?.[index] || {};
              return (
                <div
                  key={index}
                  className={`room-box ${available ? 'available' : 'occupied'} div${index + 1}`}
                  onClick={() => handleRoomClick(index)}
                  style={{ cursor: 'pointer' }}
                >
                  {room || `Room ${index + 1}`}
                </div>
              );
            } else if (index < 19) {
              return (
                <div key={index} className={`hallway div${index + 1}`}>
                  Hallway
                </div>
              );
            } else {
              return (
                <div key={index} className="stairs div20">
                  Stairs
                </div>
              );
            }
          })}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Room Status</h3>
            <p>Set the room to:</p>
            <div className="modal-buttons">
              <button className="available-btn" onClick={() => updateRoomStatus(true)}>
                Available
              </button>
              <button className="occupied-btn" onClick={() => updateRoomStatus(false)}>
                Occupied
              </button>
            </div>
            <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomUpdate;
