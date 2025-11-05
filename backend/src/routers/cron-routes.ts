import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { archiveOldRecords } from '../services/scheduled-services/check-for-archived.js';

/**
 * Optional Manual Archive Route
 * Allows admins to manually trigger the cold archive process
 */
export async function manualArchiveRoute(fastify: FastifyInstance) {
  fastify.post(
    '/admin/trigger-cold-archive',
    {
      // Add your authentication middleware here
      // preHandler: [fastify.authenticate, fastify.requireAdmin]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        fastify.log.info('Manual cold archive triggered by admin');

        const result = await archiveOldRecords(fastify);

        return reply.code(200).send({
          success: true,
          message: 'Cold archive completed successfully',
          data: {
            patientsArchived: result.patientsArchived,
            documentationsArchived: result.documentationsArchived,
            archiveFilePath: result.archiveFilePath,
            executionTime: result.executionTime
          }
        });
      } catch (error) {
        if (error instanceof Error) {
          fastify.log.error({
            error: error.message,
            stack: error.stack
          }, 'Manual cold archive failed');

          return reply.code(500).send({
            success: false,
            message: 'Failed to complete cold archive',
            error: error.message
          });
        }

        return reply.code(500).send({
          success: false,
          message: 'An unexpected error occurred'
        });
      }
    }
  );
}