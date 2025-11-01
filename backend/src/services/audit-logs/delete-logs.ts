import type { FastifyInstance } from "fastify";

interface DeleteAuditLogsParams {
  logIds: string[];
}

interface DeletionSummary {
  billAuditLogs: number;
  billedServiceAuditLogs: number;
  documentAuditLogs: number;
  patientAuditLogs: number;
}

interface DeleteAuditLogsResult {
  deletedCount: number;
  deletionSummary: DeletionSummary;
}

/**
 * Service: Delete multiple audit logs across all audit log tables
 * 
 * This service searches across all four audit log tables:
 * - bill_audit_logs
 * - billed_service_audit_logs
 * - document_audit_logs
 * - patient_audit_logs
 * 
 * It returns only the essential data needed by the controller.
 * 
 * @param fastify - Fastify instance with Prisma client
 * @param params - Object containing array of log IDs to delete
 * @returns Object with deletion count and summary breakdown
 */
export async function deleteAuditLogs(
  fastify: FastifyInstance,
  params: DeleteAuditLogsParams
): Promise<DeleteAuditLogsResult> {
  const { logIds } = params;

  if (!logIds || logIds.length === 0) {
    throw new Error("No log IDs provided for deletion");
  }

  try {
    fastify.log.info(
      { logCount: logIds.length },
      "Service: Starting audit log deletion"
    );

    // Execute deletions in parallel across all audit log tables
    // Using Promise.allSettled ensures we attempt deletion from all tables
    // even if one fails, and we can report partial success
    const deletionResults = await Promise.allSettled([
      // Delete from bill_audit_logs
      fastify.prisma.billAuditLog.deleteMany({
        where: {
          id: {
            in: logIds,
          },
        },
      }),

      // Delete from billed_service_audit_logs
      fastify.prisma.billedServiceAuditLog.deleteMany({
        where: {
          id: {
            in: logIds,
          },
        },
      }),

      // Delete from document_audit_logs
      fastify.prisma.documentAuditLog.deleteMany({
        where: {
          id: {
            in: logIds,
          },
        },
      }),

      // Delete from patient_audit_logs
      fastify.prisma.patientAuditLog.deleteMany({
        where: {
          id: {
            in: logIds,
          },
        },
      }),
    ]);

    // Aggregate results from all deletion operations
    let totalDeleted = 0;
    const deletionSummary: DeletionSummary = {
      billAuditLogs: 0,
      billedServiceAuditLogs: 0,
      documentAuditLogs: 0,
      patientAuditLogs: 0,
    };

    // Process each deletion result
    deletionResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const count = result.value.count;
        totalDeleted += count;

        // Map index to corresponding audit log type
        switch (index) {
          case 0:
            deletionSummary.billAuditLogs = count;
            break;
          case 1:
            deletionSummary.billedServiceAuditLogs = count;
            break;
          case 2:
            deletionSummary.documentAuditLogs = count;
            break;
          case 3:
            deletionSummary.patientAuditLogs = count;
            break;
        }

        if (count > 0) {
          fastify.log.info(
            { tableIndex: index, deletedCount: count },
            "Successfully deleted logs from table"
          );
        }
      } else {
        // Log errors but don't fail the entire operation
        fastify.log.warn(
          { error: result.reason, tableIndex: index },
          "Failed to delete from one audit log table"
        );
      }
    });

    if (totalDeleted === 0) {
      fastify.log.warn(
        { requestedLogIds: logIds.length },
        "No audit logs were deleted - IDs may not exist in any table"
      );
    } else {
      fastify.log.info(
        {
          totalDeleted,
          deletionSummary,
          requestedCount: logIds.length,
        },
        "Service: Audit logs deletion completed"
      );
    }

    return {
      deletedCount: totalDeleted,
      deletionSummary,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        {
          error: err.message,
          stack: err.stack,
          operation: "deleteAuditLogs",
          logIdsCount: logIds.length,
        },
        "Service error: Failed to delete audit logs"
      );
    } else {
      fastify.log.error(
        {
          error: err,
          operation: "deleteAuditLogs",
          logIdsCount: logIds.length,
        },
        "Service error: Unknown error deleting audit logs"
      );
    }

    // Re-throw to be handled by controller
    throw err;
  }
}