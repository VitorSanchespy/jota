const Redis = require('ioredis');

class RedisService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis conectado com sucesso');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Erro na conexão Redis:', err);
    });
  }

  async get(key) {
    try {
      const result = await this.redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Erro ao buscar do Redis:', error);
      return null;
    }
  }

  async set(key, value, expireInSeconds = 3600) {
    try {
      const stringValue = JSON.stringify(value);
      await this.redis.setex(key, expireInSeconds, stringValue);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no Redis:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Erro ao deletar do Redis:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Erro ao verificar existência no Redis:', error);
      return false;
    }
  }

  async flushAll() {
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Erro ao limpar Redis:', error);
      return false;
    }
  }

  // Cache para consultas de processos
  async getCachedProcesses(userId, filters = {}) {
    const cacheKey = `processes:${userId}:${JSON.stringify(filters)}`;
    return await this.get(cacheKey);
  }

  async setCachedProcesses(userId, filters = {}, data) {
    const cacheKey = `processes:${userId}:${JSON.stringify(filters)}`;
    return await this.set(cacheKey, data, 300); // 5 minutos
  }

  // Cache para dados do usuário
  async getCachedUser(userId) {
    return await this.get(`user:${userId}`);
  }

  async setCachedUser(userId, userData) {
    return await this.set(`user:${userId}`, userData, 1800); // 30 minutos
  }

  // Cache para estatísticas do dashboard
  async getCachedDashboardStats(userId) {
    return await this.get(`dashboard:${userId}`);
  }

  async setCachedDashboardStats(userId, stats) {
    return await this.set(`dashboard:${userId}`, stats, 600); // 10 minutos
  }

  // Invalidar cache relacionado a um usuário
  async invalidateUserCache(userId) {
    const pattern = `*${userId}*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

module.exports = new RedisService();