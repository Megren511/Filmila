const Redis = require('ioredis');

class CachePolicyManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    
    // Default policies
    this.policies = {
      // Filmmaker-specific policies
      filmmaker: {
        overview: {
          ttl: 300,  // 5 minutes
          maxSize: 5000, // 5KB
          priority: 'high'
        },
        analytics: {
          ttl: 600,  // 10 minutes
          maxSize: 10000, // 10KB
          priority: 'medium'
        }
      },
      // Admin-specific policies
      admin: {
        overview: {
          ttl: 120,  // 2 minutes
          maxSize: 10000, // 10KB
          priority: 'highest'
        },
        analytics: {
          ttl: 300,  // 5 minutes
          maxSize: 20000, // 20KB
          priority: 'high'
        }
      },
      // Video-specific policies
      video: {
        trending: {
          ttl: 1800,  // 30 minutes
          maxSize: 50000, // 50KB
          priority: 'medium'
        },
        realtime: {
          ttl: 30,    // 30 seconds
          maxSize: 1000, // 1KB
          priority: 'highest'
        }
      }
    };

    // Initialize memory limits
    this.memoryLimits = {
      high: '512mb',
      medium: '256mb',
      low: '128mb'
    };
  }

  async shouldCache(type, data, userRole) {
    const policy = this.getPolicy(type, userRole);
    if (!policy) return true; // Default to caching if no policy exists

    // Check data size
    const dataSize = Buffer.from(JSON.stringify(data)).length;
    if (dataSize > policy.maxSize) {
      console.log(`Data size ${dataSize} exceeds policy limit ${policy.maxSize} for ${type}`);
      return false;
    }

    // Check memory usage
    const memoryUsage = await this.getMemoryUsage();
    const limit = this.getMemoryLimit(policy.priority);
    if (memoryUsage > limit) {
      console.log(`Memory usage ${memoryUsage} exceeds limit ${limit} for priority ${policy.priority}`);
      return false;
    }

    return true;
  }

  getPolicy(type, userRole) {
    if (userRole && this.policies[userRole]?.[type]) {
      return this.policies[userRole][type];
    }
    return this.policies.video?.[type];
  }

  async getTTL(type, userRole) {
    const policy = this.getPolicy(type, userRole);
    return policy?.ttl || 300; // Default 5 minutes
  }

  async getMemoryUsage() {
    const info = await this.redis.info('memory');
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  getMemoryLimit(priority) {
    switch (priority) {
      case 'highest':
        return parseInt(this.memoryLimits.high) * 1.2; // 20% more for highest priority
      case 'high':
        return parseInt(this.memoryLimits.high);
      case 'medium':
        return parseInt(this.memoryLimits.medium);
      default:
        return parseInt(this.memoryLimits.low);
    }
  }

  async updatePolicy(type, userRole, newPolicy) {
    if (!this.policies[userRole]) {
      this.policies[userRole] = {};
    }
    this.policies[userRole][type] = {
      ...this.policies[userRole][type],
      ...newPolicy
    };
  }

  async getPolicies() {
    return this.policies;
  }

  async getTypeStats(type) {
    const keys = await this.redis.keys(`dashboard:${type}:*`);
    const stats = {
      totalKeys: keys.length,
      totalSize: 0,
      avgTTL: 0
    };

    if (keys.length > 0) {
      const ttls = await Promise.all(keys.map(key => this.redis.ttl(key)));
      const sizes = await Promise.all(keys.map(key => this.redis.memory('usage', key)));
      
      stats.totalSize = sizes.reduce((sum, size) => sum + (size || 0), 0);
      stats.avgTTL = ttls.reduce((sum, ttl) => sum + (ttl > 0 ? ttl : 0), 0) / keys.length;
    }

    return stats;
  }

  async optimizePolicy(type) {
    const stats = await this.getTypeStats(type);
    const policy = this.getPolicy(type);
    
    if (!policy) return;

    // Adjust TTL based on access patterns
    if (stats.avgTTL < policy.ttl * 0.5) {
      // If items are being evicted before TTL, reduce TTL
      await this.updatePolicy(type, null, {
        ttl: Math.max(policy.ttl * 0.8, 60) // Never go below 1 minute
      });
    }

    // Adjust size limits based on actual usage
    const avgSize = stats.totalSize / stats.totalKeys;
    if (avgSize > policy.maxSize * 0.8) {
      // If we're close to size limit, increase it
      await this.updatePolicy(type, null, {
        maxSize: policy.maxSize * 1.2
      });
    }
  }
}

module.exports = new CachePolicyManager();
