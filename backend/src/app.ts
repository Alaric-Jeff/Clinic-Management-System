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

let app: ReturnType<typeof Fastify> | null = null;

export async function buildApp() {
  if (app) return app;

  const server = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

  await server.register(prismaPlugin);
  await server.register(sensiblePlug);

  await server.register(cors, {
    origin: [String(process.env.APP_ORIGIN)],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  await server.register(cookiePlugin);
  await server.register(fjwt, {
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

  await server.register(rateLimitPlugin);
  await server.register(mailerPlugin);
  await server.register(compressionPlugin);
  await server.register(routeInit);

  server.addHook('onReady', async () => {
    setupColdArchiveCron(server);
    server.log.info('Cron jobs initialized');
  });

  await server.ready();
  app = server;
  return server;
}