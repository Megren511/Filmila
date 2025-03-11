import axios from 'axios';
import { API_BASE_URL } from '../config';

class SearchService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true
    });
  }

  // Get search suggestions
  async getSearchSuggestions(query) {
    try {
      const response = await this.api.get('/search/suggestions', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  // Perform full search
  async search({ query, type, genre, duration, year, page = 1, limit = 12 }) {
    try {
      const response = await this.api.get('/search', {
        params: {
          q: query,
          type,
          genre,
          duration,
          year,
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw this.handleError(error);
    }
  }

  // Get trending searches
  async getTrendingSearches() {
    try {
      const response = await this.api.get('/search/trending');
      return response.data;
    } catch (error) {
      console.error('Trending searches error:', error);
      return [];
    }
  }

  // Get search history (for authenticated users)
  async getSearchHistory() {
    try {
      const response = await this.api.get('/search/history');
      return response.data;
    } catch (error) {
      console.error('Search history error:', error);
      return [];
    }
  }

  // Clear search history
  async clearSearchHistory() {
    try {
      await this.api.delete('/search/history');
      return true;
    } catch (error) {
      console.error('Clear search history error:', error);
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data.error || 'Search failed',
        status: error.response.status
      };
    }
    return {
      message: 'Network error occurred',
      status: 500
    };
  }
}

// Create singleton instance
const searchService = new SearchService();

export { searchService };
