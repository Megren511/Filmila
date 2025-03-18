import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <h1>Welcome to Filmila</h1>
      <p>Your personal video streaming platform</p>
      <div>
        <Link to="/login">Login</Link>
        <span> | </span>
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
}

export default Home;
