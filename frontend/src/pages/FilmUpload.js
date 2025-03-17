import React from 'react';
import { Helmet } from 'react-helmet-async';

const FilmUpload = () => {
  return (
    <>
      <Helmet>
        <title>Upload Your Film - Filmila</title>
      </Helmet>
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold text-white">Upload Your Film</h1>
          <div className="rounded-lg bg-gray-800 p-6">
            <div className="mb-6">
              <p className="text-gray-300">
                Share your creative work with our community. Your film will be stored securely on Amazon S3
                and delivered through CloudFront CDN for the best viewing experience.
              </p>
            </div>
            {/* Upload form will be implemented with S3 integration */}
            <div className="rounded-lg border-2 border-dashed border-gray-600 p-8 text-center">
              <p className="text-gray-400">Upload form coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilmUpload;
