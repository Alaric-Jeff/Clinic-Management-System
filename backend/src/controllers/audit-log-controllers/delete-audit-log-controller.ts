import type { FastifyRequest, FastifyReply } from "fastify";
import type { DeleteAuditLogsBodyType } from "../../type-schemas/audit-logs/delete-batch-id-schema.js";
import { deleteAuditLogs } from "../../services/audit-logs/delete-logs.js";

/**
 * Controller: Batch delete audit logs
 * Handles deletion of multiple audit logs across all audit log tables
 */
export async function batchDeleteAuditLogController(
  request: FastifyRequest<{ Body: DeleteAuditLogsBodyType }>,
  reply: FastifyReply
) {
  try {
    const { logIds } = request.body;

    // Validate input
    if (!logIds || logIds.length === 0) {
      return reply.code(400).send({
        success: false,
        message: "No log IDs provided for deletion",
        deletedCount: 0,
        deletionSummary: {
          billAuditLogs: 0,
          billedServiceAuditLogs: 0,
          documentAuditLogs: 0,
          patientAuditLogs: 0,
        },
      });
    }


    // Call service to delete logs
    const deletionResult = await deleteAuditLogs(request.server, {
      logIds,
    });

    // Check if any logs were deleted
    if (deletionResult.deletedCount === 0) {
      return reply.code(404).send({
        success: false,
        message: "No audit logs found with the provided IDs",
        deletedCount: 0,
        deletionSummary: deletionResult.deletionSummary,
      });
    }

    // Success response
    return reply.code(200).send({
      success: true,
      message: `Successfully deleted ${deletionResult.deletedCount} audit log(s)`,
      deletedCount: deletionResult.deletedCount,
      deletionSummary: deletionResult.deletionSummary,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      request.log.error(
        {
          error: err.message,
          stack: err.stack,
          body: request.body
        },
        "Controller error: Failed to delete audit logs"
      );

      throw request.server.httpErrors.internalServerError(
        "Failed to delete audit logs. Please try again."
      );
    }

    request.log.error(
      {
        error: err,
        body: request.body
      },
      "Controller error: Unknown error deleting audit logs"
    );

    throw request.server.httpErrors.internalServerError(
      "An unexpected error occurred while deleting audit logs"
    );
  }
}