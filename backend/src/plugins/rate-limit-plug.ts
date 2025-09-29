// plugins/rateLimit.ts
import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyPluginAsync } from "fastify";

/**
 * Rate Limit plugin (route-level)
 *
 * Features:
 * - Disabled globally (`global: false`).
 * - Can be enabled per route with `{ config: { rateLimit: { ... } } }`.
 * - Supports Redis for distributed limits (if you need horizontal scaling).
 *
 * Usage:
 *   await app.register(rateLimitPlugin);
 *
 *   app.get("/limited", {
 *     config: {
 *       rateLimit: {
 *         max: 10, // max requests
 *         timeWindow: "1 minute", // per time window
 *       },
 *     },
 *   }, async () => {
 *     return { msg: "This route is limited to 10 requests per minute." };
 *   });
 */
const rateLimitPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(rateLimit, {
    global: false, // required for route-level control
    // default fallback config (can be overridden per-route)
    max: 100,
    timeWindow: "1 minute",
    cache: 10000, // in-memory cache size (if not using Redis)
    allowList: [], // allowlist IPs if needed
    addHeaders: {
      // Useful headers for monitoring
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
  });
});

export default rateLimitPlugin;
