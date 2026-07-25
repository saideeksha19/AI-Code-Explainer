import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  timestamps: number[];
}

const limiterCache = new Map<string, RateLimitInfo>();

// Prune stale cache entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  for (const [ip, info] of limiterCache.entries()) {
    const validTimestamps = info.timestamps.filter(ts => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      limiterCache.delete(ip);
    } else {
      info.timestamps = validTimestamps;
    }
  }
}, 10 * 60 * 1000).unref(); // Prevent active interval from keeping the thread active during tests/rebuilds

/**
 * Creates a configurable sliding-window rate limiting middleware.
 */
export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP securely
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ipStr = Array.isArray(ip) ? ip[0] : (typeof ip === 'string' ? ip : 'unknown-ip');
    const now = Date.now();
    
    let info = limiterCache.get(ipStr);
    if (!info) {
      info = { timestamps: [] };
      limiterCache.set(ipStr, info);
    }
    
    // Filter out timestamps outside the active window
    info.timestamps = info.timestamps.filter(ts => now - ts < options.windowMs);
    
    if (info.timestamps.length >= options.max) {
      const oldestTimestamp = info.timestamps[0];
      const resetTime = oldestTimestamp + options.windowMs;
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);
      
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.setHeader('X-RateLimit-Limit', String(options.max));
      res.setHeader('X-RateLimit-Remaining', '0');
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: options.message,
        retryAfter: retryAfterSeconds
      });
    }
    
    info.timestamps.push(now);
    
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(options.max - info.timestamps.length));
    
    next();
  };
}
