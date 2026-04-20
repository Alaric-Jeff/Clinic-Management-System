import { type FastifyPluginAsync } from 'fastify'
import cookie from '@fastify/cookie'

// Validate and transform environment variables
const getCookieConfig = () => {
  const secret = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_SECRET_COOKIE
    : process.env.DEVELOPMENT_SECRET_COOKIE

  if (!secret) {
    throw new Error('Cookie secret is not defined in environment variables')
  }

const isProd = process.env.NODE_ENV === 'production';

return {
  secret,
  hook: 'onRequest' as const,
  parseOptions: {
    path: '/',
    httpOnly: true,
    secure: isProd, // Must be true for SameSite: none
    sameSite: isProd ? ('none' as const) : ('lax' as const), // Use lax for local dev
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400000'),
  }
}
}

const cookiePlugin: FastifyPluginAsync = async (fastify) => {
  const config = getCookieConfig()
  await fastify.register(cookie, config)
}

export default cookiePlugin