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

  return {
    secret,
    hook: 'onRequest' as const,
    parseOptions: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
      maxAge: parseInt(process.env.COOKIE_MAX_AGE || '86400000')
    }
  }
}

const cookiePlugin: FastifyPluginAsync = async (fastify) => {
  const config = getCookieConfig()
  fastify.register(cookie, config)
}

export default cookiePlugin