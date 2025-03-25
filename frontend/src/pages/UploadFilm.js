import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './UploadFilm.css';

const GENRES = [
  'Action', 'Comedy', 'Drama', 'Documentary', 'Horror',
  'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Other'
];

function UploadFilm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    price: '',
    tags: ''
  });
  const [files, setFiles] = useState({
    film: null,
    poster: null
  });
  const [previews, setPreviews] = useState({
    poster: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    if (uploadedFiles.length > 0) {
      setFiles(prev => ({
        ...prev,
        [name]: uploadedFiles[0]
      }));

      // Create preview for poster
      if (name === 'poster') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({
            ...prev,
            poster: reader.result
          }));
        };
        reader.readAsDataURL(uploadedFiles[0]);
      }
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.genre) return 'Please select a genre';
    if (!formData.price || isNaN(formData.price)) return 'Please enter a valid price';
    if (!files.film) return 'Please upload your film';
    if (!files.poster) return 'Please upload a poster';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('genre', formData.genre);
      form.append('price', formData.price);
      form.append('tags', formData.tags);
      form.append('film', files.film);
      form.append('poster', files.poster);

      await apiService.post('/films/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Film uploaded successfully and pending approval');
      setTimeout(() => {
        navigate('/filmmaker-dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload film');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-film">
      <div className="upload-container">
        <h1>Upload Your Film</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Film Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter your film's title"
              maxLength="255"
              required
            />
          </div>

          <div className="form-group">
            <label>Description & Synopsis *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide a compelling description of your film"
              rows="4"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Genre *</label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Genre</option>
                {GENRES.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Price (USD) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="2.99"
                step="0.01"
                min="0.99"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tags (Optional)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Upload Film File *</label>
              <div className="file-upload">
                <input
                  type="file"
                  name="film"
                  onChange={handleFileChange}
                  accept="video/*"
                  required
                />
                <p className="file-info">Maximum size: 500MB</p>
              </div>
            </div>

            <div className="form-group">
              <label>Upload Poster *</label>
              <div className="file-upload">
                <input
                  type="file"
                  name="poster"
                  onChange={handleFileChange}
                  accept="image/*"
                  required
                />
                {previews.poster && (
                  <img
                    src={previews.poster}
                    alt="Poster preview"
                    className="poster-preview"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/filmmaker-dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadFilm;
