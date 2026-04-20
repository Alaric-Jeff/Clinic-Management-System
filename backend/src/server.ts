import { buildApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  try {
    const server = await buildApp();

    const port = Number(process.env.PORT) || Number(process.env.HTTP_PORT) || 3000;
    const host = String(process.env.HOST || '0.0.0.0');

    await server.listen({ port, host });
    server.log.info(`🚀 Server running on ${host}:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

startServer();