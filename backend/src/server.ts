import Fastify from 'fastify';
import dotenv from 'dotenv';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import prismaPlugin from './plugins/prisma-plug.js';
import sensiblePlug from '@fastify/sensible';
import cookiePlugin from './plugins/cookies-plug.js';
import fjwt from '@fastify/jwt';
import routeInit from './routers/routeInit.js';
import compressionPlugin from './plugins/compression-route-plug.js';
import rateLimitPlugin from './plugins/rate-limit-plug.js';
import mailerPlugin from './plugins/node-mailer-plug.js';
import { setupColdArchiveCron } from './hooks/cron-cold-archive.js';
import cors from '@fastify/cors';

dotenv.config();

// Standard Fastify initialization without manual SSL checks
const server = Fastify({
    logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

async function startServer() {
  try {
    // Register plugins
    server.register(prismaPlugin);
    server.register(sensiblePlug);
    
    // CORS configuration
    server.register(cors, {
      origin: [String(process.env.APP_ORIGIN)],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });
    
    server.register(cookiePlugin);
    server.register(fjwt, {
      secret: process.env.JWT_SECRET || 'Secret',
      sign: {
        iss: process.env.JWT_ISSUER || 'clinic-app',
        aud: process.env.JWT_AUDIENCE || 'clinic-users',
        expiresIn: process.env.JWT_EXPIRES_IN || '50m',
      },
      verify: {
        maxAge: process.env.JWT_MAX_AGE || '15m',
      },
    });
    
    server.register(rateLimitPlugin);
    server.register(mailerPlugin);
    server.register(compressionPlugin);
    server.register(routeInit);

    server.addHook('onReady', async () => {
      setupColdArchiveCron(server);
      server.log.info('Cron jobs initialized');
    });

    // Cloud platforms usually inject 'PORT', fallback to HTTP_PORT or 3000
    const port = Number(process.env.PORT) || Number(process.env.HTTP_PORT) || 3000;
    
    // Enforce 0.0.0.0 as the fallback host for cloud container accessibility
    const host = String(process.env.HOST || '0.0.0.0');

    await server.listen({ port, host });
    server.log.info(`🚀 Server running on ${host}:${port}`);
  } catch (err) {
    server.log.error(err, 'Server failed to start');
    process.exit(1);
  }
}

startServer();