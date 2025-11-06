import Fastify from 'fastify';
import dotenv from 'dotenv';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import prismaPlugin from './plugins/prisma-plug.js';
import sensiblePlug from '@fastify/sensible';
import cookiePlugin from '@fastify/cookie';
import fjwt from '@fastify/jwt';
import routeInit from './routers/routeInit.js';
import compressionPlugin from './plugins/compression-route-plug.js';
import rateLimitPlugin from './plugins/rate-limit-plug.js';
import mailerPlugin from './plugins/node-mailer-plug.js';
import { setupColdArchiveCron } from './hooks/cron-cold-archive.js';
import cors from '@fastify/cors';
import fs from 'fs';
import http from 'http';
import https from 'https';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const server = Fastify({
    logger: true,
    serverFactory: (handler) => {
        if (isProd) {
            const keyPath = process.env.HTTPS_KEY_PATH;
            const certPath = process.env.HTTPS_CERT_PATH;
            if (!keyPath || !certPath) {
                throw new Error('Missing HTTPS_KEY_PATH or HTTPS_CERT_PATH in production');
            }
            const options = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
            };
            return https.createServer(options, handler);
        }
        return http.createServer(handler);
    },
}).withTypeProvider<TypeBoxTypeProvider>();

async function startServer() {
  try {
    // Register plugins
    server.register(prismaPlugin);
    server.register(sensiblePlug);
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

    const port = Number(process.env.HTTP_PORT) || 3000;
    const host = String(process.env.HOST || '127.0.0.1');

    await server.listen({ port, host });
    server.log.info(`🚀 Server running on ${host}:${port}`);
  } catch (err) {
    server.log.error(err, 'Server failed to start');
    process.exit(1);
  }
}

startServer();
