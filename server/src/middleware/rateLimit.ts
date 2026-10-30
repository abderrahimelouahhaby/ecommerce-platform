import { rateLimit } from "express-rate-limit";

type RateLimiterOptions = {
  windowMs: number;
  limit: number;
  skip?: () => boolean;
};

export function createRateLimiter({ windowMs, limit, skip }: RateLimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    skip,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { message: "Too many requests, please try again later" } });
    },
  });
}
