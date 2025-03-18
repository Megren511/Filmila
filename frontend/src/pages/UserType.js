import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserType.css';

function UserType() {
  const navigate = useNavigate();
  const email = localStorage.getItem('tempEmail');

  const handleUserTypeSelect = (type) => {
    navigate('/register', { state: { email, userType: type } });
  };

  return (
    <div className="user-type-container">
      <div className="overlay"></div>
      <div className="content">
        <h1 className="title">Choose Your Role</h1>
        <p className="subtitle">How would you like to use Filmila?</p>

        <div className="cards-container">
          <div 
            className="type-card filmmaker"
            onClick={() => handleUserTypeSelect('filmmaker')}
          >
            <div className="card-content">
              <h2>Filmmaker</h2>
              <p>Share your creative vision with the world</p>
              <ul>
                <li>Upload and manage your films</li>
                <li>Connect with your audience</li>
                <li>Track analytics and engagement</li>
                <li>Monetize your content</li>
              </ul>
              <button className="select-btn">Join as Filmmaker</button>
            </div>
          </div>

          <div 
            className="type-card viewer"
            onClick={() => handleUserTypeSelect('viewer')}
          >
            <div className="card-content">
              <h2>Viewer</h2>
              <p>Discover amazing independent films</p>
              <ul>
                <li>Watch exclusive content</li>
                <li>Support independent filmmakers</li>
                <li>Create personalized watchlists</li>
                <li>Join the community</li>
              </ul>
              <button className="select-btn">Join as Viewer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserType;
