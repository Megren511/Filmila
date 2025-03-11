const Redis = require('ioredis');
const zlib = require('zlib');
const { promisify } = require('util');
const cacheManager = require('./cacheManager');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class CacheOptimizer {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.compressionThreshold = 1024; // Compress data larger than 1KB
    this.warmupPatterns = [
      'dashboard:overview:*:24h',
      'dashboard:trending:*:24h',
      'dashboard:demographics:*'
    ];
  }

  async compress(data) {
    const stringData = JSON.stringify(data);
    if (stringData.length < this.compressionThreshold) {
      return { data: stringData, compressed: false };
    }
    const compressed = await gzip(stringData);
    return { data: compressed, compressed: true };
  }

  async decompress(data, isCompressed) {
    if (!isCompressed) return JSON.parse(data);
    const decompressed = await gunzip(data);
    return JSON.parse(decompressed.toString());
  }

  async warmCache(videoId) {
    try {
      const queries = [
        { type: 'overview', params: { timeframe: '24h' } },
        { type: 'trending', params: { timeframe: '24h' } },
        { type: 'realtime', params: { videoId } },
        { type: 'timeline', params: { videoId, timeframe: '24h' } },
        { type: 'demographics', params: { videoId } }
      ];

      await Promise.all(queries.map(async ({ type, params }) => {
        const key = cacheManager.generateKey(type, params);
        const exists = await this.redis.exists(key);
        if (!exists) {
          // Fetch and cache data
          const data = await this.fetchData(type, params);
          if (data) {
            await cacheManager.set(type, params, data);
          }
        }
      }));
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  async getMetrics() {
    const info = await this.redis.info();
    const metrics = {
      hitRate: 0,
      missRate: 0,
      memoryUsage: 0,
      totalKeys: 0,
      compressionRatio: 0,
      keysByType: {}
    };

    // Parse Redis INFO
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.includes('keyspace_hits')) {
        metrics.hits = parseInt(line.split(':')[1]);
      }
      if (line.includes('keyspace_misses')) {
        metrics.misses = parseInt(line.split(':')[1]);
      }
      if (line.includes('used_memory_human')) {
        metrics.memoryUsage = line.split(':')[1];
      }
    }

    // Calculate hit/miss rates
    const total = metrics.hits + metrics.misses;
    metrics.hitRate = total ? (metrics.hits / total) * 100 : 0;
    metrics.missRate = total ? (metrics.misses / total) * 100 : 0;

    // Get keys by type
    const keys = await this.redis.keys('dashboard:*');
    metrics.totalKeys = keys.length;
    
    const typeCount = {};
    for (const key of keys) {
      const type = key.split(':')[1];
      typeCount[type] = (typeCount[type] || 0) + 1;
    }
    metrics.keysByType = typeCount;

    return metrics;
  }

  async monitorPerformance() {
    const startTime = process.hrtime();
    const metrics = await this.getMetrics();
    const [seconds, nanoseconds] = process.hrtime(startTime);
    metrics.latency = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds

    return metrics;
  }

  async fetchData(type, params) {
    // Implementation would depend on your data access layer
    // This is a placeholder for the actual data fetching logic
    return null;
  }
}

module.exports = new CacheOptimizer();
