// plugins/compression.ts
import fp from "fastify-plugin";
import compress from "@fastify/compress";
import type { FastifyPluginAsync } from "fastify";

/**
 * Compression plugin (route-level)
 *
 * Features:
 * - Disabled globally (`global: false`), so routes must opt in with `{ compress: true }`.
 * - Supports both Brotli (best compression) and Gzip (wider client support).
 * - Skips compressing responses smaller than 1 KB (`threshold: 1024`).
 * - Automatically bypasses already-compressed payloads (e.g. .zip, .png, .jpg).
 *
 * Usage:
 *   await app.register(compressionPlugin);
 *
 *   app.get("/big-json", { compress: true }, async () => {
 *     return { large: "Some big payload..." };
 *   });
 */
const compressionPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(compress, {
    global: false, // only compress when route explicitly sets { compress: true }
    threshold: 1024, // only compress responses >= 1KB
    encodings: ["br", "gzip"], // prefer Brotli, fallback to Gzip
    customTypes: /^application\/json|text\/|application\/xml/i, 
    inflateIfDeflated: true, // bypass if response is already compressed
  });
});

export default compressionPlugin;
