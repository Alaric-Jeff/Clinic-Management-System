import Fastify from 'fastify'
import dotenv from 'dotenv'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import prismaPlugin from './plugins/prisma-plug.js'
import sensiblePlug from '@fastify/sensible'
import cookiePlugin from '@fastify/cookie'
import fjwt from '@fastify/jwt'
import routeInit from './routers/routeInit.js'
import compressionPlugin from './plugins/compression-route-plug.js'
import rateLimitPlugin from './plugins/rate-limit-plug.js'
import mailerPlugin from './plugins/node-mailer-plug.js'
dotenv.config()

const server = Fastify({
    logger: true
}).withTypeProvider<TypeBoxTypeProvider>()

server.register(prismaPlugin);
server.register(sensiblePlug);
server.register(cookiePlugin);
server.register(fjwt, {
    secret: process.env.JWT_SECRET || 'Secret',
    sign: {
        iss: process.env.JWT_ISSUER || 'clinic-app',
        aud: process.env.JWT_AUDIENCE || 'clinic-users',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    },
    verify: {
        maxAge: process.env.JWT_MAX_AGE || '15m',
    },
});
server.register(rateLimitPlugin);
server.register(mailerPlugin);
server.register(compressionPlugin);
server.register(routeInit);


const port: number = Number(process.env.HTTP_PORT)? Number(process.env.HTTP_PORT) : 3000;
const host: string = process.env.HOST? String(process.env.HOST) : '127.0.0.1';

try{
    await server.listen({
        port: port,
        host: host
    })
    server.log.info(`Server is running on port: ${port}`)
}catch(err: unknown){
    server.log.info("Server failed to run")
    server.close();
    console.log(err)
}
