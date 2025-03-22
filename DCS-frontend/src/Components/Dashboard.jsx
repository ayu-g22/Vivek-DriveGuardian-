import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import Challan from './Challan';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const redirectToLogin = () => navigate('/');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please login first.');
      setLoading(false);
      return;
    }

    axios.get('http://localhost:4000/api/auth', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((response) => {
      setDashboardData(response.data);
      setLoading(false);
    })
    .catch(() => {
      setError('You are not authorized to access this page');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <ClipLoader color={'#3498db'} size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
        <p className="text-lg font-semibold text-gray-700 mb-4">{error}</p>
        <button 
          onClick={redirectToLogin}
          className="bg-red-500 text-white py-2 px-6 rounded-lg text-sm sm:text-base hover:bg-red-600 transition"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 p-4 sm:p-6 lg:p-8">
        <Challan />
      </main>
    </div>
  );
};

export default Dashboard;
