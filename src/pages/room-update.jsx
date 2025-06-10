import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; // Firebase connection
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Firestore functions
import '../styles/room.css'; // Ensure your CSS is properly linked

const RoomUpdate = () => {
  const [roomData, setRoomData] = useState({});
  const [selectedFloor, setSelectedFloor] = useState('3rd Floor');
  const [showModal, setShowModal] = useState(false);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(null);

  // Function to fetch floors and rooms data from Firestore
  const fetchRoomData = async () => {
    const roomRef = doc(firestore, 'roomAvailability', 'floors');
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
      setRoomData(docSnap.data()); // Set data fetched from Firestore to state
    } else {
      console.log('No such document!');
    }
  };

  useEffect(() => {
    fetchRoomData(); // Fetch data when the component mounts
  }, []);

  // Function to update room status in Firestore
  const updateRoomStatus = async (isAvailable) => {
    if (currentRoomIndex === null) return;

    const roomRef = doc(firestore, 'roomAvailability', 'floors');
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
      const floors = docSnap.data();
      const updatedFloor = [...floors[selectedFloor]];

      // Update availability based on the clicked room
      updatedFloor[currentRoomIndex].available = isAvailable;

      // Update Firestore with the new room status
      await setDoc(doc(firestore, 'roomAvailability', 'floors'), {
        ...floors,
        [selectedFloor]: updatedFloor,
      });

      setRoomData((prevData) => ({
        ...prevData,
        [selectedFloor]: updatedFloor,
      }));
    } else {
      console.log('No such document!');
    }

    setShowModal(false);
    setCurrentRoomIndex(null);
  };

  // Handle Room Click
  const handleRoomClick = (index) => {
    setCurrentRoomIndex(index);
    setShowModal(true);
  };

  // Sorting the floor options from 3rd to 15th floor excluding 13th
  const sortedFloors = ['3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '14th', '15th'];

  return (
    <div className="room-availability-container">
      <h2>Room Update</h2>
      <p>Select a floor to update rooms:</p>

      <select
        className="floor-selector"
        value={selectedFloor}
        onChange={(e) => setSelectedFloor(e.target.value)}
      >
        {sortedFloors.map((floor) => (
          <option key={floor} value={`${floor} Floor`}>
            {`${floor} Floor`}
          </option>
        ))}
      </select>

      <div className="floorplan-wrapper">
        <div className="parent">
          {/* Render rooms */}
          {roomData[selectedFloor]?.map((room, index) => {
            if (index < 13) {
              return (
                <div
                  key={index}
                  className={`room-box ${room.available ? 'available' : 'occupied'} div${index + 1}`}
                  onClick={() => handleRoomClick(index)}
                  style={{ cursor: 'pointer' }}
                >
                  {room.room}
                </div>
              );
            }
            return null;
          })}

          {/* Render hallways */}
          {[14, 15, 16, 17, 18, 19].map((divNum) => (
            <div key={divNum} className={`hallway div${divNum}`}>
              Hallway
            </div>
          ))}

          {/* Render stairs */}
          <div className="stairs div20">
            Stairs
          </div>
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
            <button className="cancel-btn" onClick={() => setShowModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomUpdate;
