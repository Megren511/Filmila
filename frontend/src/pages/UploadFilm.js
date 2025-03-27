import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './UploadFilm.css';

const GENRES = ['Drama', 'Comedy', 'Action', 'Thriller', 'Horror', 'Documentary'];
const MAX_PRICE = 20;

function UploadFilm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    synopsis: '',
    genre: '',
    price: ''
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
    if (name === 'price') {
      // Ensure price is not above MAX_PRICE
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > MAX_PRICE) {
        return;
      }
    }
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
    if (!formData.synopsis.trim()) return 'Synopsis is required';
    if (!formData.genre) return 'Please select a genre';
    if (!formData.price || isNaN(formData.price)) return 'Please enter a valid price';
    if (parseFloat(formData.price) > MAX_PRICE) return `Maximum price is $${MAX_PRICE}`;
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
      form.append('synopsis', formData.synopsis);
      form.append('genre', formData.genre);
      form.append('price', formData.price);
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
    } catch (error) {
      setError(error.response?.data?.message || 'Error uploading film');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-film">
      <h1>Upload Short Film</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Film Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter film title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="poster">Upload Poster</label>
          <input
            type="file"
            id="poster"
            name="poster"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          {previews.poster && (
            <div className="poster-preview">
              <img src={previews.poster} alt="Poster preview" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="film">Upload Film File</label>
          <input
            type="file"
            id="film"
            name="film"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of your film"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="synopsis">Synopsis</label>
          <textarea
            id="synopsis"
            name="synopsis"
            value={formData.synopsis}
            onChange={handleInputChange}
            placeholder="Detailed synopsis of your film"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="genre">Genre</label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a genre</option>
            {GENRES.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price (Max $20)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="Enter price"
            min="0"
            max={MAX_PRICE}
            step="0.01"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadFilm;
