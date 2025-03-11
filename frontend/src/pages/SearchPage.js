import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { searchService } from '../services/search.service';
import SearchBar from '../components/search/SearchBar';
import { FILM_CATEGORIES } from '../config';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    genre: searchParams.get('genre') || 'all',
    duration: searchParams.get('duration') || 'all',
    year: searchParams.get('year') || 'all'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, filters, page]);

  const performSearch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const searchFilters = {
        ...filters,
        page,
        limit: 12
      };

      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key] === 'all') {
          delete searchFilters[key];
        }
      });

      const response = await searchService.search({
        query,
        ...searchFilters
      });

      if (page === 1) {
        setResults(response.results);
      } else {
        setResults(prev => [...prev, ...response.results]);
      }

      setHasMore(response.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    setSearchParams({
      ...Object.fromEntries(searchParams),
      [key]: value
    });
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <>
      <Helmet>
        <title>{query ? `Search results for "${query}"` : 'Search'} | Filmila</title>
        <meta
          name="description"
          content={`Search results for "${query}" on Filmila. Find and watch amazing short films.`}
        />
      </Helmet>

      <div className="min-h-screen bg-gray-900 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar />
          </div>

          {query && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">
                Search results for "{query}"
              </h1>
              <p className="mt-2 text-gray-400">
                {results.length} results found
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="rounded-lg bg-gray-800 px-4 py-2 text-white"
            >
              <option value="all">All Types</option>
              <option value="film">Films</option>
              <option value="filmmaker">Filmmakers</option>
            </select>

            {/* Genre Filter */}
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="rounded-lg bg-gray-800 px-4 py-2 text-white"
            >
              <option value="all">All Genres</option>
              {FILM_CATEGORIES.map(genre => (
                <option key={genre} value={genre.toLowerCase()}>
                  {genre}
                </option>
              ))}
            </select>

            {/* Duration Filter */}
            <select
              value={filters.duration}
              onChange={(e) => handleFilterChange('duration', e.target.value)}
              className="rounded-lg bg-gray-800 px-4 py-2 text-white"
            >
              <option value="all">Any Duration</option>
              <option value="short">Under 15 mins</option>
              <option value="medium">15-30 mins</option>
              <option value="long">Over 30 mins</option>
            </select>

            {/* Year Filter */}
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="rounded-lg bg-gray-800 px-4 py-2 text-white"
            >
              <option value="all">Any Year</option>
              {Array.from({ length: 5 }, (_, i) => 
                new Date().getFullYear() - i
              ).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {results.map((result) => (
                <motion.div
                  key={`${result.type}-${result.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="overflow-hidden rounded-lg bg-gray-800"
                >
                  {result.type === 'film' ? (
                    <div className="group relative">
                      <div className="aspect-w-16 aspect-h-9">
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-white">
                          {result.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">
                          {result.duration}min • {result.year} • {result.rating}★
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-gray-300">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-center">
                        <img
                          src={result.avatar}
                          alt={result.name}
                          className="h-12 w-12 rounded-full"
                        />
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-white">
                            {result.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {result.filmsCount} films • {result.followers} followers
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="rounded-lg bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-8 rounded-lg bg-red-900 p-4 text-white">
              {error}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query && results.length === 0 && (
            <div className="mt-8 text-center text-gray-400">
              <p className="text-lg">No results found for "{query}"</p>
              <p className="mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;
