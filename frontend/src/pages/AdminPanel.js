import React from 'react';
import { Helmet } from 'react-helmet-async';

const AdminPanel = () => {
  return (
    <>
      <Helmet>
        <title>Admin Panel - Filmila</title>
      </Helmet>
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-3xl font-bold text-white">Admin Panel</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">User Management</h2>
              <p className="text-gray-300">Manage user accounts and permissions</p>
            </div>
            <div className="rounded-lg bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Content Moderation</h2>
              <p className="text-gray-300">Review and moderate uploaded content</p>
            </div>
            <div className="rounded-lg bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Analytics</h2>
              <p className="text-gray-300">View platform statistics and metrics</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
