import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import type { FastifyPluginAsync } from 'fastify'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : [],
})

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  try {
    await prisma.$connect()
    fastify.log.info('✅ Database connected')
  } catch (err: unknown) {
    fastify.log.error('❌ Failed to connect to the database:')
    process.exit(1)
  }

  fastify.decorate('prisma', prisma as any)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
    fastify.log.info('🛑 Database disconnected')
  })
}

export default fp(prismaPlugin, {
  name: 'prisma',
})