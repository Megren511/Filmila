import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { searchService } from '../../services/search.service';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setIsLoading(true);
        const results = await searchService.getSearchSuggestions(searchQuery);
        setSuggestions(results);
      } catch (error) {
        console.error('Search suggestion error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    // Clean up debounced function
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    // Handle clicks outside search component
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'film') {
      navigate(`/films/${suggestion.id}`);
    } else if (suggestion.type === 'filmmaker') {
      navigate(`/filmmaker/${suggestion.id}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion.title)}`);
    }
    setIsFocused(false);
    setSuggestions([]);
  };

  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="search"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          placeholder="Search films, filmmakers, or genres..."
          className="w-full rounded-lg bg-gray-800 px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className={`h-5 w-5 ${isLoading ? 'animate-spin text-primary' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isLoading ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            )}
          </svg>
        </div>
      </form>

      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-full rounded-lg bg-gray-800 py-2 shadow-xl"
          >
            {suggestions.map((suggestion) => (
              <motion.button
                key={`${suggestion.type}-${suggestion.id}`}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex w-full items-center px-4 py-2 text-left"
              >
                {suggestion.type === 'film' && (
                  <div className="mr-3 h-12 w-20 overflow-hidden rounded">
                    <img
                      src={suggestion.thumbnail}
                      alt={suggestion.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {suggestion.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {suggestion.type === 'film' && (
                      <>
                        {suggestion.duration}min • {suggestion.year} •{' '}
                        {suggestion.rating}★
                      </>
                    )}
                    {suggestion.type === 'filmmaker' && 'Filmmaker'}
                    {suggestion.type === 'genre' && 'Genre'}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
