import { type FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: ["http://127.0.0.1:5173"], 
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
    ],
  });
};

export default corsPlugin;
