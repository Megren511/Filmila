import React from 'react';
import { Helmet } from 'react-helmet-async';

const Profile = () => {
  return (
    <>
      <Helmet>
        <title>Profile - Filmila</title>
      </Helmet>
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold text-white">Profile</h1>
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-700">
                  {/* Profile image placeholder */}
                  <div className="h-full w-full bg-gray-600"></div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">User Name</h2>
                  <p className="text-gray-400">Joined 2025</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-medium text-white">About</h3>
                <p className="text-gray-300">Tell us about yourself...</p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-white">My Films</h3>
                <p className="text-gray-300">No films uploaded yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
