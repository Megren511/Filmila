import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import './ViewerDashboard.css';

function ViewerDashboard() {
  const [films, setFilms] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [loading, setLoading] = useState(true);

  const genres = ['All', 'Drama', 'Comedy', 'Action', 'Thriller', 'Horror', 'Documentary'];

  useEffect(() => {
    loadFilms();
    loadFavorites();
  }, []);

  const loadFilms = async () => {
    try {
      const response = await apiService.get('/films/browse');
      setFilms(response.data);
    } catch (error) {
      console.error('Error loading films:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await apiService.get('/viewer/favorites');
      setFavorites(response.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (filmId) => {
    try {
      await apiService.post(`/viewer/favorites/${filmId}`);
      loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredFilms = films.filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         film.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || !selectedGenre || film.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="viewer-dashboard">
      <nav className="dashboard-nav">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search films..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="genre-select"
          >
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
        <div className="nav-links">
          <Link to="/watchlist" className="nav-link">My Watchlist</Link>
          <Link to="/purchase-history" className="nav-link">Purchase History</Link>
          <Link to="/profile-settings" className="nav-link">Profile Settings</Link>
        </div>
      </nav>

      <main className="dashboard-content">
        <section className="films-section">
          <h2>Browse Films</h2>
          {loading ? (
            <div className="loading">Loading films...</div>
          ) : (
            <div className="films-grid">
              {filteredFilms.map(film => (
                <div key={film.id} className="film-card">
                  <img src={film.posterUrl} alt={film.title} className="film-poster" />
                  <div className="film-info">
                    <h3>{film.title}</h3>
                    <p className="film-genre">{film.genre}</p>
                    <p className="film-price">${film.price}</p>
                    <div className="film-actions">
                      <Link to={`/watch/${film.id}`} className="btn-primary">Watch Now</Link>
                      <button 
                        onClick={() => toggleFavorite(film.id)}
                        className={`btn-favorite ${favorites.includes(film.id) ? 'active' : ''}`}
                      >
                        ♥
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="favorites-section">
          <h2>My Favorites</h2>
          <div className="favorites-grid">
            {favorites.map(filmId => {
              const film = films.find(f => f.id === filmId);
              return film ? (
                <div key={film.id} className="favorite-card">
                  <img src={film.posterUrl} alt={film.title} className="favorite-poster" />
                  <div className="favorite-info">
                    <h3>{film.title}</h3>
                    <Link to={`/watch/${film.id}`} className="btn-primary">Watch</Link>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default ViewerDashboard;
