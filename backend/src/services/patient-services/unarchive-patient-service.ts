import type { Role } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

/**
 * Service: Unarchives a patient record
 * 
 * Responsibilities:
 *  - Verifies patient existence and current archival status
 *  - Updates isArchived flag to false (activates patient)
 *  - Implements idempotent operation (no effect if already active)
 *  - Provides detailed audit logging for compliance
 * 
 * Idempotent Design:
 *  - Multiple calls to unarchive the same patient have the same effect
 *  - Already active patients are treated as successful operations
 *  - Prevents unnecessary database writes
 * 
 * Optimization Features:
 *  - Minimal data selection (only required fields)
 *  - Defensive existence checking before update
 *  - Early return for idempotent cases
 * 
 * @param fastify - Fastify instance for database and logging
 * @param body - Object containing patient ID to unarchive
 * @returns boolean - Success status (true if unarchived or already active)
 * @throws {Error} When patient is not found or database operation fails
 */
export async function unarchivePatientService(
  fastify: FastifyInstance, 
  body: { id: string, name: string, role: Role }
): Promise<boolean> {
  const { id, name, role } = body;

  // Log service invocation for audit trail and monitoring
  fastify.log.debug(
    { patientId: id, operation: 'unarchivePatientService' },
    "Initiating patient unarchival process"
  );

  try {
  
    const patient = await fastify.prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        isArchived: true   
      }
    });

    // Defensive programming: Validate patient existence
    if (!patient) {
      fastify.log.warn(
        { 
          patientId: id, 
          operation: 'unarchivePatientService',
          errorType: 'ValidationError',
          reason: 'patient_not_found'
        },
        "Unarchival failed - patient record does not exist"
      );
      throw new Error("Patient not found");
    }

    /**
     * Step 2: Idempotency Check
     * 
     * Prevents unnecessary database operations if patient is already active.
     * This optimization reduces database load and improves response time.
     */
    if (patient.isArchived === false) {
      fastify.log.info(
        { 
          patientId: id, 
          operation: 'unarchivePatientService',
          reason: 'already_active'
        },
        "Patient already active - idempotent operation completed successfully"
      );
      return true; // Consider successful due to idempotent design
    }

    /**
     * Step 3: Database Update
     * 
     * Performs the actual unarchival operation with timestamp update
     * for complete audit trail compliance.
     */
    await fastify.prisma.patient.update({
      where: { id },
      data: {
        isArchived: false,
        updatedAt: new Date(),
        archivedAt: null
      }
    });

    await fastify.prisma.patientAuditLog.create({
      data: {
        patientId: id,
        action: 'updated',
        fieldsChanged: 'isArchived',
        previousData: 'true',
        newData: 'false',
        changedByName: name,
        changedByRole: role
      }
    })

    fastify.log.info(
      { 
        patientId: id, 
        operation: 'unarchivePatientService',
        previousStatus: 'archived',
        newStatus: 'active'
      },
      "Patient successfully unarchived and activated"
    );

    return true;

  } catch (err: unknown) {
    /**
     * Comprehensive Error Handling
     * 
     * Distinguishes between business logic errors and system errors
     * Provides structured logging for debugging and monitoring
     * Preserves error context for appropriate HTTP response mapping
     */
    if (err instanceof Error) {
      // Enhanced error logging with operational context
      fastify.log.error(
        { 
          err: err.message, 
          patientId: id, 
          operation: 'unarchivePatientService',
          errorType: 'KnownError',
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        },
        "Patient unarchival service failed - known error occurred"
      );

      // Preserve business logic errors for proper HTTP status mapping
      if (err.message.includes("Patient not found")) {
        throw err; // Keep original error for 404 response
      }
      if (err.message.includes("already activated")) {
        throw err; // Keep original error for 409 conflict or 200 OK
      }

      // Wrap database/network errors with contextual information
      throw new Error(`Failed to unarchive patient: ${err.message}`);

    } else {
      // Handle unexpected error types (non-Error objects)
      fastify.log.error(
        { 
          err, 
          patientId: id, 
          operation: 'unarchivePatientService',
          errorType: 'UnknownError'
        },
        "Patient unarchival service failed - unknown error type encountered"
      );
      throw new Error("Unexpected system error during patient unarchival");
    }
  }
}