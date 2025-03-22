import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import DCSGauge from './Slider';
import Instructions from './Scoring';

const Challan = () => {
  const navigate = useNavigate();
  const [challanData, setChallanData] = useState([]);

  const fetchChallanData = async () => {
    try {
      const uid = localStorage.getItem('userid');
      const response = await fetch('http://localhost:4000/api/dashboard/challan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });

      const result = await response.json();
      if (result.ok) {
        const data = result.data.map(item => ({
          name: item.name,
          lastDrive: item['Last Drive'],
          challan: item.Challan,
          amount: item.Amount,
          dcsChange: item.DCS_Charge
        }));
        setChallanData(data);
        toast.success('Data fetched successfully!', { position: "top-center" });
      } else {
        toast.error(`Failed to fetch data: ${result.message}`, { position: "top-center" });
      }
    } catch (error) {
      toast.error(`Error fetching data: ${error.message}`, { position: "top-center" });
    }
  };

  useEffect(() => {
    fetchChallanData();
  }, []);

  const handlePayDuesClick = () => {
    navigate('/pay-dues');
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between p-4 sm:p-6 mt-10">
      <ToastContainer />

      {/* Left column for the table (Full width on mobile, 2/3 width on large screens) */}
      <div className="w-full lg:w-4/6 p-4 bg-white rounded-md shadow-md">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 text-center">Challan History</h1>
        
        {/* Table with Scrollable Container */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border border-gray-300 shadow-md rounded-md">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Last Drive</th>
                <th className="py-2 px-4 text-left">Challan</th>
                <th className="py-2 px-4 text-left">Amount</th>
                <th className="py-2 px-4 text-left">DCS Change</th>
              </tr>
            </thead>
            <tbody>
              {challanData.length > 0 ? (
                challanData.map((entry, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-4">{entry.name}</td>
                    <td className="py-2 px-4">{entry.lastDrive}</td>
                    <td className={`py-2 px-4 ${entry.challan ? 'text-red-500' : 'text-green-500'}`}>{entry.challan}</td>
                    <td className="py-2 px-4">{entry.amount > 0 ? `₹${entry.amount}` : '-'}</td>
                    <td className="py-2 px-4">{entry.dcsChange}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">No challan records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pay Dues Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handlePayDuesClick}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md transition duration-300"
          >
            Pay Dues
          </button>
        </div>
      </div>

      {/* Right column (DCS Gauge) - Full width on small screens, 1/3 width on large screens */}
      <div className="w-full lg:w-2/6 p-4 mt-10 lg:mt-0">
        <DCSGauge />
        <Instructions />
      </div>
    </div>
  );
};

export default Challan;
