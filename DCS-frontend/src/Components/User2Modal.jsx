import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const RequestHandler = () => {
  const [socket, setSocket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);
  const [shiftedFromUserName, setShiftedFromUserName] = useState('');

  useEffect(() => {
    const uid = localStorage.getItem('userid');

    const newSocket = io('http://localhost:4001', {
      query: { userId: uid },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('receiveRequest', async (data) => {
      setRequestDetails(data);
      setIsModalOpen(true);
      
      if (data.shiftedFrom) {
        await fetchUserName(data.shiftedFrom);
      }
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const fetchUserName = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:4000/api/users/${userId}`);
      if (response.data && response.data.name) {
        setShiftedFromUserName(`${response.data.name} (${response.data.phone})`);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  const handleAccept = () => {
    if (socket && requestDetails) {
      socket.emit('response', {
        recipientId: requestDetails.recipientId,
        shiftedFrom: requestDetails.shiftedFrom,
        isAccepted: true,
      });

      setIsModalOpen(false);
    }
  };

  const handleDecline = () => {
    if (socket && requestDetails) {
      socket.emit('response', {
        recipientId: requestDetails.recipientId,
        shiftedFrom: requestDetails.shiftedFrom,
        isAccepted: false,
      });

      setIsModalOpen(false);
    }
  };

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4 text-black text-center">Transfer Request</h2>
            <p className="mb-4 text-black text-center">
              You have received a transfer request from <strong>{shiftedFromUserName || `User ${requestDetails.shiftedFrom}`}</strong>.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={handleAccept}
                className="bg-green-500 text-white p-2 rounded w-full sm:w-auto"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="bg-red-500 text-white p-2 rounded w-full sm:w-auto"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestHandler;
