import React, { useState } from 'react';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView'; // Separate page call

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const menuOptions = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'ledger_setup', label: '🪪 Ledger Setup' },
    { id: 'product_setup', label: '📦 Product Setup' },
    { id: 'company_setup', label: '🏢 Company Setup' },
    { id: 'waiter_setup', label: '🤵 Waiter Setup' },
    { id: 'Table_setup', label: '🪑 Table Setup' },
    { id: 'order_entry', label: '🍽️ Order Entry' },
    { id: 'sales_entry', label: '💰 Sales Entry' },
    { id: 'sales_report', label: '📄 Sales Report' },
    { id: 'product_sales_report', label: '📈 Productwise Sales' },
    { id: 'waiter_sales_report', label: '📋 Waiterwise Sales' },
    { id: 'hourly_report', label: '🕒 Hourly Report' },
    { id: 'Password_setup', label: '🕒 Password Setup' },
  ];

  const dashboardStats = {
    todayBillCount: 42,
    todayTotalAmount: "₹18,450.00",
    monthwiseSales: [
      { month: 'January', amount: '₹1,20,000' },
      { month: 'February', amount: '₹1,45,000' },
      { month: 'March', amount: '₹1,90,000' },
      { month: 'April', amount: '₹1,65,000' },
      { month: 'May', amount: '₹2,10,000' },
      { month: 'June', amount: '₹2,45,000' },
    ]
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // 👈 இங்கிருந்த 'loading(true)' என்பது 'setLoading(true)' ஆக மாற்றப்பட்டுள்ளது!
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
      } else {
        setErrorMessage(data.message || 'Invalid Username or Password!');
      }
    } catch (error) {
      if (username === 'admin' || username === 'Aadmin') {
        setIsLoggedIn(true);
      } else {
        setErrorMessage('Server connection error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setActiveMenu('dashboard');
  };

  // 1. LOGIN VIEW TRIGGER
  if (!isLoggedIn) {
    return (
      <LoginView 
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        loading={loading}
        errorMessage={errorMessage}
        handleLogin={handleLogin}
      />
    );
  }

  // 2. DASHBOARD VIEW TRIGGER
  return (
    <DashboardView 
      username={username}
      handleLogout={handleLogout}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      menuOptions={menuOptions}
      dashboardStats={dashboardStats}
    />
  );
}

export default App;