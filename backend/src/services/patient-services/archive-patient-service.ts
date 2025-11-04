import type { Role } from "@prisma/client";
import type { FastifyInstance } from "fastify";

/**
 * Service: Archives a patient record
 * 
 * Responsibilities:
 *  - Verifies patient existence before archival
 *  - Updates isArchived flag to true
 *  - Handles idempotent operations (already archived patients)
 *  - Provides detailed logging for audit trail
 * 
 * Idempotent Design:
 *  - Multiple calls to archive the same patient have the same effect
 *  - Already archived patients are treated as successful operations
 * 
 * @param fastify - Fastify instance for database and logging
 * @param body - Object containing patient ID to archive
 * @returns boolean - Success status (true if archived or already archived)
 * @throws {Error} When patient is not found or database operation fails
 */
export async function archivePatientService(
  fastify: FastifyInstance, 
  body: { id: string, name: string, role: Role }
): Promise<boolean> {
  const { id, name, role } = body;

  fastify.log.debug(
    { patientId: id, operation: 'archivePatientService' },
    "Starting patient archival service"
  );

  try {

    const patient = await fastify.prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        isArchived: true 
      }
    });

    if (!patient) {
      fastify.log.warn(
        { patientId: id, operation: 'archivePatientService' },
        "Patient not found during archival attempt - invalid ID provided"
      );
      throw new Error("Patient not found");
    }

    if (patient.isArchived) {
      fastify.log.info(
        { patientId: id, operation: 'archivePatientService' },
        "Patient already archived - idempotent operation completed successfully"
      );
      return true; 
    }

    await fastify.prisma.patient.update({
      where: { id },
      data: {
        isArchived: true,
        updatedAt: new Date() 
      }
    });

    await fastify.prisma.patientAuditLog.create({
      data: {
        patientId: id,
        action: 'updated',
        fieldsChanged: 'isArchived',
        previousData: 'false',
        newData: 'true',
        changedByName: name,
        changedByRole: role
      }
    })

    fastify.log.info(
      { patientId: id, operation: 'archivePatientService' },
      "Patient successfully archived"
    );

    return true;

  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        { 
          err: err.message, 
          patientId: id, 
          operation: 'archivePatientService',
          errorType: 'KnownError'
        },
        "Patient archival service failed - known error occurred"
      );
      
      if (err.message.includes('Patient not found')) {
        throw err; 
      }
      
      throw new Error(`Failed to archive patient: ${err.message}`);
    } else {
      fastify.log.error(
        { 
          err, 
          patientId: id, 
          operation: 'archivePatientService',
          errorType: 'UnknownError'
        },
        "Patient archival service failed - unknown error type encountered"
      );
      throw new Error("Unexpected error during patient archival");
    }
  }
}