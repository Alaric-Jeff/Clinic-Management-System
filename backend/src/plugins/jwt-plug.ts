  import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
  import fjwt from '@fastify/jwt'

  const jwtPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.register(fjwt, {
      secret: process.env.JWT_SECRET!,
      sign: {
        iss: 'your-app-name',
        aud: 'your-app-audience',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      },
      verify: {
        maxAge: process.env.JWT_MAX_AGE || '15m'
      },
      cookie: {
        cookieName: 'token',
        signed: true
      }
    })

    fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    })
  }

  export default jwtPlugin