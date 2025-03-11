import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FilmCard = ({ film }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/films/${film.id}`}>
        <div className="aspect-video w-full">
          <img
            src={film.thumbnail}
            alt={film.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div
          className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 to-transparent p-4 text-white transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-80'
          }`}
        >
          <h3 className="mb-1 text-lg font-semibold">{film.title}</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg
                className="mr-1 h-4 w-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{film.rating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{film.duration} min</span>
            <span>•</span>
            <span>${film.price.toFixed(2)}</span>
          </div>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2"
            >
              <p className="line-clamp-2 text-sm text-gray-300">
                {film.description}
              </p>
            </motion.div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

const FeaturedFilms = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedFilms = async () => {
      try {
        // Using the API service pattern from memories
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/films/featured`);
        const data = await response.json();
        setFilms(data);
      } catch (error) {
        console.error('Error fetching featured films:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedFilms();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="aspect-video animate-pulse rounded-lg bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gray-900 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Featured Films
          </h2>
          <Link
            to="/films"
            className="text-sm text-primary transition-colors hover:text-primary-light"
          >
            View All Films →
          </Link>
        </div>

        {/* Free Film of the Week */}
        {films.freeFilm && (
          <div className="mb-12">
            <div className="mb-4 flex items-center">
              <span className="mr-2 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                FREE THIS WEEK
              </span>
            </div>
            <FilmCard film={films.freeFilm} />
          </div>
        )}

        {/* Featured Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {films.featured?.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedFilms;
