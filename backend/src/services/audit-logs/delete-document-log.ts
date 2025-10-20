import type {FastifyInstance} from 'fastify'
import type { deleteBatchIdType } from '../../type-schemas/audit-logs/delete-batch-id-schema.js'


export async function batchDeleteDocumentAudit(
  fastify: FastifyInstance,
  body: deleteBatchIdType
) {
  try {
    const ids = body.map((item) => item.id);

    await fastify.prisma.documentAuditLog.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    fastify.log.info({ deletedCount: ids.length }, 'Batch delete completed');

    return true;

  } catch (err: unknown) {
    fastify.log.error(err, 'Batch delete failed');
    throw err;
  }
}
