import type { FastifyInstance } from "fastify";

/**
 * Service: Retrieves a single patient with lightweight medical documentation preview
 * 
 * Responsibilities:
 *  - Fetches comprehensive patient details for profile view
 *  - Includes minimal medical documentation data for table preview (excludes heavy text fields)
 *  - Provides staff attribution for audit trail
 *  - Handles patient not found and database errors gracefully
 * 
 * Performance Optimizations:
 *  - Limits medical documentation to 10 most recent records
 *  - Excludes large text fields (subjective, objective, assessment, prescription)
 *  - Uses selective field loading to minimize data transfer
 * 
 * @param fastify - Fastify instance for database and logging
 * @param body - Object containing patient ID to retrieve
 * @returns Patient object with basic info and documentation preview
 * @throws {Error} When patient is not found or database operation fails
 */
export async function getOnePatientService(
  fastify: FastifyInstance, 
  body: { id: string }
) {
  const { id } = body;

  fastify.log.debug(
    { patientId: id, operation: 'getOnePatientService' },
    "Starting patient retrieval service"
  );

  try {
    const patient = await fastify.prisma.patient.findUnique({
      where: { id },
      select: {
        // Basic patient info - essential demographics
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        birthDate: true,
        csdIdOrPwdId: true,
        mobileNumber: true,
        residentialAddress: true,
        createdAt: true,
        updatedAt: true,
        
        // Staff info (lightweight) - for audit trail display
        creator: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        },
        updater: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        },
        
        // Medical documentation PREVIEW only - optimized for table display
        medicalDocumentations: {
          select: {
            id: true,
            createdAt: true,    // Date for table sorting and display
            status: true,       // Status for visual badges
            // EXCLUDED: subjective, objective, assessment, prescription (heavy text fields)
          },
          orderBy: {
            createdAt: 'desc'   // Most recent first for quick access
          },
          take: 10              // Limit to prevent data overload in preview
        }
      }
    });

    if (!patient) {
      fastify.log.warn(
        { patientId: id, operation: 'getOnePatientService' },
        "Patient not found in database - possibly deleted or invalid ID"
      );
      throw new Error("Patient not found");
    }

    fastify.log.info(
      { 
        patientId: id, 
        previewDocsCount: patient.medicalDocumentations.length,
        operation: 'getOnePatientService'
      },
      "Patient profile preview retrieved successfully"
    );

    return patient;

  } catch (err: unknown) {
    if (err instanceof Error) {
      fastify.log.error(
        { 
          err: err.message, 
          patientId: id, 
          operation: 'getOnePatientService',
          errorType: 'KnownError'
        },
        "Failed to retrieve patient details - known error occurred"
      );
    } else {
      fastify.log.error(
        { 
          err, 
          patientId: id, 
          operation: 'getOnePatientService',
          errorType: 'UnknownError'
        },
        "Failed to retrieve patient details - unknown error type encountered"
      );
    }
    
    throw err;
  }
}