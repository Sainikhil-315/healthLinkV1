const { createClient } = require('redis');
const logger = require('../utils/logger.js');
require('dotenv').config();

let redisClient = null;

async function connectRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit exceeded');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Error handler
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    // Connection handlers
    redisClient.on('connect', () => {
      logger.info('Redis Client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client ready');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis Client reconnecting...');
    });

    redisClient.on('end', () => {
      logger.warn('Redis Client connection closed');
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error.message);
    throw error;
  }
}

// Helper functions for common Redis operations
async function setCache(key, value, expirySeconds = 3600) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      logger.warn('Redis not connected, skipping cache set');
      return false;
    }

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setEx(key, expirySeconds, stringValue);
    return true;
  } catch (error) {
    logger.error('Redis setCache error:', error);
    return false;
  }
}

async function getCache(key) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    const value = await redisClient.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    logger.error('Redis getCache error:', error);
    return null;
  }
}

async function deleteCache(key) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      logger.warn('Redis not connected, skipping cache delete');
      return false;
    }

    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Redis deleteCache error:', error);
    return false;
  }
}

async function getCacheWithPattern(pattern) {
  try {
    if (!redisClient || !redisClient.isOpen) {
      logger.warn('Redis not connected, skipping pattern get');
      return [];
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return [];

    const values = await redisClient.mGet(keys);
    return values.map((val, idx) => ({
      key: keys[idx],
      value: val ? (typeof val === 'string' ? JSON.parse(val) : val) : null
    }));
  } catch (error) {
    logger.error('Redis getCacheWithPattern error:', error);
    return [];
  }
}

function getRedisClient() {
  return redisClient;
}

module.exports = {
  connectRedis,
  setCache,
  getCache,
  deleteCache,
  getCacheWithPattern,
  getRedisClient,
  redisClient
};
