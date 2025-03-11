const Redis = require('ioredis');
const { promisify } = require('util');
const cacheOptimizer = require('./cacheOptimizer');
const policyManager = require('./cachePolicyManager');

class CacheManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    
    // Default TTL values (in seconds) - now managed by policy manager
    this.TTL = {
      OVERVIEW: 300,      // 5 minutes
      TRENDING: 600,      // 10 minutes
      REALTIME: 30,      // 30 seconds
      TIMELINE: 1800,     // 30 minutes
      DEMOGRAPHICS: 3600  // 1 hour
    };

    // Initialize cache warming
    this.initCacheWarming();
    
    // Initialize policy optimization
    this.initPolicyOptimization();
  }

  async initCacheWarming() {
    // Warm cache every 5 minutes for frequently accessed data
    setInterval(async () => {
      const keys = await this.redis.keys('dashboard:video:*');
      for (const key of keys) {
        const videoId = key.split(':')[2];
        await cacheOptimizer.warmCache(videoId);
      }
    }, 5 * 60 * 1000);
  }

  async initPolicyOptimization() {
    // Optimize policies every hour
    setInterval(async () => {
      const types = ['overview', 'trending', 'realtime', 'timeline', 'demographics'];
      for (const type of types) {
        await policyManager.optimizePolicy(type);
      }
    }, 60 * 60 * 1000);
  }

  generateKey(type, params) {
    const { userId, videoId, timeframe } = params;
    switch (type) {
      case 'overview':
        return `dashboard:overview:${userId}:${timeframe || '24h'}`;
      case 'trending':
        return `dashboard:trending:${userId}:${timeframe || '24h'}`;
      case 'realtime':
        return `dashboard:realtime:${videoId}`;
      case 'timeline':
        return `dashboard:timeline:${videoId}:${timeframe || '24h'}`;
      case 'demographics':
        return `dashboard:demographics:${videoId}`;
      default:
        throw new Error('Invalid cache type');
    }
  }

  async get(type, params) {
    const key = this.generateKey(type, params);
    const cachedData = await this.redis.get(key);
    
    if (!cachedData) return null;

    try {
      const { data: storedData, compressed } = JSON.parse(cachedData);
      return await cacheOptimizer.decompress(storedData, compressed);
    } catch (error) {
      console.error('Cache decompression error:', error);
      return null;
    }
  }

  async set(type, params, data, userRole) {
    // Check caching policy before setting
    const shouldCache = await policyManager.shouldCache(type, data, userRole);
    if (!shouldCache) {
      console.log(`Skipping cache for ${type} due to policy restrictions`);
      return;
    }

    const key = this.generateKey(type, params);
    try {
      const compressed = await cacheOptimizer.compress(data);
      const ttl = await policyManager.getTTL(type, userRole);
      
      await this.redis.setex(
        key,
        ttl,
        JSON.stringify(compressed)
      );
    } catch (error) {
      console.error('Cache compression error:', error);
    }
  }

  async invalidate(type, params) {
    const key = this.generateKey(type, params);
    await this.redis.del(key);
  }

  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  async invalidateUserCache(userId) {
    await this.invalidatePattern(`dashboard:*:${userId}:*`);
  }

  async invalidateVideoCache(videoId) {
    await this.invalidatePattern(`dashboard:*:${videoId}:*`);
  }

  async getMetrics() {
    const metrics = await cacheOptimizer.monitorPerformance();
    const policies = await policyManager.getPolicies();
    
    return {
      ...metrics,
      policies,
      policyStats: {
        overview: await policyManager.getTypeStats('overview'),
        trending: await policyManager.getTypeStats('trending'),
        realtime: await policyManager.getTypeStats('realtime')
      }
    };
  }
}

module.exports = new CacheManager();
