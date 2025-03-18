import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Store email in localStorage to use it in the register page
    localStorage.setItem('tempEmail', email);
    navigate('/user-type');
  };

  return (
    <div className="home-container">
      <div className="overlay"></div>
      <div className="content">
        <h1 className="title">Filmila</h1>
        <p className="subtitle">Your gateway to independent cinema</p>
        
        <form onSubmit={handleSubmit} className="email-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to get started"
            required
            className="email-input"
          />
          <button type="submit" className="get-started-btn">
            Get Started
            <span className="arrow">→</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home;
