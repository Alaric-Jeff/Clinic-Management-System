import Fastify from 'fastify'
import dotenv from 'dotenv'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import prismaPlugin from './plugins/prisma-plug.js'
import sensiblePlug from '@fastify/sensible'
dotenv.config()

const server = Fastify({
    logger: true
}).withTypeProvider<TypeBoxTypeProvider>()

server.register(prismaPlugin);
server.register(sensiblePlug);

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
}
    