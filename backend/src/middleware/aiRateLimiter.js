const requestCounts = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export const aiRateLimiter = (req, res, next) => {
  const userId = req.user?._id?.toString() || req.ip;
  const now = Date.now();

  const entry = requestCounts.get(userId) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count += 1;
  requestCounts.set(userId, entry);

  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many AI requests. Please wait a minute and try again.',
    });
  }

  next();
};

export const validateContentSize = (req, res, next) => {
  const content = req.body?.content;
  if (content && typeof content === 'string' && content.length > 50000) {
    return res.status(400).json({
      message: 'Pasted content is too large. Maximum 50,000 characters allowed.',
    });
  }
  next();
};
