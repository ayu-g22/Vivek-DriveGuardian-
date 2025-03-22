import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { io } from 'socket.io-client';
import 'react-toastify/dist/ReactToastify.css';

const Modal = ({ isOpen, onClose, options }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [socket, setSocket] = useState(null);
  const selectRef = useRef(null);

  useEffect(() => {
    const uid = localStorage.getItem('userid');
    const newSocket = io('http://localhost:4001', {
      query: { userId: uid },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    setSocket(newSocket);

    newSocket.on('receiveRequest', (data) => {
      const { shiftedFrom, recipientId, requestMessage } = data;
      handleIncomingRequest(shiftedFrom, recipientId, requestMessage);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const handleConfirmClick = async () => {
    if (selectedOption) {
      try {
        const shiftedFrom = localStorage.getItem('userid');
        const shiftedTo = selectedOption;
        const response = await fetch('http://localhost:4000/api/transfer/transfer-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shiftedFrom, shiftedTo }),
        });

        const result = await response.json();
        if (result.ok) {
          if (socket) {
            socket.emit('transfer', {
              recipientId: selectedOption,
              shiftedFrom,
              requestMessage: "Do you want to accept?",
            });
          }
          toast.success('Data updated successfully!', { position: 'top-center' });
        } else {
          toast.error(`Failed to update data: ${result.message}`, { position: 'top-center' });
        }
      } catch (error) {
        toast.error(`Error updating data: ${error.message}`, { position: 'top-center' });
      } finally {
        onClose();
      }
    } else {
      toast.warning('Please select an option!', { position: 'top-center' });
    }
  };

  const handleIncomingRequest = (shiftedFrom, recipientId, requestMessage) => {
    const isAccepted = window.confirm(`${requestMessage} from user ${shiftedFrom}.`);
    if (socket) {
      socket.emit('response', {
        recipientId,
        shiftedFrom,
        isAccepted,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-lg w-full relative overflow-visible">
        <h1 className="text-center text-xl font-bold mb-4 text-black">Transfer your keys</h1>
        <h2 className="text-md font-bold mb-4 text-black">Q1: Who is driving the car?</h2>

        <div className="relative">
          <select
            ref={selectRef}
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
            className="border p-2 rounded mb-4 w-full text-black bg-white relative z-50"
            style={{ position: 'relative' }}
          >
            <option value="">Select...</option>
            {options.map((option, index) => (
              <option key={index} value={option['_id']}>{option['name']} - {option['phoneNumber']}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-2">
          <button
            onClick={handleConfirmClick}
            className="bg-blue-500 text-white p-2 rounded w-full sm:w-auto"
          >
            Submit
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white p-2 rounded w-full sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
