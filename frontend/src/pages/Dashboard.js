import React from 'react';
import { Helmet } from 'react-helmet-async';

const Dashboard = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard - Filmila</title>
      </Helmet>
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-3xl font-bold text-white">Dashboard</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Dashboard content will be implemented based on user role */}
            <div className="rounded-lg bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">My Films</h2>
              <p className="text-gray-300">Loading your films...</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
