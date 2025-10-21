
import type { FastifyInstance } from "fastify";

/**
 * Service: Get all audit logs across the system (bills, billed services, documents, patients)
 */
export async function getAllAuditLogs(fastify: FastifyInstance) {
  try {
    const [
      billAuditLogs,
      billedServiceAuditLogs,
      documentAuditLogs,
      patientAuditLogs,
    ] = await Promise.all([
      fastify.prisma.billAuditLog.findMany({
        select: {
          id: true,
          medicalBillId: true,
          action: true,
          fieldsChanged: true,
          previousData: true,
          newData: true,
          changedByName: true,
          changedByRole: true,
          createdAt: true,
        },
      }),
      fastify.prisma.billedServiceAuditLog.findMany({
        select: {
          id: true,
          medicalBillId: true,
          billedServiceId: true,
          action: true,
          fieldsChanged: true,
          previousData: true,
          newData: true,
          changedByName: true,
          changedByRole: true,
          createdAt: true,
        },
      }),
      fastify.prisma.documentAuditLog.findMany({
        select: {
          id: true,
          medicalDocumentationId: true,
          action: true,
          fieldsChanged: true,
          previousData: true,
          newData: true,
          changedByName: true,
          changedByRole: true,
          createdAt: true,
        },
      }),
      fastify.prisma.patientAuditLog.findMany({
        select: {
          id: true,
          patientId: true,
          action: true,
          fieldsChanged: true,
          previousData: true,
          newData: true,
          changedByName: true,
          changedByRole: true,
          createdAt: true,
        },
      }),
    ]);

    // Normalize into a unified structure
    const allLogs = [
      ...billAuditLogs.map((log) => ({
        id: log.id,
        sourceType: "bill" as const,
        referenceId: log.medicalBillId,
        action: log.action,
        fieldsChanged: log.fieldsChanged,
        previousData: log.previousData,
        newData: log.newData,
        changedByName: log.changedByName,
        changedByRole: log.changedByRole,
        createdAt: log.createdAt.toISOString(),
      })),
      ...billedServiceAuditLogs.map((log) => ({
        id: log.id,
        sourceType: "billed_service" as const,
        referenceId: log.billedServiceId,
        secondaryReferenceId: log.medicalBillId, // Include bill ID for context
        action: log.action,
        fieldsChanged: log.fieldsChanged,
        previousData: log.previousData,
        newData: log.newData,
        changedByName: log.changedByName,
        changedByRole: log.changedByRole,
        createdAt: log.createdAt.toISOString(),
      })),
      ...documentAuditLogs.map((log) => ({
        id: log.id,
        sourceType: "document" as const,
        referenceId: log.medicalDocumentationId,
        action: log.action,
        fieldsChanged: log.fieldsChanged,
        previousData: log.previousData,
        newData: log.newData,
        changedByName: log.changedByName,
        changedByRole: log.changedByRole,
        createdAt: log.createdAt.toISOString(),
      })),
      ...patientAuditLogs.map((log) => ({
        id: log.id,
        sourceType: "patient" as const,
        referenceId: log.patientId,
        action: log.action,
        fieldsChanged: log.fieldsChanged,
        previousData: log.previousData,
        newData: log.newData,
        changedByName: log.changedByName,
        changedByRole: log.changedByRole,
        createdAt: log.createdAt.toISOString(),
      })),
    ];

    // Sort newest first
    allLogs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    fastify.log.info(
      { totalLogs: allLogs.length },
      "All audit logs retrieved successfully"
    );

    return {
      success: true,
      message: "All audit logs retrieved successfully",
      data: allLogs,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        { error: err.message, operation: "getAllAuditLogs" },
        "Failed to retrieve audit logs"
      );
    } else {
      fastify.log.error(
        { error: err, operation: "getAllAuditLogs" },
        "Failed to retrieve audit logs with unknown error"
      );
    }

    throw err; // Rethrow so controller can handle it properly
  }
}