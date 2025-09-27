import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import type { FastifyPluginAsync } from 'fastify'

// Configuration interface
interface PrismaPluginOptions {
  maxConnectionRetries?: number
  retryDelay?: number
  enableLogging?: boolean
  timeout?: number
}

// Extend FastifyRequest interface to include queryTimeout
declare module 'fastify' {
  interface FastifyRequest {
    queryTimeout?: NodeJS.Timeout
  }
}

// Utility function to safely handle errors
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

// Retry utility function with proper error handling
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      // Create a proper Error instance if it's not already one
      if (error instanceof Error) {
        lastError = error
      } else {
        lastError = new Error(getErrorMessage(error))
      }
      
      if (attempt === maxRetries) break
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`)
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
    }
  }
  
  throw lastError || new Error('Unknown error occurred during retry operation')
}

const prismaPlugin: FastifyPluginAsync<PrismaPluginOptions> = async (fastify, options) => {
  const {
    maxConnectionRetries = 3,
    retryDelay = 2000,
    enableLogging = process.env.NODE_ENV === 'development',
    timeout = 30000
  } = options

  // Configure Prisma with production-ready settings
  const prisma = new PrismaClient({
    log: enableLogging ? ['query', 'error', 'warn', 'info'] : ['error', 'warn'],
    errorFormat: 'colorless',
    transactionOptions: {
      maxWait: timeout,
      timeout: timeout,
    },
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Connection with retry logic
  try {
    await retryOperation(
      async () => {
        await prisma.$connect()
        fastify.log.info('✅ Database connected successfully')
      },
      maxConnectionRetries,
      retryDelay
    )
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    
    fastify.log.error(`❌ Failed to connect to database after ${maxConnectionRetries} attempts: ${errorMessage}`)
    process.exit(1)
  }

  // Decorate fastify with prisma
  fastify.decorate('prisma', prisma)

  // Health check endpoint
  fastify.get('/health/database', async (_, reply) => {
    try {
      await retryOperation(
        async () => {
          await prisma.$queryRaw`SELECT 1`
        },
        2,
        500
      )
      
      return reply.send({ 
        status: 'ok', 
        database: 'connected',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      
      fastify.log.error(`Database health check failed: ${errorMessage}`)
      
      return reply.status(503).send({ 
        status: 'error', 
        database: 'disconnected',
        error: 'Database connection unhealthy',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      })
    }
  })

  // Graceful shutdown handler
  const gracefulShutdown = async (signal: string) => {
    fastify.log.info(`Received ${signal}, closing database connections...`)
    
    try {
      await prisma.$disconnect()
      fastify.log.info('🛑 Database connections closed gracefully')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      fastify.log.error(`Error during database disconnection: ${errorMessage}`)
    }
  }

  // Handle process signals
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

  // Fastify onClose hook
  fastify.addHook('onClose', async () => {
    fastify.log.info('🔄 Closing database connections...')
    try {
      await prisma.$disconnect()
      fastify.log.info('🛑 Database disconnected successfully')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      fastify.log.error(`Error disconnecting from database: ${errorMessage}`)
    }
  })

  // Add query timeout middleware
  fastify.addHook('onRequest', async (request, reply) => {
    // Set a timeout for database operations per request
    request.queryTimeout = setTimeout(() => {
      if (!reply.sent) {
        fastify.log.warn(`Query timeout for route: ${request.url}`)
      }
    }, timeout) as NodeJS.Timeout
  })

  fastify.addHook('onResponse', async (request) => {
    if (request.queryTimeout) {
      clearTimeout(request.queryTimeout as NodeJS.Timeout)
    }
  })
}

export default fp(prismaPlugin, {
  name: 'prisma',
  dependencies: []
})